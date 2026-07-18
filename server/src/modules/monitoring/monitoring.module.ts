import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../../common/queue/queues.module';
import { MonitoringController } from './monitoring.controller';
import { QueueMetricsService } from './queue-metrics.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { OperationsDashboardService } from './operations-dashboard.service';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [MonitoringController],
  providers: [QueueMetricsService, PerformanceMetricsService, OperationsDashboardService],
  exports: [QueueMetricsService, PerformanceMetricsService, OperationsDashboardService],
})
export class MonitoringModule {}
