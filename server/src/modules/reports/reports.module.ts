import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../../common/queue/queues.module';

@Module({
  imports: [
    PrismaModule,
    QueuesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
