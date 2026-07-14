import { ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { AUTH_REDIS_KEYS, AUTH_TTL_SECONDS } from '../constants/auth.constants';

export class PerformxCircuitBreaker {
  constructor(private readonly redis: RedisService) {}

  async assertClosed(): Promise<void> {
    const open = await this.redis.get(AUTH_REDIS_KEYS.breakerOpen);
    if (open) throw new ServiceUnavailableException('External Dependency Unavailable');
  }

  async recordFailure(): Promise<void> {
    const failures = await this.redis.incr(
      AUTH_REDIS_KEYS.breakerFailures,
      AUTH_TTL_SECONDS.breakerWindow,
    );
    if (failures !== null && failures >= 3) {
      await this.redis.set(
        AUTH_REDIS_KEYS.breakerOpen,
        '1',
        AUTH_TTL_SECONDS.breakerOpen,
      );
    }
  }

  async recordSuccess(): Promise<void> {
    await this.redis.del(AUTH_REDIS_KEYS.breakerFailures);
    await this.redis.del(AUTH_REDIS_KEYS.breakerOpen);
  }
}
