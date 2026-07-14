import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { DepartmentSyncService } from './department-sync.service';
import { PerformxClient } from './performx.client';

@Module({
  imports: [RedisModule],
  providers: [PerformxClient, DepartmentSyncService],
  exports: [PerformxClient, DepartmentSyncService],
})
export class PerformxModule {}
