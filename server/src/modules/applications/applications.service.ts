import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma, application_status_enum } from '@prisma/client';
import { EventEmitter } from 'node:events';
import { PrismaService } from '../../prisma/prisma.service';
import { DepartmentSyncService } from '../../integrations/performx/department-sync.service';
import type {
  ApplicationDetailDto,
  ApplicationListItemDto,
  ApplicationListResponseDto,
} from './dto/application-response.dto';
import type { AssignHrDto } from './dto/assign-hr.dto';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { QueryApplicationsDto } from './dto/query-applications.dto';
import type { UpdateStatusDto } from './dto/update-status.dto';

const DUPLICATE_ACTIVE_STATUSES: application_status_enum[] = ['NEW', 'SLOT_BOOKED', 'INTERVIEWED'];
const STATUS_TRANSITIONS: Record<application_status_enum, application_status_enum[]> = {
  NEW: ['SLOT_BOOKED', 'REJECTED', 'WITHDRAWN'],
  SLOT_BOOKED: ['INTERVIEWED', 'WITHDRAWN'],
  INTERVIEWED: ['SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: ['OFFER_RELEASED', 'REJECTED', 'WITHDRAWN'],
  OFFER_RELEASED: ['JOINED', 'REJECTED', 'WITHDRAWN'],
  JOINED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

const applicationListSelect = {
  id: true,
  application_code: true,
  status: true,
  created_at: true,
  updated_at: true,
  candidate: {
    select: { id: true, full_name: true, email: true, mobile_number: true },
  },
  department: {
    select: { id: true, name: true },
  },
  assigned_hr: {
    select: { id: true, full_name: true, email: true },
  },
} satisfies Prisma.applicationsSelect;

const applicationDetailSelect = {
  ...applicationListSelect,
  self_description: true,
  rejection_reason: true,
  _count: {
    select: { hr_notes: true, interview_feedback: true },
  },
  slot_assignment: {
    select: { id: true },
  },
} satisfies Prisma.applicationsSelect;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter,
    private readonly departmentSync: DepartmentSyncService,
  ) {}

  async create(dto: CreateApplicationDto): Promise<ApplicationDetailDto> {
    try {
      // Validate department_id against PerformX (Single Source of Truth)
      const isDepartmentValid = await this.departmentSync.validateDepartmentId(dto.departmentId);
      if (!isDepartmentValid) {
        throw new BadRequestException('Invalid department: department does not exist in PerformX');
      }

      return await this.prisma.$transaction(async (tx) => {
        const opportunity = await tx.hiring_opportunities.findFirst({
          where: { 
             department_id: dto.departmentId,
             status: 'PUBLISHED'
          },
          select: { id: true, application_deadline: true, resume_required: true }
        });
        if (!opportunity) throw new ConflictException('Opportunity is not available');
        
        if (opportunity.application_deadline && new Date(opportunity.application_deadline) < new Date()) {
          throw new ConflictException('Application deadline has passed');
        }

        if (opportunity.resume_required && !dto.resumePath) {
          throw new BadRequestException('Resume is mandatory for this opportunity');
        }

        let candidate = await tx.candidates.findFirst({
          where: { 
             OR: [
               { email: dto.email },
               { mobile_number: dto.mobileNumber }
             ],
             deleted_at: null
          },
          select: { id: true },
        });

        if (!candidate) {
          candidate = await tx.candidates.create({
            data: {
              full_name: dto.fullName,
              email: dto.email,
              mobile_number: dto.mobileNumber,
              whatsapp_number: dto.whatsappNumber ?? null,
            },
            select: { id: true }
          });
        }

        const duplicate = await tx.applications.findFirst({
          where: {
            candidate_id: candidate.id,
            hiring_opportunity_id: opportunity.id,
            deleted_at: null,
            status: { in: DUPLICATE_ACTIVE_STATUSES },
          },
          select: { id: true },
        });
        if (duplicate) throw new ConflictException('Duplicate active application');

        const applicationCode = await this.generateApplicationCode(tx);

        const application = await tx.applications.create({
          data: {
            application_code: applicationCode,
            candidate_id: candidate.id,
            department_id: dto.departmentId,
            hiring_opportunity_id: opportunity.id,
            assigned_hr_id: null, // HR is dynamically assigned after interview booking
            self_description: dto.selfDescription,
            status: 'NEW',
            status_history: {
              create: {
                from_status: null,
                to_status: 'NEW',
                changed_by_id: null,
                reason: 'Application submitted',
              },
            },
            ...(dto.resumePath ? {
              files: {
                create: {
                  file_type: 'RESUME',
                  storage_path: dto.resumePath,
                  file_name: dto.resumePath.split('/').pop() || 'resume.pdf'
                }
              }
            } : {})
          },
          select: applicationDetailSelect,
        });

        const data = this.toDetail(application);
        this.events.emit('ApplicationCreated', { applicationId: application.id });
        return data;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }

  }

  async findAll(query: QueryApplicationsDto, user?: any): Promise<ApplicationListResponseDto> {
    try {
      const where = this.buildWhere(query, user);
      const rows = await this.prisma.applications.findMany({
        where,
        select: applicationListSelect,
        orderBy: this.getOrderBy(query),
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });

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

  async findOne(id: string, user?: any): Promise<ApplicationDetailDto> {
    const application = await this.findActiveApplication(id);
    if (user) {
      const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
      if (!isElevated && application.assigned_hr?.id !== user.sub) {
        throw new NotFoundException(`Application with ID ${id} not found or you don't have permission`);
      }
    }
    return this.toDetail(application);
  }

  async getTimeline(id: string, user?: any, query?: any) {
    const application = await this.prisma.applications.findUnique({
      where: { id, deleted_at: null },
      include: {
        status_history: { include: { changed_by: true } },
        hr_notes: { include: { hr: true } },
        candidate: true,
        files: true,
        slot_assignment: { include: { assigned_hr: true, slot: true } },
        interview_feedback: { include: { hr: true } }
      }
    });

    if (!application) throw new NotFoundException('Application not found');

    if (user) {
      const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
      if (!isElevated && application.assigned_hr_id !== user.sub) {
        throw new NotFoundException('Application not found');
      }
    }

    let events = [];

    events.push({
      eventType: 'APPLICATION_SUBMITTED',
      timestamp: application.created_at,
      metadata: {}
    });

    for (const sh of application.status_history) {
      events.push({
        eventType: 'STATUS_CHANGED',
        timestamp: sh.created_at,
        actor: sh.changed_by ? { id: sh.changed_by.id, name: sh.changed_by.full_name } : undefined,
        previousStatus: sh.from_status,
        currentStatus: sh.to_status,
        reason: sh.reason,
        metadata: {}
      });
    }

    for (const note of application.hr_notes) {
      events.push({
        eventType: 'HR_NOTE_ADDED',
        timestamp: note.created_at,
        actor: note.hr ? { id: note.hr.id, name: note.hr.full_name } : undefined,
        metadata: { noteId: note.id }
      });
    }

    for (const file of application.files) {
      events.push({
        eventType: 'DOCUMENT_UPLOADED',
        timestamp: file.created_at,
        metadata: { fileType: file.file_type, fileName: file.file_name }
      });
    }

    if (application.slot_assignment) {
      const sa = application.slot_assignment;
      events.push({
        eventType: 'INTERVIEW_SCHEDULED',
        timestamp: sa.assigned_at,
        actor: sa.assigned_hr ? { id: sa.assigned_hr.id, name: sa.assigned_hr.full_name } : undefined,
        metadata: {
          slotDate: sa.slot.slot_date,
          slotId: sa.slot.id
        }
      });
    }

    for (const fb of application.interview_feedback) {
      events.push({
        eventType: 'INTERVIEW_FEEDBACK_ADDED',
        timestamp: fb.created_at,
        actor: fb.hr ? { id: fb.hr.id, name: fb.hr.full_name } : undefined,
        metadata: { rating: fb.rating }
      });
    }

    if (query?.eventType) {
      events = events.filter(e => e.eventType === query.eventType);
    }
    if (query?.dateFrom) {
      events = events.filter(e => e.timestamp >= new Date(query.dateFrom));
    }
    if (query?.dateTo) {
      events = events.filter(e => e.timestamp <= new Date(query.dateTo));
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return events;
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: any,
  ): Promise<ApplicationDetailDto> {
    try {
      const actorId = user?.sub ?? null;
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.applications.findFirst({
          where: { id, deleted_at: null },
          select: { id: true, status: true, assigned_hr_id: true },
        });
        if (!existing) throw new NotFoundException('Application not found');

        if (user) {
          const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
          if (!isElevated && existing.assigned_hr_id !== user.sub) {
            throw new ConflictException('Conflict: Unauthorized to update this application');
          }
        }

        const allowed = STATUS_TRANSITIONS[existing.status];
        if (!allowed.includes(dto.status)) throw new ConflictException('Conflict');

        const updated = await tx.applications.update({
          where: { id },
          data: {
            status: dto.status,
            rejection_reason: dto.status === 'REJECTED' ? dto.reason : null,
            updated_at: new Date(),
            status_history: {
              create: {
                from_status: existing.status,
                to_status: dto.status,
                changed_by_id: actorId,
                reason: dto.reason,
              },
            },
          },
          select: applicationDetailSelect,
        });

        const data = this.toDetail(updated);
        this.events.emit('StatusChanged', {
          applicationId: updated.id,
          fromStatus: existing.status,
          toStatus: updated.status,
        });
        if (updated.status === 'SELECTED') {
          this.events.emit('ApplicationSelected', { applicationId: updated.id });
        }
        if (updated.status === 'REJECTED') {
          this.events.emit('ApplicationRejected', { applicationId: updated.id });
        }
        return data;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async assignHr(id: string, dto: AssignHrDto): Promise<ApplicationDetailDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const application = await tx.applications.findFirst({
          where: { id, deleted_at: null },
          select: { id: true, department_id: true },
        });
        if (!application) throw new NotFoundException('Application not found');

        const hr = await tx.hr_employees.findFirst({
          where: { id: dto.hrId, is_active: true },
          select: { id: true, department_id: true },
        });
        if (!hr) throw new NotFoundException('HR not found');
        if (hr.department_id && hr.department_id !== application.department_id) {
          throw new ConflictException('Conflict');
        }

        const updated = await tx.applications.update({
          where: { id },
          data: { assigned_hr_id: dto.hrId, updated_at: new Date() },
          select: applicationDetailSelect,
        });

        return this.toDetail(updated);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async remove(id: string): Promise<ApplicationDetailDto> {
    try {
      await this.findActiveApplication(id);
      const deleted = await this.prisma.applications.update({
        where: { id },
        data: { deleted_at: new Date(), updated_at: new Date() },
        select: applicationDetailSelect,
      });
      return this.toDetail(deleted);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private async generateApplicationCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `RC-${year}-`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${year})`;

    const count = await tx.applications.count({
      where: { application_code: { startsWith: prefix } },
    });
    const next = count + 1;
    if (next > 999999) throw new ConflictException('Conflict');
    return `${prefix}${String(next).padStart(6, '0')}`;
  }

  private buildWhere(query: QueryApplicationsDto, user?: any): Prisma.applicationsWhereInput {
    let enforcedHrId = query.assignedHrId;
    if (user) {
      const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
      if (!isElevated) {
        enforcedHrId = user.sub; // Force filter to only show candidates assigned to this HR
      }
    }

    const opportunityWhere: any = {};
    if (query.careerLevel) opportunityWhere.career_level = query.careerLevel;
    if (query.hiringType) opportunityWhere.hiring_type = query.hiringType;
    if (query.hiringPriority) opportunityWhere.hiring_priority = query.hiringPriority;
    if (query.workMode) opportunityWhere.work_mode = query.workMode;
    if (query.location) opportunityWhere.location = { contains: query.location, mode: 'insensitive' };
    
    if (query.minExperience !== undefined || query.maxExperience !== undefined) {
       opportunityWhere.min_experience_years = {};
       if (query.minExperience !== undefined) opportunityWhere.min_experience_years.gte = query.minExperience;
       if (query.maxExperience !== undefined) opportunityWhere.min_experience_years.lte = query.maxExperience;
    }

    return {
      deleted_at: null,
      ...(query.departmentId ? { department_id: query.departmentId } : {}),
      ...(query.hiringOpportunityId ? { hiring_opportunity_id: query.hiringOpportunityId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(enforcedHrId ? { assigned_hr_id: enforcedHrId } : {}),
      ...(Object.keys(opportunityWhere).length > 0 ? { hiring_opportunity: opportunityWhere } : {}),
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
              { application_code: { contains: query.search, mode: 'insensitive' } },
              { candidate: { full_name: { contains: query.search, mode: 'insensitive' } } },
              { candidate: { email: { contains: query.search, mode: 'insensitive' } } },
              { candidate: { mobile_number: { contains: query.search } } },
              { hiring_opportunity: { internal_position: { contains: query.search, mode: 'insensitive' } } },
              { department: { name: { contains: query.search, mode: 'insensitive' } } },
              { assigned_hr: { full_name: { contains: query.search, mode: 'insensitive' } } }
            ],
          }
        : {}),
    };
  }

  private getOrderBy(query: QueryApplicationsDto): Prisma.applicationsOrderByWithRelationInput[] {
    const order = query.sortOrder || 'desc';
    if (query.sortBy === 'candidateName') return [{ candidate: { full_name: order } }];
    if (query.sortBy === 'department') return [{ department: { name: order } }];
    if (query.sortBy === 'assignedHr') return [{ assigned_hr: { full_name: order } }];
    if (query.sortBy === 'priority') return [{ hiring_opportunity: { hiring_priority: order } }];
    if (query.sortBy === 'status') return [{ status: order }];
    
    // Default or explicitly createdAt/updatedAt
    const field = query.sortBy === 'updatedAt' ? 'updated_at' : 'created_at';
    return [{ [field]: order }, { id: 'asc' }];
  }

  private async findActiveApplication(id: string) {
    try {
      const application = await this.prisma.applications.findFirst({
        where: { id, deleted_at: null },
        select: applicationDetailSelect,
      });
      if (!application) throw new NotFoundException('Application not found');
      return application;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private toListItem(
    application: Prisma.applicationsGetPayload<{ select: typeof applicationListSelect }>,
  ): ApplicationListItemDto {
    return {
      id: application.id,
      applicationCode: application.application_code,
      status: application.status,
      candidate: {
        id: application.candidate.id,
        fullName: application.candidate.full_name,
        email: application.candidate.email,
        mobileNumber: application.candidate.mobile_number,
      },
      department: {
        id: application.department.id,
        name: application.department.name,
      },
      assignedHr: application.assigned_hr
        ? {
            id: application.assigned_hr.id,
            fullName: application.assigned_hr.full_name,
            email: application.assigned_hr.email,
          }
        : null,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
    };
  }

  private toDetail(
    application: Prisma.applicationsGetPayload<{ select: typeof applicationDetailSelect }>,
  ): ApplicationDetailDto {
    return {
      ...this.toListItem(application),
      selfDescription: application.self_description,
      rejectionReason: application.rejection_reason,
      notesCount: application._count.hr_notes,
      latestInterviewStatus:
        application._count.interview_feedback > 0
          ? 'INTERVIEWED'
          : application.slot_assignment
            ? 'SLOT_BOOKED'
            : null,
    };
  }

  async generateOffer(id: string, payload: any, user: any) {
    const application = await this.findActiveApplication(id);
    
    // Validate authorization
    const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
    if (!isElevated && application.assigned_hr?.id !== user.sub) {
      throw new ConflictException('Unauthorized to generate offer for this candidate');
    }

    // Candidate Eligibility
    const validStages = ['SHORTLISTED', 'SELECTED', 'OFFER_RELEASED'];
    if (!validStages.includes(application.status)) {
      throw new ConflictException(`Cannot generate offer for candidate in ${application.status} status`);
    }

    // Build Offer payload
    const offerData = {
      type: 'OFFER_DOCUMENT',
      status: 'DRAFT',
      ...payload,
      version: Date.now()
    };

    // Store offer in hr_notes as structured JSON
    const note = await this.prisma.hr_notes.create({
      data: {
        application_id: id,
        hr_id: user.sub,
        note: JSON.stringify(offerData)
      }
    });

    // Record Timeline Event
    this.events.emit('ApplicationEvent', {
      eventType: 'OFFER_GENERATED',
      applicationId: id,
      metadata: { offerId: note.id, version: offerData.version }
    });

    return { success: true, offer: offerData };
  }

  async updateOfferStatus(id: string, offerStatus: string, user: any) {
    const application = await this.findActiveApplication(id);
    
    const isElevated = user.permissions?.includes('CAREER_ADMIN') || user.permissions?.includes('CAREER_REPORTS');
    if (!isElevated && application.assigned_hr?.id !== user.sub) {
      throw new ConflictException('Unauthorized');
    }

    const latestOfferNote = await this.prisma.hr_notes.findFirst({
      where: { application_id: id, note: { startsWith: '{"type":"OFFER_DOCUMENT"' } },
      orderBy: { created_at: 'desc' }
    });

    if (!latestOfferNote) {
      throw new NotFoundException('No active offer found');
    }

    const offerData = JSON.parse(latestOfferNote.note);
    offerData.status = offerStatus;

    // Save updated offer status
    const note = await this.prisma.hr_notes.create({
      data: {
        application_id: id,
        hr_id: user.sub,
        note: JSON.stringify(offerData)
      }
    });

    // Map Offer Status to Application Status if needed
    let appStatusToUpdate = null;
    if (offerStatus === 'RELEASED') appStatusToUpdate = 'OFFER_RELEASED';
    if (offerStatus === 'ACCEPTED' || offerStatus === 'JOINED') appStatusToUpdate = 'JOINED';
    if (offerStatus === 'DECLINED' || offerStatus === 'EXPIRED') appStatusToUpdate = 'REJECTED';
    if (offerStatus === 'CANCELLED') appStatusToUpdate = 'WITHDRAWN';

    if (appStatusToUpdate && appStatusToUpdate !== application.status) {
      await this.updateStatus(id, { 
        status: appStatusToUpdate as application_status_enum, 
        reason: `Offer ${offerStatus}` 
      }, user);
    } else {
       // Just emit timeline event if no application status change
       this.events.emit('ApplicationEvent', {
         eventType: `OFFER_${offerStatus}`,
         applicationId: id,
         metadata: { offerId: note.id }
       });
    }

    // Notifications (Publish business events only)
    if (offerStatus === 'RELEASED') this.events.emit('OfferReleased', { applicationId: id, offer: offerData });
    if (offerStatus === 'ACCEPTED') this.events.emit('OfferAccepted', { applicationId: id });
    if (offerStatus === 'DECLINED') this.events.emit('OfferDeclined', { applicationId: id });

    return { success: true, offer: offerData };
  }

  async bulkUpdateStatus(applicationIds: string[], status: any, reason: string | undefined, user: any) {
    const summary = { total: applicationIds.length, successful: 0, failed: 0, errors: [] as any[] };
    for (const id of applicationIds) {
      try {
        await this.updateStatus(id, { status, reason: reason ?? null }, user);
        summary.successful++;
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({ id, message: error.message || 'Failed to update status' });
      }
    }
    
    if (summary.successful > 0) {
      this.events.emit('BulkOperationCompleted', { type: 'BULK_STATUS_UPDATE', actor: user.sub, count: summary.successful });
    }
    return summary;
  }

  async bulkAssignHr(applicationIds: string[], hrId: string, user: any) {
    const summary = { total: applicationIds.length, successful: 0, failed: 0, errors: [] as any[] };
    for (const id of applicationIds) {
      try {
        await this.assignHr(id, { hrId });
        summary.successful++;
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({ id, message: error.message || 'Failed to assign HR' });
      }
    }
    
    if (summary.successful > 0) {
      this.events.emit('BulkOperationCompleted', { type: 'BULK_HR_ASSIGNMENT', actor: user.sub, count: summary.successful });
    }
    return summary;
  }

  async bulkArchive(applicationIds: string[], user: any) {
    const summary = { total: applicationIds.length, successful: 0, failed: 0, errors: [] as any[] };
    for (const id of applicationIds) {
      try {
        await this.remove(id); // remove sets deleted_at
        summary.successful++;
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({ id, message: error.message || 'Failed to archive' });
      }
    }
    
    if (summary.successful > 0) {
      this.events.emit('BulkOperationCompleted', { type: 'BULK_ARCHIVE', actor: user.sub, count: summary.successful });
    }
    return summary;
  }
}
