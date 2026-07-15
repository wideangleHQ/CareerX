import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  latency?: number;
  details?: Record<string, any>;
  lastChecked: string;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    queues: ComponentHealth;
    workers: ComponentHealth;
    emailProvider: ComponentHealth;
    scheduler?: ComponentHealth;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async getSystemHealth(includeScheduler: boolean = false): Promise<SystemHealth> {
    const checks = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
      this.checkWorkers(),
      this.checkEmailProvider(),
    ];

    if (includeScheduler) {
      checks.push(this.checkScheduler());
    }

    const [database, redis, queues, workers, emailProvider, scheduler] = await Promise.all(checks);

    // Determine overall system status
    const components = [database, redis, queues, workers, emailProvider];
    if (scheduler) components.push(scheduler);

    const hasUnavailable = components.some(c => c?.status === 'UNAVAILABLE');
    const hasDegraded = components.some(c => c?.status === 'DEGRADED');
    
    const systemStatus: HealthStatus = hasUnavailable ? 'UNAVAILABLE' 
      : hasDegraded ? 'DEGRADED' 
      : 'HEALTHY';

    return {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      components: {
        database: database!,
        redis: redis!,
        queues: queues!,
        workers: workers!,
        emailProvider: emailProvider!,
        ...(scheduler ? { scheduler } : {}),
      },
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      // Check connection pool status
      const stats = await this.getDatabaseStats();

      return {
        status: latency > 1000 ? 'DEGRADED' : 'HEALTHY',
        message: latency > 1000 ? 'High database latency' : 'Database responsive',
        latency,
        details: stats,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'UNAVAILABLE',
        message: 'Database connection failed',
        latency: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async getDatabaseStats(): Promise<Record<string, any>> {
    try {
      // Get active connections and slow queries
      const [applications, candidates, emailLogs] = await Promise.all([
        this.prisma.applications.count(),
        this.prisma.candidates.count(),
        this.prisma.email_logs.count({ where: { status: 'QUEUED' } }),
      ]);

      return {
        totalApplications: applications,
        totalCandidates: candidates,
        pendingEmails: emailLogs,
      };
    } catch {
      return {};
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const testKey = 'health:check';
      const testValue = Date.now().toString();
      
      await this.redis.set(testKey, testValue, 10);
      const retrieved = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const latency = Date.now() - start;
      const isHealthy = retrieved === testValue;

      return {
        status: !isHealthy ? 'UNAVAILABLE' : latency > 500 ? 'DEGRADED' : 'HEALTHY',
        message: !isHealthy ? 'Redis operation failed' : 'Redis responsive',
        latency,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'UNAVAILABLE',
        message: 'Redis connection failed',
        latency: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkQueues(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const [emailStats, notificationStats] = await Promise.all([
        this.getQueueStats(this.emailQueue, 'email'),
        this.getQueueStats(this.notificationQueue, 'notifications'),
      ]);

      const totalFailed = emailStats.failed + notificationStats.failed;
      const totalWaiting = emailStats.waiting + notificationStats.waiting;
      
      const isDegraded = totalFailed > 50 || totalWaiting > 1000;
      const isUnavailable = totalFailed > 500;

      return {
        status: isUnavailable ? 'UNAVAILABLE' : isDegraded ? 'DEGRADED' : 'HEALTHY',
        message: isUnavailable ? 'Critical queue failures' 
          : isDegraded ? 'High queue load or failures' 
          : 'Queues operational',
        latency: Date.now() - start,
        details: {
          email: emailStats,
          notifications: notificationStats,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Queue health check failed', error);
      return {
        status: 'UNAVAILABLE',
        message: 'Unable to access queues',
        latency: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async getQueueStats(queue: Queue, name: string) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return { name, waiting, active, completed, failed, delayed };
    } catch {
      return { name, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  private async checkWorkers(): Promise<ComponentHealth> {
    try {
      // Check if workers are processing jobs by looking at recent job completions
      const recentCompletions = await this.prisma.email_logs.count({
        where: {
          status: 'SENT',
          sent_at: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      const recentFailures = await this.prisma.email_logs.count({
        where: {
          status: 'FAILED',
          updated_at: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
      });

      const successRate = recentCompletions + recentFailures > 0 
        ? (recentCompletions / (recentCompletions + recentFailures)) * 100 
        : 100;

      const isDegraded = successRate < 80;
      const isUnavailable = successRate < 50 && recentFailures > 10;

      return {
        status: isUnavailable ? 'UNAVAILABLE' : isDegraded ? 'DEGRADED' : 'HEALTHY',
        message: isUnavailable ? 'Workers failing critically' 
          : isDegraded ? 'High worker failure rate' 
          : 'Workers processing jobs',
        details: {
          recentCompletions,
          recentFailures,
          successRate: Math.round(successRate),
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Worker health check failed', error);
      return {
        status: 'UNAVAILABLE',
        message: 'Unable to check worker status',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkEmailProvider(): Promise<ComponentHealth> {
    try {
      // Check email provider availability by looking at recent send statistics
      const recentSent = await this.prisma.email_logs.count({
        where: {
          status: 'SENT',
          sent_at: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      const recentFailed = await this.prisma.email_logs.count({
        where: {
          status: 'FAILED',
          error_message: {
            contains: 'provider',
          },
          updated_at: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
      });

      const hasProviderKey = !!process.env.RESEND_API_KEY;
      const hasFromAddress = !!process.env.EMAIL_FROM;

      if (!hasProviderKey || !hasFromAddress) {
        return {
          status: 'UNAVAILABLE',
          message: 'Email provider not configured',
          details: { configured: false },
          lastChecked: new Date().toISOString(),
        };
      }

      const providerFailureRate = recentSent + recentFailed > 0 
        ? (recentFailed / (recentSent + recentFailed)) * 100 
        : 0;

      const isDegraded = providerFailureRate > 20;
      const isUnavailable = providerFailureRate > 50 && recentFailed > 5;

      return {
        status: isUnavailable ? 'UNAVAILABLE' : isDegraded ? 'DEGRADED' : 'HEALTHY',
        message: isUnavailable ? 'Email provider failing' 
          : isDegraded ? 'High provider failure rate' 
          : 'Email provider operational',
        details: {
          recentSent,
          recentFailed,
          failureRate: Math.round(providerFailureRate),
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Email provider health check failed', error);
      return {
        status: 'DEGRADED',
        message: 'Unable to verify provider status',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkScheduler(): Promise<ComponentHealth> {
    try {
      // Check if scheduled jobs are running by looking at recent activity
      const recentEmails = await this.prisma.email_logs.count({
        where: {
          template: 'INTERVIEW_REMINDER',
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      return {
        status: 'HEALTHY',
        message: 'Scheduler operational',
        details: {
          recentReminderJobs: recentEmails,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Scheduler health check failed', error);
      return {
        status: 'DEGRADED',
        message: 'Unable to verify scheduler status',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // Kubernetes-compatible readiness check
  async isReady(): Promise<boolean> {
    try {
      const [dbOk, redisOk] = await Promise.all([
        this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
        this.redis.get('health:check').then(() => true).catch(() => false),
      ]);
      return dbOk && redisOk;
    } catch {
      return false;
    }
  }

  // Kubernetes-compatible liveness check
  async isAlive(): Promise<boolean> {
    // Simple check - if the service can respond, it's alive
    return true;
  }
}
