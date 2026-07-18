import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { log_status_enum, notification_channel_enum } from '@prisma/client';

interface NotificationJobData {
  logId: string;
  recipientHrId: string;
  channel: notification_channel_enum;
  message: string;
  applicationId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  entityType?: string;
  entityId?: string;
}

@Processor('notifications', { concurrency: 10, drainDelay: 60, stalledInterval: 300000 })
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<{ success: boolean; notificationId?: string }> {
    this.logger.log(`Processing notification job ${job.id} for HR ${job.data.recipientHrId}`);
    const { logId, recipientHrId, channel, message, applicationId, priority, entityType, entityId } = job.data;

    try {
      // For IN_APP notifications, we just mark as sent since they're already in the database
      // Future channels like WhatsApp/SMS would have actual delivery logic here
      
      if (channel === 'IN_APP') {
        await this.handleInAppNotification(logId, recipientHrId, message, applicationId, priority, entityType, entityId);
      } else {
        // Future: Handle other notification channels (WhatsApp, SMS, Push, etc.)
        this.logger.log(`Notification channel ${channel} not yet implemented, marking as sent`);
      }

      await this.prisma.notification_logs.update({
        where: { id: logId },
        data: { 
          status: log_status_enum.SENT,
          sent_at: new Date(),
        },
      });

      this.logger.log(`Notification sent successfully to HR ${recipientHrId} via ${channel}`);
      return { success: true, notificationId: logId };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send notification job ${job.id}:`, error instanceof Error ? error.stack : errorMessage);
      
      await this.prisma.notification_logs.update({
        where: { id: logId },
        data: { 
          status: log_status_enum.FAILED,
          error_message: errorMessage,
        },
      });
      
      throw error; // Let BullMQ handle retries
    }
  }

  private async handleInAppNotification(
    logId: string, 
    recipientHrId: string, 
    message: string, 
    applicationId?: string,
    priority: string = 'MEDIUM',
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    // In-app notifications are already stored in notification_logs table
    // This method can be extended to:
    // 1. Send real-time updates via WebSocket
    // 2. Update notification counters
    // 3. Trigger push notifications for mobile apps
    
    this.logger.log(`In-app notification processed for HR ${recipientHrId}: ${message}`);
    
    // Future: WebSocket real-time notification
    // await this.websocketService.sendToHr(recipientHrId, {
    //   type: 'notification',
    //   message,
    //   priority,
    //   applicationId,
    //   entityType,
    //   entityId,
    //   timestamp: new Date(),
    // });

    // Future: Update unread notification count in Redis for quick access
    // await this.redis.incr(`notification:unread:${recipientHrId}`);
  }

  // Helper method for validation
  private validateJobData(data: any): asserts data is NotificationJobData {
    if (
      !data ||
      typeof data.logId !== 'string' ||
      typeof data.recipientHrId !== 'string' ||
      typeof data.message !== 'string' ||
      !Object.values(notification_channel_enum).includes(data.channel)
    ) {
      throw new Error('Invalid notification job data structure');
    }
  }
}
