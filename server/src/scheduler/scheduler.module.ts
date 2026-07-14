import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { PerformxModule } from '../integrations/performx/performx.module';
import { DepartmentSyncCron } from './department-sync.cron';
import { InterviewReminderCron } from './interview-reminder.cron';
import { ApplicationCleanupCron } from './application-cleanup.cron';
import { ExpiredSlotCron } from './expired-slot.cron';
import { SchedulerHealthService } from './scheduler-health.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PerformxModule,
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [
    SchedulerHealthService,
    DepartmentSyncCron,
    InterviewReminderCron,
    ApplicationCleanupCron,
    ExpiredSlotCron,
  ],
  exports: [SchedulerHealthService],
})
export class SchedulerModule {}
