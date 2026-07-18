import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueuesModule } from '../common/queue/queues.module';
import { EmailWorker } from './email/email.worker';
import { NotificationWorker } from './notifications/notification.worker';
import { ResumeWorker } from './resume-parser/resume.worker';
import { ReportWorker } from './reports/report.worker';
import { WorkerHealthService } from './worker-health.service';

@Module({
  imports: [PrismaModule, RedisModule, QueuesModule],
  providers: [
    WorkerHealthService,
    EmailWorker,
    NotificationWorker,
    ResumeWorker,
    ReportWorker,
  ],
  exports: [QueuesModule, WorkerHealthService],
})
export class WorkerModule {}
