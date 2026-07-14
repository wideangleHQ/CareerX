import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
import { EmailService } from './email.service';
import { CareerEventsModule } from '../../common/events/career-events.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    CareerEventsModule,
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
  exports: [EmailService, EmailRepository],
})
export class EmailModule {}
