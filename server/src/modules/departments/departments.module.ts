import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PerformxModule } from '../../integrations/performx/performx.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, PerformxModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
