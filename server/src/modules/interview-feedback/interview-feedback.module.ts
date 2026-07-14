import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InterviewFeedbackController } from './interview-feedback.controller';
import { InterviewFeedbackRepository } from './interview-feedback.repository';
import { InterviewFeedbackService } from './interview-feedback.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [InterviewFeedbackController],
  providers: [InterviewFeedbackRepository, InterviewFeedbackService],
  exports: [InterviewFeedbackService],
})
export class InterviewFeedbackModule {}
