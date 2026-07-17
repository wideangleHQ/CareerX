import { Global, Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
          Logger.error(
            'REDIS_URL is not set. BullMQ queues will not function. ' +
            'Set REDIS_URL in your environment (Railway dashboard for production).',
            'QueueConfigModule',
          );

          return {
            connection: {
              host: 'localhost',
              port: 6379,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: () => null,
              lazyConnect: true,
            },
            defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
              removeOnComplete: 100,
              removeOnFail: 50,
            },
          };
        }

        const parsed = new URL(redisUrl);
        const isTls = parsed.protocol === 'rediss:';

        Logger.log(
          `BullMQ connecting to ${parsed.hostname}:${parsed.port || (isTls ? 6380 : 6379)} (TLS: ${isTls})`,
          'QueueConfigModule',
        );

        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || (isTls ? '6380' : '6379'), 10),
            password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
            username:
              parsed.username && parsed.username !== 'default'
                ? decodeURIComponent(parsed.username)
                : undefined,
            tls: isTls ? {} : undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            family: 4,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueConfigModule {}
