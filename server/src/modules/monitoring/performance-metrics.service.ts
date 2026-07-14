import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PerformanceMetrics {
  email: {
    averageDeliveryTime: number;
    successRate: number;
    totalSent: number;
    totalFailed: number;
    last24Hours: {
      sent: number;
      failed: number;
    };
  };
  database: {
    slowQueries: number;
    averageQueryTime?: number;
  };
  applications: {
    totalProcessed: number;
    averageProcessingTime?: number;
  };
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  type: 'FAILED_LOGIN' | 'UNAUTHORIZED_ACCESS' | 'PERMISSION_DENIED' | 'RATE_LIMIT' | 'INVALID_PAYLOAD' | 'SUSPICIOUS_ACTIVITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class PerformanceMetricsService {
  private readonly logger = new Logger(PerformanceMetricsService.name);
  private readonly securityEvents: SecurityEvent[] = [];
  private readonly maxSecurityEvents = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const [emailMetrics, applicationMetrics] = await Promise.all([
      this.getEmailMetrics(),
      this.getApplicationMetrics(),
    ]);

    return {
      email: emailMetrics,
      database: {
        slowQueries: 0, // Placeholder - would need query logging
      },
      applications: applicationMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  private async getEmailMetrics() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalSent, totalFailed, recent] = await Promise.all([
      this.prisma.email_logs.count({ where: { status: 'SENT' } }),
      this.prisma.email_logs.count({ where: { status: 'FAILED' } }),
      this.prisma.email_logs.groupBy({
        by: ['status'],
        where: { created_at: { gte: last24Hours } },
        _count: true,
      }),
    ]);

    const recentSent = recent.find(r => r.status === 'SENT')?._count || 0;
    const recentFailed = recent.find(r => r.status === 'FAILED')?._count || 0;

    // Calculate average delivery time (created -> sent)
    const sentEmails = await this.prisma.email_logs.findMany({
      where: {
        status: 'SENT',
        sent_at: { not: null },
        created_at: { gte: last24Hours },
      },
      select: {
        created_at: true,
        sent_at: true,
      },
      take: 100,
    });

    let averageDeliveryTime = 0;
    if (sentEmails.length > 0) {
      const times = sentEmails
        .filter(e => e.sent_at)
        .map(e => e.sent_at!.getTime() - e.created_at.getTime());
      
      if (times.length > 0) {
        averageDeliveryTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    const successRate = totalSent + totalFailed > 0 
      ? (totalSent / (totalSent + totalFailed)) * 100 
      : 100;

    return {
      averageDeliveryTime,
      successRate: Math.round(successRate * 100) / 100,
      totalSent,
      totalFailed,
      last24Hours: {
        sent: recentSent,
        failed: recentFailed,
      },
    };
  }

  private async getApplicationMetrics() {
    const totalProcessed = await this.prisma.applications.count({
      where: {
        status: { not: 'PENDING' },
      },
    });

    return {
      totalProcessed,
    };
  }

  // Track security events
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.securityEvents.unshift(securityEvent);

    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.pop();
    }

    // Log critical events
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      this.logger.warn({
        message: 'Security event',
        ...securityEvent,
      });
    }
  }

  getSecurityEvents(limit: number = 50, severity?: SecurityEvent['severity']): SecurityEvent[] {
    let events = this.securityEvents;

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    return events.slice(0, limit);
  }

  getSecurityEventsSummary() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(e => e.timestamp >= last24Hours);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const event of recentEvents) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    }

    return {
      total: recentEvents.length,
      byType,
      bySeverity,
      last24Hours: recentEvents.length,
      timestamp: new Date().toISOString(),
    };
  }
}
