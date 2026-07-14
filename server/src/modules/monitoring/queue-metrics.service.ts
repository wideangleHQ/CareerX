import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

export interface QueueMetrics {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  performance: {
    averageProcessingTime?: number;
    throughputPerHour?: number;
    oldestWaitingJob?: {
      id: string;
      age: number; // milliseconds
      data: any;
    };
  };
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
}

export interface JobDetails {
  id: string;
  name: string;
  data: any;
  progress: number;
  attemptsMade: number;
  attemptsTotal: number;
  failedReason?: string;
  stacktrace?: string[];
  createdAt: Date;
  processedOn?: Date;
  finishedOn?: Date;
  delay?: number;
}

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    @InjectQueue('resume-parser') private readonly resumeQueue: Queue,
    @InjectQueue('reports') private readonly reportsQueue: Queue,
  ) {}

  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const queues = [
      { queue: this.emailQueue, name: 'email' },
      { queue: this.notificationQueue, name: 'notifications' },
      { queue: this.resumeQueue, name: 'resume-parser' },
      { queue: this.reportsQueue, name: 'reports' },
    ];

    const metrics = await Promise.all(
      queues.map(({ queue, name }) => this.getQueueMetrics(queue, name))
    );

    return metrics;
  }

  async getQueueMetrics(queue: Queue, name: string): Promise<QueueMetrics> {
    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getPausedCount(),
      ]);

      const counts = { waiting, active, completed, failed, delayed, paused };

      // Get oldest waiting job
      const waitingJobs = await queue.getWaiting(0, 0); // Get first job
      const oldestWaitingJob = waitingJobs[0] 
        ? {
            id: waitingJobs[0].id || 'unknown',
            age: Date.now() - (waitingJobs[0].timestamp || Date.now()),
            data: this.sanitizeJobData(waitingJobs[0].data),
          }
        : undefined;

      // Calculate performance metrics
      const recentCompleted = await queue.getCompleted(0, 99); // Last 100 completed
      const averageProcessingTime = this.calculateAverageProcessingTime(recentCompleted);
      const throughputPerHour = this.calculateThroughput(recentCompleted);

      // Determine health status
      const health = this.determineQueueHealth(counts, oldestWaitingJob);

      return {
        name,
        counts,
        performance: {
          averageProcessingTime,
          throughputPerHour,
          oldestWaitingJob,
        },
        health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics for queue ${name}`, error);
      return {
        name,
        counts: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
        performance: {},
        health: 'CRITICAL',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getFailedJobs(queueName: string, limit: number = 10): Promise<JobDetails[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return [];

    try {
      const failed = await queue.getFailed(0, limit - 1);
      return failed.map(job => this.mapJobToDetails(job));
    } catch (error) {
      this.logger.error(`Failed to get failed jobs for ${queueName}`, error);
      return [];
    }
  }

  async getDelayedJobs(queueName: string, limit: number = 10): Promise<JobDetails[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return [];

    try {
      const delayed = await queue.getDelayed(0, limit - 1);
      return delayed.map(job => this.mapJobToDetails(job));
    } catch (error) {
      this.logger.error(`Failed to get delayed jobs for ${queueName}`, error);
      return [];
    }
  }

  async getActiveJobs(queueName: string, limit: number = 10): Promise<JobDetails[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return [];

    try {
      const active = await queue.getActive(0, limit - 1);
      return active.map(job => this.mapJobToDetails(job));
    } catch (error) {
      this.logger.error(`Failed to get active jobs for ${queueName}`, error);
      return [];
    }
  }

  async retryFailedJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return false;

    try {
      const job = await queue.getJob(jobId);
      if (job && await job.isFailed()) {
        await job.retry();
        this.logger.log(`Retried failed job ${jobId} in queue ${queueName}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to retry job ${jobId} in ${queueName}`, error);
      return false;
    }
  }

  async cleanQueue(queueName: string, grace: number = 0, limit: number = 1000): Promise<number> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return 0;

    try {
      const jobs = await queue.clean(grace, limit, 'completed');
      this.logger.log(`Cleaned ${jobs.length} completed jobs from ${queueName}`);
      return jobs.length;
    } catch (error) {
      this.logger.error(`Failed to clean queue ${queueName}`, error);
      return 0;
    }
  }

  private getQueueByName(name: string): Queue | null {
    switch (name) {
      case 'email': return this.emailQueue;
      case 'notifications': return this.notificationQueue;
      case 'resume-parser': return this.resumeQueue;
      case 'reports': return this.reportsQueue;
      default: return null;
    }
  }

  private mapJobToDetails(job: Job): JobDetails {
    return {
      id: job.id || 'unknown',
      name: job.name,
      data: this.sanitizeJobData(job.data),
      progress: job.progress as number || 0,
      attemptsMade: job.attemptsMade,
      attemptsTotal: job.opts.attempts || 0,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
      delay: job.opts.delay,
    };
  }

  private calculateAverageProcessingTime(jobs: Job[]): number | undefined {
    if (jobs.length === 0) return undefined;

    const times = jobs
      .filter(job => job.processedOn && job.finishedOn)
      .map(job => job.finishedOn! - job.processedOn!);

    if (times.length === 0) return undefined;

    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round(sum / times.length);
  }

  private calculateThroughput(jobs: Job[]): number | undefined {
    if (jobs.length === 0) return undefined;

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentJobs = jobs.filter(job => job.finishedOn && job.finishedOn >= oneHourAgo);
    
    return recentJobs.length;
  }

  private determineQueueHealth(
    counts: QueueMetrics['counts'],
    oldestWaitingJob?: QueueMetrics['performance']['oldestWaitingJob']
  ): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    // Critical conditions
    if (counts.failed > 100) return 'CRITICAL';
    if (counts.waiting > 5000) return 'CRITICAL';
    if (oldestWaitingJob && oldestWaitingJob.age > 60 * 60 * 1000) return 'CRITICAL'; // 1 hour

    // Degraded conditions
    if (counts.failed > 20) return 'DEGRADED';
    if (counts.waiting > 1000) return 'DEGRADED';
    if (oldestWaitingJob && oldestWaitingJob.age > 15 * 60 * 1000) return 'DEGRADED'; // 15 minutes

    return 'HEALTHY';
  }

  private sanitizeJobData(data: any): any {
    if (!data) return {};

    // Remove sensitive fields
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'privateKey'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
