import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerHealthService } from './scheduler-health.service';

@Injectable()
export class InterviewReminderCron {
  private readonly logger = new Logger(InterviewReminderCron.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    private readonly schedulerHealth: SchedulerHealthService,
  ) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async handleCron() {
    this.logger.log('Starting interview reminder check...');
    let success = true;

    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find upcoming interviews that haven't been reminded yet
      const upcomingInterviews = await this.prisma.interview_slots.findMany({
        where: {
          is_booked: true,
          slot_date: {
            gte: now,
            lte: next24Hours,
          },
          // Only process interviews that haven't been reminded
          NOT: {
            slot_assignment: {
              application: {
                email_logs: {
                  some: {
                    template: 'INTERVIEW_REMINDER',
                    status: 'SENT',
                  }
                }
              }
            }
          }
        },
        include: {
          slot_assignment: {
            include: { 
              application: { 
                include: { 
                  candidate: true,
                  department: true,
                }
              }
            }
          },
          hr: true,
        },
        take: 100, // Process in batches
      });

      let queued = 0;
      for (const slot of upcomingInterviews) {
        const assignment = slot.slot_assignment;
        if (!assignment?.application) continue;

        const application = assignment.application;
        const candidate = application.candidate;
        
        if (!slot.slot_date || !slot.slot_time || !application.department) continue;
        
        const dateStr = slot.slot_date.toISOString().split('T')[0] ?? '';
        const timeParts = slot.slot_time.toISOString().split('T')[1];
        const timeStr = timeParts ? timeParts.substring(0, 5) : '00:00';
        const deptName = application.department.name;

        if (candidate?.email) {
          // Create email log first
          const emailLog = await this.prisma.email_logs.create({
            data: {
              application_id: assignment.application_id,
              recipient: candidate.email,
              template: 'INTERVIEW_REMINDER',
              status: 'QUEUED',
            }
          });

          // Queue email reminder using proper template
          await this.emailQueue.add('send-reminder', {
            logId: emailLog.id,
            recipient: candidate.email,
            rendered: {
              subject: 'Interview Reminder - Tomorrow',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Interview Reminder</h2>
                  <p>Hello ${candidate.full_name},</p>
                  <p>This is a friendly reminder that you have an interview scheduled for tomorrow:</p>
                  <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>📅 Date:</strong> ${dateStr}<br>
                    <strong>🕐 Time:</strong> ${timeStr}<br>
                    <strong>🏢 Department:</strong> ${deptName}
                  </div>
                  <p>Please arrive a few minutes early and bring any required documents.</p>
                  <p>We look forward to meeting with you!</p>
                  <p>Best regards,<br>CareerX Team</p>
                </div>
              `,
              text: `Interview Reminder\n\nHello ${candidate.full_name},\n\nThis is a friendly reminder that you have an interview scheduled for tomorrow:\n\nDate: ${dateStr}\nTime: ${timeStr}\nDepartment: ${deptName}\n\nPlease arrive a few minutes early and bring any required documents.\n\nWe look forward to meeting with you!\n\nBest regards,\nCareerX Team`,
            },
            attachments: [],
          }, {
            delay: 0,
            priority: 10, // High priority for reminders
            removeOnComplete: 200, // Keep more reminder completions for audit
          });

          // Queue notification for HR
          const notificationLog = await this.prisma.notification_logs.create({
            data: {
              application_id: assignment.application_id,
              recipient_hr_id: slot.hr_id,
              channel: 'IN_APP',
              message: `Reminder: Interview with ${candidate.full_name} tomorrow at ${timeStr}`,
              status: 'QUEUED',
            }
          });

          await this.notificationQueue.add('send-notification', {
            logId: notificationLog.id,
            recipientHrId: slot.hr_id,
            channel: 'IN_APP',
            message: notificationLog.message,
            applicationId: assignment.application_id,
          });

          queued++;
        }
      }
      this.logger.log(`Queued ${queued} interview reminders.`);
    } catch (error) {
      success = false;
      this.logger.error('Failed to process interview reminders', error instanceof Error ? error.stack : String(error));
    } finally {
      this.schedulerHealth.recordJobExecution('InterviewReminderCron', success);
    }
  }
}
