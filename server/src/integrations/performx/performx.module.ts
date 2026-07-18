import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { DepartmentSyncService } from './department-sync.service';
import { EmployeeSyncService } from './employee-sync.service';
import { PerformxClient } from './performx.client';

@Module({
  imports: [RedisModule, PrismaModule],
  providers: [PerformxClient, DepartmentSyncService, EmployeeSyncService],
  exports: [PerformxClient, DepartmentSyncService, EmployeeSyncService],
})
export class PerformxModule {}
