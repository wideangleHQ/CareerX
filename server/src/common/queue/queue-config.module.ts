import { Global, Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        
        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parseInt(parsed.port || '6379', 10),
              password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
              username: parsed.username && parsed.username !== 'default' ? parsed.username : undefined,
              tls: parsed.protocol === 'rediss:' ? {} : undefined,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            },
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              removeOnComplete: 100,
              removeOnFail: 50,
            },
          };
        }

        // Extremely severe logging so this isn't missed in production
        Logger.error(
          'CRITICAL: REDIS_URL is not defined in the environment. BullMQ is falling back to localhost:6379, which will cause connection loops in production!',
          'QueueConfigModule',
        );

        return {
          connection: {
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
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
