import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { log_status_enum } from '@prisma/client';
import { EventEmitter } from 'node:events';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailRepository } from './email.repository';
import type { EmailLogQuery } from './email.repository';
import type { SendEmailDto } from './dto/send-email.dto';
import {
  renderApplicationReceivedTemplate,
} from './templates/application-received.template';
import type { RenderedEmail } from './templates/application-received.template';
import { renderApplicationRejectedTemplate } from './templates/application-rejected.template';
import { renderApplicationSelectedTemplate } from './templates/application-selected.template';
import { renderInterviewInvitationTemplate } from './templates/interview-invitation.template';
import { renderInterviewReminderTemplate } from './templates/interview-reminder.template';
import { renderInterviewCancelledTemplate } from './templates/interview-cancelled.template';
import { renderInterviewRescheduledTemplate } from './templates/interview-rescheduled.template';
import { renderCandidateShortlistedTemplate } from './templates/candidate-shortlisted.template';
import { renderOfferReleasedTemplate } from './templates/offer-released.template';
import { renderHrAssignmentTemplate } from './templates/hr-assignment.template';

// Legacy constants for backward compatibility 
export const EMAIL_QUEUE_KEY = 'career:queue:email';
export const EMAIL_RETRY_KEY = 'career:queue:email:retry';
export const EMAIL_MAX_ATTEMPTS = 3;

export interface EmailJob {
  logId: string;
  recipient: string;
  rendered: RenderedEmail;
  attachments: SendEmailDto['attachments'];
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly repository: EmailRepository,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter,
    @InjectQueue('email') private readonly emailQueue: Queue<EmailJob>
  ) {}

  onModuleInit() {
    this.events.on('InterviewBooked', (event: { applicationId: string; hrId: string }) => {
      this.handleInterviewBooked(event).catch((err) => console.error('Failed to send interview email:', err));
    });
  }

  private async handleInterviewBooked(event: { applicationId: string; hrId: string }) {
    const application = await this.prisma.applications.findUnique({
      where: { id: event.applicationId },
      include: {
        candidate: true,
        department: true,
        slot_assignment: { include: { slot: true } },
      },
    });

    if (!application || !application.candidate || !application.slot_assignment) return;

    const slot = application.slot_assignment.slot;
    const interviewDate = slot.slot_date.toISOString().split('T')[0];
    const timeParts = slot.slot_time.toISOString().split('T')[1];
    const interviewTime = timeParts ? timeParts.substring(0, 5) : '00:00';

    await this.queueEmail({
      applicationId: application.id,
      recipients: [application.candidate.email],
      template: 'interview-invitation',
      variables: {
        candidateName: application.candidate.full_name,
        companyName: 'PerformX',
        jobTitle: application.department.name,
        interviewDate: interviewDate ?? '',
        interviewTime: interviewTime,
        meetingLink: '',
        portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      attachments: [],
    });
  }

  async queueEmail(dto: SendEmailDto): Promise<{ success: true; queued: number }> {
    try {
      const rendered = this.render(dto);
      let queued = 0;

      for (const recipient of dto.recipients) {
        const log = await this.repository.createQueuedLog({
          applicationId: dto.applicationId,
          recipient,
          template: dto.template,
        });
        
        const job: EmailJob = {
          logId: log.id,
          recipient,
          rendered,
          attachments: dto.attachments,
        };

        await this.emailQueue.add('send-email', job, {
          attempts: EMAIL_MAX_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        });

        queued += 1;
      }

      return { success: true, queued };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  getLogs(query: Record<string, unknown>) {
    return this.repository.findLogs(this.parseLogQuery(query));
  }

  // Monitoring method for queue stats
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(), 
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
      ]);

      return {
        queue: 'email',
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        health: failed.length > waiting.length ? 'WARNING' : 'HEALTHY',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats:', error);
      return {
        queue: 'email',
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        health: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Get failed jobs for debugging
  async getFailedJobs(limit: number = 10) {
    try {
      const failed = await this.emailQueue.getFailed(0, limit - 1);
      return failed.map(job => ({
        id: job.id,
        data: job.data,
        error: job.failedReason,
        attempts: job.attemptsMade,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
      }));
    } catch (error) {
      this.logger.error('Failed to get failed jobs:', error);
      return [];
    }
  }

  private render(dto: SendEmailDto): RenderedEmail {
    switch (dto.template) {
      case 'application-received':
        return renderApplicationReceivedTemplate(dto.variables);
      case 'application-selected':
        return renderApplicationSelectedTemplate(dto.variables);
      case 'application-rejected':
        return renderApplicationRejectedTemplate(dto.variables);
      case 'interview-invitation':
        return renderInterviewInvitationTemplate(dto.variables);
      case 'interview-reminder':
        return renderInterviewReminderTemplate(dto.variables);
      case 'interview-cancelled':
        return renderInterviewCancelledTemplate(dto.variables);
      case 'interview-rescheduled':
        return renderInterviewRescheduledTemplate(dto.variables);
      case 'candidate-shortlisted':
        return renderCandidateShortlistedTemplate(dto.variables);
      case 'offer-released':
        return renderOfferReleasedTemplate(dto.variables);
      case 'hr-assignment':
        return renderHrAssignmentTemplate(dto.variables);
      default:
        throw new Error(`Unknown email template: ${String(dto.template)}`);
    }
  }

  private parseLogQuery(query: Record<string, unknown>): EmailLogQuery {
    const allowed = new Set(['cursor', 'limit', 'recipient', 'status', 'search', 'dateFrom', 'dateTo']);
    if (Object.keys(query).some((key) => !allowed.has(key))) {
      throw new BadRequestException('Validation Error');
    }
    const dateFrom = this.parseDate(query.dateFrom);
    const dateTo = this.parseDate(query.dateTo);
    if (dateFrom && dateTo && dateFrom > dateTo) throw new BadRequestException('Validation Error');

    return {
      ...this.optionalStringProperty('cursor', query.cursor, 80),
      limit: this.parseLimit(query.limit),
      ...this.optionalStringProperty('recipient', query.recipient, 255),
      ...this.optionalStatus(query.status),
      ...this.optionalStringProperty('search', query.search, 100),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };
  }

  private parseLimit(value: unknown): number {
    if (value === undefined || value === null || value === '') return 20;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new BadRequestException('Validation Error');
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('Validation Error');
    return limit;
  }

  private optionalStringProperty<K extends string>(
    key: K,
    value: unknown,
    maxLength: number,
  ): Partial<Record<K, string>> {
    if (value === undefined || value === null || value === '') return {};
    if (typeof value !== 'string') throw new BadRequestException('Validation Error');
    const normalized = value.trim();
    if (normalized.length === 0) return {};
    if (normalized.length > maxLength || /[\r\n]/.test(normalized)) {
      throw new BadRequestException('Validation Error');
    }
    return { [key]: normalized } as Partial<Record<K, string>>;
  }

  private optionalStatus(value: unknown): { status?: log_status_enum } {
    if (value === undefined || value === null || value === '') return {};
    if (value !== 'QUEUED' && value !== 'SENT' && value !== 'FAILED') {
      throw new BadRequestException('Validation Error');
    }
    return { status: value };
  }

  private parseDate(value: unknown): Date | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') throw new BadRequestException('Validation Error');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Validation Error');
    return date;
  }
}
