import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { InterviewSlotsController } from './interview-slots.controller';
import { InterviewSlotsRepository } from './interview-slots.repository';
import { InterviewSlotsService } from './interview-slots.service';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule],
  controllers: [InterviewSlotsController],
  providers: [InterviewSlotsService, InterviewSlotsRepository],
  exports: [InterviewSlotsService],
})
export class InterviewSlotsModule {}
