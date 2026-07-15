import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueMetricsService } from './queue-metrics.service';
import { PerformanceMetricsService } from './performance-metrics.service';

export interface OperationsDashboard {
  summary: {
    systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
    activeAlerts: number;
    totalApplications: number;
    pendingApplications: number;
    upcomingInterviews: number;
  };
  recentActivity: {
    applicationsLast24h: number;
    emailsSentLast24h: number;
    interviewsScheduledLast24h: number;
    failedJobsLast24h: number;
  };
  topIssues: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    component: string;
    issue: string;
    count: number;
    since: Date;
  }>;
  uptime: {
    current: number; // seconds
    database: number; // percentage
    redis: number; // percentage
  };
  timestamp: string;
}

@Injectable()
export class OperationsDashboardService {
  private readonly logger = new Logger(OperationsDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueMetrics: QueueMetricsService,
    private readonly performanceMetrics: PerformanceMetricsService,
  ) {}

  async getOperationsDashboard(): Promise<OperationsDashboard> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      summary,
      recentActivity,
      topIssues,
    ] = await Promise.all([
      this.getSummary(),
      this.getRecentActivity(last24h),
      this.getTopIssues(),
    ]);

    return {
      summary: {
        ...summary,
        systemStatus: summary.systemStatus as 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL',
      },
      recentActivity,
      topIssues,
      uptime: {
        current: Math.floor((Date.now() - this.getStartTime()) / 1000),
        database: 99.9, // Would calculate from actual monitoring data
        redis: 99.9, // Would calculate from actual monitoring data
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async getSummary() {
    const [
      totalApplications,
      pendingApplications,
      upcomingInterviews,
      queueMetrics,
    ] = await Promise.all([
      this.prisma.applications.count(),
      this.prisma.applications.count({ where: { status: 'NEW' } }),
      this.getUpcomingInterviewsCount(),
      this.queueMetrics.getAllQueueMetrics(),
    ]);

    // Calculate system status from queue health
    const criticalQueues = queueMetrics.filter(q => q.health === 'CRITICAL');
    const degradedQueues = queueMetrics.filter(q => q.health === 'DEGRADED');
    
    const systemStatus = criticalQueues.length > 0 ? 'CRITICAL'
      : degradedQueues.length > 0 ? 'DEGRADED'
      : 'OPERATIONAL';

    const activeAlerts = criticalQueues.length + degradedQueues.length;

    return {
      systemStatus,
      activeAlerts,
      totalApplications,
      pendingApplications,
      upcomingInterviews,
    };
  }

  private async getRecentActivity(since: Date) {
    const [
      applicationsLast24h,
      emailsSentLast24h,
      interviewsScheduledLast24h,
      failedJobsLast24h,
    ] = await Promise.all([
      this.prisma.applications.count({
        where: { created_at: { gte: since } },
      }),
      this.prisma.email_logs.count({
        where: { 
          status: 'SENT',
          sent_at: { gte: since },
        },
      }),
      this.prisma.interview_slots.count({
        where: { 
          is_booked: true,
          created_at: { gte: since },
        },
      }),
      this.prisma.email_logs.count({
        where: { 
          status: 'FAILED',
          updated_at: { gte: since },
        },
      }),
    ]);

    return {
      applicationsLast24h,
      emailsSentLast24h,
      interviewsScheduledLast24h,
      failedJobsLast24h,
    };
  }

  private async getTopIssues() {
    const issues: OperationsDashboard['topIssues'] = [];
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for high email failure rate
    const failedEmails = await this.prisma.email_logs.count({
      where: {
        status: 'FAILED',
        updated_at: { gte: last24h },
      },
    });

    if (failedEmails > 10) {
      issues.push({
        severity: failedEmails > 50 ? 'HIGH' : 'MEDIUM',
        component: 'Email Provider',
        issue: 'High email failure rate',
        count: failedEmails,
        since: last24h,
      });
    }

    // Check for pending applications backlog
    const oldPendingApps = await this.prisma.applications.count({
      where: {
        status: 'NEW',
        created_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
      },
    });

    if (oldPendingApps > 20) {
      issues.push({
        severity: oldPendingApps > 100 ? 'HIGH' : 'MEDIUM',
        component: 'Applications',
        issue: 'Stale pending applications',
        count: oldPendingApps,
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Check for notification failures
    const failedNotifications = await this.prisma.notification_logs.count({
      where: {
        status: 'FAILED',
        created_at: { gte: last24h },
      },
    });

    if (failedNotifications > 5) {
      issues.push({
        severity: 'MEDIUM',
        component: 'Notifications',
        issue: 'Notification delivery failures',
        count: failedNotifications,
        since: last24h,
      });
    }

    // Sort by severity
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return issues.slice(0, 10); // Top 10 issues
  }

  private async getUpcomingInterviewsCount(): Promise<number> {
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.interview_slots.count({
      where: {
        is_booked: true,
        slot_date: {
          gte: new Date(),
          lte: next7Days,
        },
      },
    });
  }

  private getStartTime(): number {
    // In production, this would track actual server start time
    return Date.now() - (60 * 60 * 1000); // Mock: 1 hour ago
  }

  async getSystemStatistics() {
    const [
      totalApplications,
      totalCandidates,
      totalDepartments,
      totalInterviews,
      emailStats,
      applicationsByStatus,
    ] = await Promise.all([
      this.prisma.applications.count(),
      this.prisma.candidates.count(),
      this.prisma.departments.count(),
      this.prisma.interview_slots.count({ where: { is_booked: true } }),
      this.getEmailStatistics(),
      this.getApplicationsByStatus(),
    ]);

    return {
      applications: {
        total: totalApplications,
        byStatus: applicationsByStatus,
      },
      candidates: {
        total: totalCandidates,
      },
      departments: {
        total: totalDepartments,
      },
      interviews: {
        total: totalInterviews,
      },
      emails: emailStats,
      timestamp: new Date().toISOString(),
    };
  }

  private async getEmailStatistics() {
    const [total, sent, failed, queued] = await Promise.all([
      this.prisma.email_logs.count(),
      this.prisma.email_logs.count({ where: { status: 'SENT' } }),
      this.prisma.email_logs.count({ where: { status: 'FAILED' } }),
      this.prisma.email_logs.count({ where: { status: 'QUEUED' } }),
    ]);

    const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : '100.00';

    return {
      total,
      sent,
      failed,
      queued,
      successRate: parseFloat(successRate),
    };
  }

  private async getApplicationsByStatus() {
    const statuses = await this.prisma.applications.groupBy({
      by: ['status'],
      _count: true,
    });

    return statuses.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getDatabaseMetrics() {
    try {
      // Query performance metrics
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const pingLatency = Date.now() - startTime;

      // Get table sizes
      const [applications, candidates, emailLogs, notificationLogs] = await Promise.all([
        this.prisma.applications.count(),
        this.prisma.candidates.count(),
        this.prisma.email_logs.count(),
        this.prisma.notification_logs.count(),
      ]);

      return {
        connection: {
          status: 'connected',
          latency: pingLatency,
        },
        tables: {
          applications,
          candidates,
          emailLogs,
          notificationLogs,
        },
        performance: {
          pingLatency,
          threshold: {
            healthy: 100,
            degraded: 500,
            critical: 1000,
          },
          status: pingLatency < 100 ? 'HEALTHY' 
            : pingLatency < 500 ? 'DEGRADED' 
            : 'CRITICAL',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics', error);
      return {
        connection: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
