import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QueuesModule } from '../common/queue/queues.module';
import { EmailWorker } from './email/email.worker';
import { NotificationWorker } from './notifications/notification.worker';
import { ReportWorker } from './reports/report.worker';
import { WorkerHealthService } from './worker-health.service';

// ResumeWorker (./resume-parser/resume.worker.ts) is intentionally NOT registered:
// its process() is a placeholder and no producer anywhere enqueues to the
// 'resume-parser' queue, so running the worker only generates idle Redis
// polling. Re-add it to providers when resume parsing is implemented.
@Module({
  imports: [PrismaModule, RedisModule, QueuesModule],
  providers: [
    WorkerHealthService,
    EmailWorker,
    NotificationWorker,
    ReportWorker,
  ],
  exports: [QueuesModule, WorkerHealthService],
})
export class WorkerModule {}
