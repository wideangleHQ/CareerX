import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

/**
 * Single registration point for every BullMQ queue.
 *
 * Import this module wherever a queue needs to be injected instead of calling
 * BullModule.registerQueue() locally — duplicate registerQueue() calls create
 * duplicate Queue instances, each holding its own Redis connection.
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullModule.registerQueue({
      name: 'resume-parser',
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    }),
    BullModule.registerQueue({
      name: 'reports',
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: 25,
        removeOnFail: 10,
      },
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
