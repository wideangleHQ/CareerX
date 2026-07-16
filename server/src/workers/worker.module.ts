import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmailWorker } from './email/email.worker';
import { NotificationWorker } from './notifications/notification.worker';
import { ResumeWorker } from './resume-parser/resume.worker';
import { ReportWorker } from './reports/report.worker';
import { WorkerHealthService } from './worker-health.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({ 
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    }),
    BullModule.registerQueue({ 
      name: 'notifications',
      defaultJobOptions: {
        attempts: 5, // More retries for notifications
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 200,
        removeOnFail: 100,
      }
    }),
    BullModule.registerQueue({ 
      name: 'resume-parser',
      defaultJobOptions: {
        attempts: 2, // Fewer retries for file processing
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 25,
      }
    }),
    BullModule.registerQueue({ 
      name: 'reports',
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed', 
          delay: 3000,
        },
        removeOnComplete: 25,
        removeOnFail: 10,
      }
    }),
  ],
  providers: [
    WorkerHealthService,
    EmailWorker,
    NotificationWorker,
    ResumeWorker,
    ReportWorker,
  ],
  exports: [
    BullModule, // Export for other modules to inject queues
    WorkerHealthService,
  ],
})
export class WorkerModule {}
