import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EventEmitter } from 'node:events';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { BookSlotDto } from './dto/book-slot.dto';
import type { BulkGenerateSlotsDto } from './dto/bulk-generate-slots.dto';
import type { CreateSlotDto } from './dto/create-slot.dto';
import type { QuerySlotsDto } from './dto/query-slots.dto';
import { InterviewSlotsRepository } from './interview-slots.repository';

const AVAILABLE_CACHE_PREFIX = 'career:cache:interview-slots:available';
const AVAILABLE_CACHE_TTL_SECONDS = 120;

const slotSelect = {
  id: true,
  slot_date: true,
  slot_time: true,
  is_booked: true,
  is_recurring: true,
  hr: { select: { id: true, full_name: true, email: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.interview_slotsSelect;

export interface SlotResponse {
  id: string;
  slotDate: Date;
  slotTime: Date;
  isBooked: boolean;
  isRecurring: boolean;
  hr: { id: string; fullName: string; email: string };
  department: { id: string; name: string } | null;
}

export interface SlotListResponse {
  success: true;
  data: SlotResponse[];
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export interface BulkGenerateSlotsResponse {
  success: true;
  created: number;
  skipped: number;
}

@Injectable()
export class InterviewSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly repository: InterviewSlotsRepository,
    private readonly events: EventEmitter,
  ) {}

  async create(dto: CreateSlotDto): Promise<SlotResponse> {
    try {
      await this.validateHrAndDepartment(dto.hrId, dto.departmentId);
      this.assertFuture(dto.slotDate, dto.slotTime);

      const conflict = await this.repository.findConflict(dto.hrId, dto.slotDate, dto.slotTime);
      if (conflict) throw new ConflictException('Conflict');

      const slot = await this.repository.create(
        {
          hr_id: dto.hrId,
          department_id: dto.departmentId,
          slot_date: dto.slotDate,
          slot_time: dto.slotTime,
          is_recurring: dto.isRecurring,
        },
        slotSelect,
      );

      await this.invalidateAvailableCache();
      return this.toSlot(slot);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (this.isUniqueError(error)) throw new ConflictException('Conflict');
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async bulkGenerate(dto: BulkGenerateSlotsDto): Promise<BulkGenerateSlotsResponse> {
    try {
      await this.validateHrAndDepartment(dto.hrId, dto.departmentId);
      const dates = this.generateDates(dto);
      const rows = dates.flatMap((slotDate) =>
        dto.slotTimes
          .filter((slotTime) => this.isFuture(slotDate, slotTime))
          .map((slotTime) => ({
            hr_id: dto.hrId,
            department_id: dto.departmentId,
            slot_date: slotDate,
            slot_time: slotTime,
            is_recurring: true,
          })),
      );

      if (rows.length === 0) return { success: true, created: 0, skipped: 0 };

      const result = await this.prisma.interview_slots.createMany({
        data: rows,
        skipDuplicates: true,
      });
      await this.invalidateAvailableCache();
      return { success: true, created: result.count, skipped: rows.length - result.count };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAll(query: QuerySlotsDto): Promise<SlotListResponse> {
    try {
      const rows = await this.prisma.interview_slots.findMany({
        where: this.buildWhere(query),
        select: slotSelect,
        orderBy: [{ slot_date: query.sortOrder }, { slot_time: query.sortOrder }, { id: 'asc' }],
        take: query.availableOnly ? query.limit * 2 + 1 : query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });
      const visibleRows = query.availableOnly
        ? rows.filter((row) => this.isFuture(row.slot_date, row.slot_time))
        : rows;
      return this.toListResponse(visibleRows, query.limit);
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAvailable(query: QuerySlotsDto): Promise<SlotListResponse> {
    const cacheKey = `${AVAILABLE_CACHE_PREFIX}:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as SlotListResponse;
      } catch {
        await this.redis.del(cacheKey);
      }
    }

    const response = await this.findAll({ ...query, isBooked: false, availableOnly: true });
    await this.redis.set(cacheKey, JSON.stringify(response), AVAILABLE_CACHE_TTL_SECONDS);
    return response;
  }

  async book(dto: BookSlotDto): Promise<{ success: true; data: { assignmentId: string } }> {
    const lockKey = `career:lock:slot:${dto.slotId}`;
    const locked = await this.redis.setNx(lockKey, '1', 5);
    if (!locked) throw new ConflictException('Slot is currently being booked by someone else');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const slot = await tx.interview_slots.findUnique({
          where: { id: dto.slotId },
          select: {
            id: true,
            hr_id: true,
            department_id: true,
            slot_date: true,
            slot_time: true,
            is_booked: true,
            department: {
              select: {
                hiring_opportunities: {
                  where: { status: 'PUBLISHED' },
                  take: 1
                }
              }
            },
            hr: { select: { is_active: true } }
          },
        });
        
        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.is_booked || !this.isFuture(slot.slot_date, slot.slot_time)) {
          throw new ConflictException('Conflict: Slot is booked or in the past');
        }
        if (!slot.hr || !slot.hr.is_active) {
          throw new ConflictException('Conflict: Assigned HR is no longer active');
        }

        const opportunity = slot.department?.hiring_opportunities[0];
        if (slot.department_id && !opportunity) {
          throw new ConflictException('Conflict: Associated opportunity is not published');
        }
        if (opportunity?.application_deadline && new Date(opportunity.application_deadline) < new Date()) {
          throw new ConflictException('Conflict: Opportunity deadline has passed');
        }

        const application = await tx.applications.findFirst({
          where: { id: dto.applicationId, deleted_at: null },
          select: { id: true, department_id: true, status: true, application_code: true, slot_assignment: { select: { id: true } } },
        });
        if (!application) throw new NotFoundException('Application not found');
        if (application.status !== 'NEW' || application.slot_assignment) {
          throw new ConflictException('Conflict: Application is already processed or booked');
        }
        if (slot.department_id && slot.department_id !== application.department_id) {
          throw new ConflictException('Conflict: Department mismatch');
        }

        const updatedSlot = await tx.interview_slots.updateMany({
          where: { id: dto.slotId, is_booked: false },
          data: { is_booked: true, updated_at: new Date() },
        });
        if (updatedSlot.count !== 1) throw new ConflictException('Conflict: Slot is already booked');

        // HR Assignment Engine - Load Balancing
        const eligibleRoles = await tx.hr_role_permissions.findMany({
          where: { permission: 'CAREER_INTERVIEW' },
          select: { performx_role: true }
        });
        const roles = eligibleRoles.map(r => r.performx_role);

        const hrUsers = await tx.hr_employees.findMany({
          where: {
            is_active: true,
            performx_role: { in: roles },
            OR: [
              { department_id: application.department_id },
              { department_id: null }
            ]
          },
          select: {
            id: true,
            _count: {
              select: { 
                applications: { 
                  where: { 
                    status: { notIn: ['REJECTED', 'JOINED', 'WITHDRAWN'] },
                    deleted_at: null 
                  } 
                } 
              }
            }
          }
        });

        if (hrUsers.length === 0) {
          throw new ConflictException('Conflict: No eligible HR found for assignment');
        }

        hrUsers.sort((a, b) => {
          if (a._count.applications !== b._count.applications) {
            return a._count.applications - b._count.applications;
          }
          return a.id.localeCompare(b.id); // Deterministic tie-breaking
        });

        const selectedHrId = hrUsers[0]!.id;

        const created = await tx.slot_assignments.create({
          data: {
            application_id: dto.applicationId,
            slot_id: dto.slotId,
            assigned_hr_id: slot.hr_id, // Interviewer HR
          },
          select: { id: true, assigned_hr_id: true },
        });

        await tx.applications.update({
          where: { id: dto.applicationId },
          data: {
            status: 'SLOT_BOOKED',
            assigned_hr_id: selectedHrId, // Lifecycle Owner HR
            updated_at: new Date(),
            status_history: {
              create: {
                from_status: 'NEW',
                to_status: 'SLOT_BOOKED',
                changed_by_id: null,
                reason: 'Interview booked & HR load-balanced',
              },
            },
          },
          select: { id: true },
        });

        return { 
          created, 
          applicationCode: application.application_code, 
          slotDate: slot.slot_date, 
          slotTime: slot.slot_time,
          selectedHrId
        };
      });

      await this.invalidateAvailableCache();
      this.events.emit('InterviewBooked', {
        applicationId: dto.applicationId,
        hrId: result.created.assigned_hr_id,
      });
      this.events.emit('HrAssigned', {
        applicationId: dto.applicationId,
        hrId: result.selectedHrId,
      });

      return { 
        success: true, 
        data: { 
          bookingReference: result.applicationCode, 
          interviewDate: result.slotDate.toISOString(), 
          interviewTime: result.slotTime, 
          nextStepInstructions: 'Please check your email for the interview meeting link and instructions.' 
        } 
      } as any; // Type override since we are deliberately changing the payload per requirements
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (this.isUniqueError(error)) throw new ConflictException('Conflict');
      throw new InternalServerErrorException('Internal Server Error');
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async remove(id: string): Promise<{ success: true }> {
    try {
      const slot = await this.prisma.interview_slots.findUnique({
        where: { id },
        select: { id: true, slot_date: true, slot_time: true, is_booked: true },
      });
      if (!slot) throw new NotFoundException('Slot not found');
      if (slot.is_booked || !this.isFuture(slot.slot_date, slot.slot_time)) {
        throw new ConflictException('Conflict');
      }

      await this.prisma.interview_slots.delete({ where: { id }, select: { id: true } });
      await this.invalidateAvailableCache();
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private async validateHrAndDepartment(hrId: string, departmentId: string | null): Promise<void> {
    const hr = await this.repository.findHr(hrId);
    if (!hr) throw new NotFoundException('HR not found');

    if (departmentId) {
      const department = await this.repository.findDepartment(departmentId);
      if (!department) throw new NotFoundException('Department not found');
      if (hr.department_id && hr.department_id !== departmentId) throw new ConflictException('Conflict');
    }
  }

  private buildWhere(query: QuerySlotsDto): Prisma.interview_slotsWhereInput {
    return {
      ...(query.departmentId ? { OR: [{ department_id: query.departmentId }, { department_id: null }] } : {}),
      ...(query.hrId ? { hr_id: query.hrId } : {}),
      ...(query.date ? { slot_date: query.date } : {}),
      ...(query.isBooked !== undefined ? { is_booked: query.isBooked } : {}),
      ...(query.availableOnly ? { 
        slot_date: { gte: this.todayUtc() },
        department: {
          hiring_opportunities: {
            some: { status: 'PUBLISHED' }
          }
        }
      } : {}),
    };
  }

  private generateDates(dto: BulkGenerateSlotsDto): Date[] {
    const dates: Date[] = [];
    const current = new Date(dto.startDate);
    while (current <= dto.endDate && dates.length < 370) {
      dates.push(new Date(current));
      if (dto.frequency === 'DAILY') current.setUTCDate(current.getUTCDate() + 1);
      else if (dto.frequency === 'WEEKLY') current.setUTCDate(current.getUTCDate() + 7);
      else current.setUTCMonth(current.getUTCMonth() + 1);
    }
    return dates;
  }

  private toListResponse(
    rows: Array<Prisma.interview_slotsGetPayload<{ select: typeof slotSelect }>>,
    limit: number,
  ): SlotListResponse {
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).map((row) => this.toSlot(row));
    return {
      success: true,
      data,
      pagination: { limit, nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null, hasMore },
    };
  }

  private toSlot(slot: Prisma.interview_slotsGetPayload<{ select: typeof slotSelect }>): SlotResponse {
    return {
      id: slot.id,
      slotDate: slot.slot_date,
      slotTime: slot.slot_time,
      isBooked: slot.is_booked,
      isRecurring: slot.is_recurring,
      hr: { id: slot.hr.id, fullName: slot.hr.full_name, email: slot.hr.email },
      department: slot.department ? { id: slot.department.id, name: slot.department.name } : null,
    };
  }

  private assertFuture(slotDate: Date, slotTime: Date): void {
    if (!this.isFuture(slotDate, slotTime)) throw new ConflictException('Conflict');
  }

  private isFuture(slotDate: Date, slotTime: Date): boolean {
    const slotAt = new Date(slotDate);
    slotAt.setUTCHours(slotTime.getUTCHours(), slotTime.getUTCMinutes(), 0, 0);
    return slotAt > new Date();
  }

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private async invalidateAvailableCache(): Promise<void> {
    await this.redis.delByPattern(`${AVAILABLE_CACHE_PREFIX}:*`);
  }

  private isUniqueError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
  }
}
