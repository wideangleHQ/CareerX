import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { MonitoringController } from './monitoring.controller';
import { QueueMetricsService } from './queue-metrics.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { OperationsDashboardService } from './operations-dashboard.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerQueue({ name: 'notifications' }),
    BullModule.registerQueue({ name: 'resume-parser' }),
    BullModule.registerQueue({ name: 'reports' }),
  ],
  controllers: [MonitoringController],
  providers: [QueueMetricsService, PerformanceMetricsService, OperationsDashboardService],
  exports: [QueueMetricsService, PerformanceMetricsService, OperationsDashboardService],
})
export class MonitoringModule {}
