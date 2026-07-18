import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../../common/queue/queues.module';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
import { EmailService } from './email.service';
import { CareerEventsModule } from '../../common/events/career-events.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CareerEventsModule,
    QueuesModule,
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailRepository],
  exports: [EmailService, EmailRepository],
})
export class EmailModule {}
