import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import type { notification_channel_enum } from '@prisma/client';
import { EventEmitter } from 'node:events';
import { RedisService } from '../../redis/redis.service';
import type { CareerJwtPayload } from '../auth/interfaces/auth.interfaces';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { NotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationsRepository } from './notifications.repository';
import type { NotificationRecord } from './notifications.repository';

interface ApplicationEvent {
  applicationId: string;
}

interface StatusChangedEvent extends ApplicationEvent {
  fromStatus?: string | null;
  toStatus?: string;
}

interface InterviewBookedEvent extends ApplicationEvent {
  hrId?: string | null;
}

interface HrEvent extends ApplicationEvent {
  hrId?: string | null;
}

export interface NotificationDto {
  id: string;
  applicationId: string | null;
  recipientHrId: string | null;
  channel: notification_channel_enum;
  message: string;
  status: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResponseDto {
  success: true;
  data: NotificationDto[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly redis: RedisService,
    private readonly events: EventEmitter,
  ) {}

  onModuleInit(): void {
    this.events.on('ApplicationCreated', (event: ApplicationEvent) => {
      void this.handleApplicationCreated(event);
    });
    this.events.on('StatusChanged', (event: StatusChangedEvent) => {
      void this.handleStatusChanged(event);
    });
    this.events.on('InterviewBooked', (event: InterviewBookedEvent) => {
      void this.handleInterviewBooked(event);
    });
    this.events.on('InterviewCompleted', (event: HrEvent) => {
      void this.handleInterviewCompleted(event);
    });
    this.events.on('InterviewFeedbackCreated', (event: HrEvent) => {
      void this.handleInterviewFeedbackCreated(event);
    });
    this.events.on('HRNoteCreated', (event: HrEvent) => {
      void this.handleHrNoteCreated(event);
    });
  }

  async create(dto: CreateNotificationDto): Promise<NotificationDto> {
    try {
      const recipient = await this.repository.findActiveHr(dto.recipientHrId);
      if (!recipient) throw new NotFoundException('HR not found');

      const notification = await this.repository.create({
        recipient_hr_id: dto.recipientHrId,
        application_id: dto.applicationId ?? null,
        channel: dto.channel,
        message: dto.message,
        status: 'QUEUED',
      });
      return this.toDto(notification);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findAll(
    query: NotificationFilterDto,
    user: CareerJwtPayload | undefined,
  ): Promise<NotificationListResponseDto> {
    const recipientHrId = this.requireUser(user);

    try {
      const rows = await this.repository.findManyForRecipient(recipientHrId, query);
      const hasMore = rows.length > query.limit;
      const data = rows.slice(0, query.limit).map((notification) => this.toDto(notification));

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

  async markRead(id: string, user: CareerJwtPayload | undefined): Promise<NotificationDto> {
    const recipientHrId = this.requireUser(user);

    try {
      const updated = await this.repository.markRead(id, recipientHrId, new Date());
      if (updated.count === 0) {
        const existing = await this.repository.findForRecipient(id, recipientHrId);
        if (!existing) throw new NotFoundException('Notification not found');
        return this.toDto(existing);
      }

      const notification = await this.repository.findForRecipient(id, recipientHrId);
      if (!notification) throw new NotFoundException('Notification not found');
      return this.toDto(notification);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async markAllRead(user: CareerJwtPayload | undefined): Promise<{ success: true; updated: number }> {
    const recipientHrId = this.requireUser(user);

    try {
      const result = await this.repository.markAllRead(recipientHrId, new Date());
      return { success: true, updated: result.count };
    } catch {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private async handleApplicationCreated(event: ApplicationEvent): Promise<void> {
    const application = await this.repository.findApplicationContext(event.applicationId);
    if (!application) return;

    const recipients = await this.repository.resolveDepartmentAndAdminRecipients(application.department_id);
    await this.enqueueMany(
      recipients,
      application.id,
      `New application ${application.application_code} from ${application.candidate.full_name}`,
    );
  }

  private async handleStatusChanged(event: StatusChangedEvent): Promise<void> {
    const application = await this.repository.findApplicationContext(event.applicationId);
    if (!application) return;

    const recipients = application.assigned_hr_id
      ? [application.assigned_hr_id]
      : await this.repository.resolveDepartmentAndAdminRecipients(application.department_id);
    const status = event.toStatus ?? application.status;
    await this.enqueueMany(
      recipients,
      application.id,
      `Application ${application.application_code} status changed to ${status}`,
    );
  }

  private async handleInterviewBooked(event: InterviewBookedEvent): Promise<void> {
    const application = await this.repository.findApplicationContext(event.applicationId);
    if (!application) return;

    const recipients = event.hrId ? [event.hrId] : await this.repository.resolveDepartmentAndAdminRecipients(application.department_id);
    await this.enqueueMany(recipients, application.id, `Interview booked for ${application.application_code}`);
  }

  private async handleInterviewCompleted(event: HrEvent): Promise<void> {
    await this.handleHrScopedEvent(event, 'Interview completed');
  }

  private async handleInterviewFeedbackCreated(event: HrEvent): Promise<void> {
    await this.handleHrScopedEvent(event, 'Interview feedback submitted');
  }

  private async handleHrNoteCreated(event: HrEvent): Promise<void> {
    await this.handleHrScopedEvent(event, 'HR note added');
  }

  private async handleHrScopedEvent(event: HrEvent, action: string): Promise<void> {
    const application = await this.repository.findApplicationContext(event.applicationId);
    if (!application) return;

    const recipients = [
      ...new Set([
        ...(application.assigned_hr_id ? [application.assigned_hr_id] : []),
        ...(event.hrId ? [event.hrId] : []),
      ]),
    ];
    if (recipients.length === 0) return;
    await this.enqueueMany(recipients, application.id, `${action} for ${application.application_code}`);
  }

  private async enqueueMany(
    recipientHrIds: string[],
    applicationId: string | null,
    message: string,
  ): Promise<void> {
    const recipients = [...new Set(recipientHrIds)].filter(Boolean);
    if (recipients.length === 0) return;

    await this.redis.incr('career:notifications:queued', 60);
    await this.repository.createMany(
      recipients.map((recipientHrId) => ({
        recipient_hr_id: recipientHrId,
        application_id: applicationId,
        channel: 'IN_APP',
        message,
        status: 'QUEUED',
      })),
    );
  }

  private requireUser(user: CareerJwtPayload | undefined): string {
    if (!user?.sub) throw new ForbiddenException('Forbidden');
    return user.sub;
  }

  private toDto(notification: NotificationRecord): NotificationDto {
    return {
      id: notification.id,
      applicationId: notification.application_id,
      recipientHrId: notification.recipient_hr_id,
      channel: notification.channel,
      message: notification.message,
      status: notification.status,
      readAt: notification.read_at,
      createdAt: notification.created_at,
    };
  }
}
