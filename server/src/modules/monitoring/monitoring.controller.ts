import { Controller, Get, Post, Query, Param, UseGuards, Body } from '@nestjs/common';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { QueueMetricsService } from './queue-metrics.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { OperationsDashboardService } from './operations-dashboard.service';

@Controller('monitoring')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
@RequirePermissions('CAREER_ADMIN')
export class MonitoringController {
  constructor(
    private readonly queueMetrics: QueueMetricsService,
    private readonly performanceMetrics: PerformanceMetricsService,
    private readonly dashboard: OperationsDashboardService,
  ) {}

  // Operations Dashboard
  @Get('dashboard')
  async getOperationsDashboard() {
    return this.dashboard.getOperationsDashboard();
  }

  @Get('statistics')
  async getSystemStatistics() {
    return this.dashboard.getSystemStatistics();
  }

  @Get('database/metrics')
  async getDatabaseMetrics() {
    return this.dashboard.getDatabaseMetrics();
  }

  // Queue monitoring endpoints
  @Get('queues')
  async getAllQueues() {
    return this.queueMetrics.getAllQueueMetrics();
  }

  @Get('queues/:name')
  async getQueue(@Param('name') name: string) {
    const queue = this.queueMetrics['getQueueByName'](name);
    if (!queue) {
      return { error: 'Queue not found' };
    }
    return this.queueMetrics.getQueueMetrics(queue, name);
  }

  @Get('queues/:name/failed')
  async getFailedJobs(
    @Param('name') name: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.queueMetrics.getFailedJobs(name, parsedLimit);
  }

  @Get('queues/:name/delayed')
  async getDelayedJobs(
    @Param('name') name: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.queueMetrics.getDelayedJobs(name, parsedLimit);
  }

  @Get('queues/:name/active')
  async getActiveJobs(
    @Param('name') name: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.queueMetrics.getActiveJobs(name, parsedLimit);
  }

  @Post('queues/:name/jobs/:jobId/retry')
  async retryJob(
    @Param('name') name: string,
    @Param('jobId') jobId: string,
  ) {
    const success = await this.queueMetrics.retryFailedJob(name, jobId);
    return { success, jobId, queue: name };
  }

  @Post('queues/:name/clean')
  async cleanQueue(
    @Param('name') name: string,
    @Body() body: { grace?: number; limit?: number },
  ) {
    const cleaned = await this.queueMetrics.cleanQueue(
      name,
      body.grace || 0,
      body.limit || 1000,
    );
    return { success: true, cleaned, queue: name };
  }

  // Performance metrics endpoints
  @Get('performance')
  async getPerformanceMetrics() {
    return this.performanceMetrics.getPerformanceMetrics();
  }

  // Security events endpoints
  @Get('security/events')
  async getSecurityEvents(
    @Query('limit') limit?: string,
    @Query('severity') severity?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const events = this.performanceMetrics.getSecurityEvents(
      parsedLimit,
      severity as any,
    );
    return { events, total: events.length };
  }

  @Get('security/summary')
  async getSecuritySummary() {
    return this.performanceMetrics.getSecurityEventsSummary();
  }
}

