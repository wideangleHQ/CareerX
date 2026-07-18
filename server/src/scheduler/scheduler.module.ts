import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { PerformxModule } from '../integrations/performx/performx.module';
import { QueuesModule } from '../common/queue/queues.module';
import { DepartmentSyncCron } from './department-sync.cron';
import { EmployeeSyncCron } from './employee-sync.cron';
import { InterviewReminderCron } from './interview-reminder.cron';
import { ApplicationCleanupCron } from './application-cleanup.cron';
import { ExpiredSlotCron } from './expired-slot.cron';
import { SchedulerHealthService } from './scheduler-health.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PerformxModule,
    QueuesModule,
  ],
  providers: [
    SchedulerHealthService,
    DepartmentSyncCron,
    EmployeeSyncCron,
    InterviewReminderCron,
    ApplicationCleanupCron,
    ExpiredSlotCron,
  ],
  exports: [SchedulerHealthService],
})
export class SchedulerModule {}
