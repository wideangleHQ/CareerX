import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { Prisma, application_status_enum } from '@prisma/client';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import type { CreateFeedbackDto } from './dto/create-feedback.dto';
import type { FeedbackFilterDto } from './dto/feedback-filter.dto';
import type { UpdateFeedbackDto } from './dto/update-feedback.dto';
import {
  InterviewFeedbackRepository,
  feedbackDetailSelect,
  feedbackListSelect,
} from './interview-feedback.repository';

type FeedbackListRow = {
  id: string;
  rating: number;
  notes: string | null;
  created_at: Date;
  application: {
    id: string;
    application_code: string;
    status: application_status_enum;
    candidate: { id: string; full_name: string; email: string };
    department: { id: string; name: string };
  };
  hr: { id: string; full_name: string; email: string };
};
type FeedbackDetailRow = Prisma.interview_feedbackGetPayload<{ select: typeof feedbackDetailSelect }>;

export interface FeedbackResponseDto {
  id: string;
  rating: number;
  notes: string | null;
  application: {
    id: string;
    applicationCode: string;
    status: application_status_enum;
    selfDescription?: string;
    candidate: {
      id: string;
      fullName: string;
      email: string;
      mobileNumber?: string;
    };
    department: { id: string; name: string };
    interviewSlot?: {
      id: string;
      slotDate: Date;
      slotTime: Date;
      assignedHrId: string;
    } | null;
  };
  hr: { id: string; fullName: string; email: string };
  createdAt: Date;
}

@Injectable()
export class InterviewFeedbackService {
  constructor(
    private readonly repository: InterviewFeedbackRepository,
    private readonly events: EventEmitter,
  ) {}

  async create(dto: CreateFeedbackDto, user: CareerJwtPayload): Promise<FeedbackResponseDto> {
    try {
      const created = await this.repository.client.$transaction(async (tx) => {
        const application = await tx.applications.findFirst({
          where: { id: dto.applicationId, deleted_at: null },
          select: {
            id: true,
            status: true,
            assigned_hr_id: true,
            slot_assignment: { select: { slot_id: true, assigned_hr_id: true } },
          },
        });
        if (!application) throw new NotFoundException('Application not found');
        if (!['SLOT_BOOKED', 'INTERVIEWED'].includes(application.status)) {
          throw new ConflictException('Conflict');
        }

        const slot = await tx.interview_slots.findUnique({
          where: { id: dto.interviewSlotId },
          select: { id: true },
        });
        if (!slot) throw new NotFoundException('Interview Slot not found');
        if (application.slot_assignment?.slot_id !== dto.interviewSlotId) {
          throw new ConflictException('Conflict');
        }

        const isAdmin = user.permissions.includes('CAREER_ADMIN');
        const assignedHrId = application.assigned_hr_id ?? application.slot_assignment.assigned_hr_id;
        if (!assignedHrId || (!isAdmin && assignedHrId !== user.sub)) {
          throw new ForbiddenException('Forbidden');
        }

        const feedback = await tx.interview_feedback.create({
          data: {
            application_id: dto.applicationId,
            hr_id: user.sub,
            rating: dto.rating,
            notes: dto.notes,
          },
          select: feedbackDetailSelect,
        });

        if (application.status !== 'INTERVIEWED') {
          await tx.applications.update({
            where: { id: dto.applicationId },
            data: {
              status: 'INTERVIEWED',
              updated_at: new Date(),
              status_history: {
                create: {
                  from_status: application.status,
                  to_status: 'INTERVIEWED',
                  changed_by_id: user.sub,
                  reason: 'Interview feedback submitted',
                },
              },
            },
            select: { id: true },
          });
        } else {
          await tx.status_history.create({
            data: {
              application_id: dto.applicationId,
              from_status: 'INTERVIEWED',
              to_status: 'INTERVIEWED',
              changed_by_id: user.sub,
              reason: 'Interview feedback submitted',
            },
            select: { id: true },
          });
        }

        return feedback;
      });

      this.events.emit('InterviewFeedbackCreated', {
        feedbackId: created.id,
        applicationId: created.application.id,
        hrId: created.hr.id,
      });
      this.events.emit('InterviewCompleted', {
        applicationId: created.application.id,
        hrId: created.hr.id,
      });

      return this.toDetail(created);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAll(query: FeedbackFilterDto) {
    try {
      const rows = (await this.repository.findMany({
        where: this.buildWhere(query),
        select: feedbackListSelect,
        orderBy: this.getOrderBy(query),
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      })) as unknown as FeedbackListRow[];

      const hasMore = rows.length > query.limit;
      const data = rows.slice(0, query.limit).map((row) => this.toListItem(row));
      return {
        success: true,
        data,
        pagination: {
          limit: query.limit,
          nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
          hasMore,
        },
      };
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findOne(id: string): Promise<FeedbackResponseDto> {
    try {
      const feedback = await this.repository.findById(id, feedbackDetailSelect);
      if (!feedback) throw new NotFoundException('Feedback not found');
      return this.toDetail(feedback as FeedbackDetailRow);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async update(
    id: string,
    dto: UpdateFeedbackDto,
    user: CareerJwtPayload,
  ): Promise<FeedbackResponseDto> {
    try {
      const updated = await this.repository.client.$transaction(async (tx) => {
        const existing = await tx.interview_feedback.findUnique({
          where: { id },
          select: { id: true, rating: true, notes: true },
        });
        if (!existing) throw new NotFoundException('Feedback not found');

        const feedback = await tx.interview_feedback.update({
          where: { id },
          data: {
            ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
            ...(Object.hasOwn(dto, 'notes') ? { notes: dto.notes ?? null } : {}),
          },
          select: feedbackDetailSelect,
        });

        await tx.audit_logs.create({
          data: {
            actor_id: user.sub,
            action: 'INTERVIEW_FEEDBACK_UPDATED',
            entity: 'interview_feedback',
            entity_id: id,
            old_value: JSON.stringify(existing),
            new_value: JSON.stringify({ rating: feedback.rating, notes: feedback.notes }),
          },
          select: { id: true },
        });

        return feedback;
      });
      return this.toDetail(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async remove(id: string): Promise<never> {
    const feedback = await this.repository.findById(id, { id: true });
    if (!feedback) throw new NotFoundException('Feedback not found');
    throw new ConflictException('Deletion is not supported for interview feedback');
  }

  private buildWhere(query: FeedbackFilterDto): Prisma.interview_feedbackWhereInput {
    return {
      ...(query.applicationId ? { application_id: query.applicationId } : {}),
      ...(query.hrId ? { hr_id: query.hrId } : {}),
      ...(query.rating ? { rating: query.rating } : {}),
      ...(query.departmentId ? { application: { department_id: query.departmentId } } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            created_at: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { application: { application_code: { contains: query.search, mode: 'insensitive' } } },
              {
                application: {
                  candidate: { full_name: { contains: query.search, mode: 'insensitive' } },
                },
              },
              {
                application: {
                  candidate: { email: { contains: query.search, mode: 'insensitive' } },
                },
              },
              { hr: { full_name: { contains: query.search, mode: 'insensitive' } } },
              { hr: { email: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
  }

  private getOrderBy(query: FeedbackFilterDto): Prisma.interview_feedbackOrderByWithRelationInput[] {
    const field = query.sortBy === 'rating' ? 'rating' : 'created_at';
    return [{ [field]: query.sortOrder }, { id: 'asc' }];
  }

  private toListItem(row: FeedbackListRow): FeedbackResponseDto {
    return {
      id: row.id,
      rating: row.rating,
      notes: row.notes,
      application: {
        id: row.application.id,
        applicationCode: row.application.application_code,
        status: row.application.status,
        candidate: {
          id: row.application.candidate.id,
          fullName: row.application.candidate.full_name,
          email: row.application.candidate.email,
        },
        department: {
          id: row.application.department.id,
          name: row.application.department.name,
        },
      },
      hr: {
        id: row.hr.id,
        fullName: row.hr.full_name,
        email: row.hr.email,
      },
      createdAt: row.created_at,
    };
  }

  private toDetail(row: FeedbackDetailRow): FeedbackResponseDto {
    const base = this.toListItem(row);
    return {
      ...base,
      application: {
        ...base.application,
        selfDescription: row.application.self_description,
        candidate: {
          ...base.application.candidate,
          mobileNumber: row.application.candidate.mobile_number,
        },
        interviewSlot: row.application.slot_assignment
          ? {
              id: row.application.slot_assignment.slot.id,
              slotDate: row.application.slot_assignment.slot.slot_date,
              slotTime: row.application.slot_assignment.slot.slot_time,
              assignedHrId: row.application.slot_assignment.assigned_hr_id,
            }
          : null,
      },
    };
  }
}
