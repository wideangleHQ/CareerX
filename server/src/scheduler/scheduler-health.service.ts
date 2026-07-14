import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SchedulerHealthStatus {
  name: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  failureCount: number;
  status: 'RUNNING' | 'STOPPED' | 'UNKNOWN';
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

@Injectable()
export class SchedulerHealthService {
  private readonly logger = new Logger(SchedulerHealthService.name);
  private readonly jobStats: Map<string, {
    lastRun: Date;
    runCount: number;
    failureCount: number;
  }> = new Map();

  recordJobExecution(jobName: string, success: boolean): void {
    const stats = this.jobStats.get(jobName) || {
      lastRun: new Date(),
      runCount: 0,
      failureCount: 0,
    };

    stats.lastRun = new Date();
    stats.runCount += 1;
    if (!success) {
      stats.failureCount += 1;
    }

    this.jobStats.set(jobName, stats);

    // Log execution
    if (success) {
      this.logger.log(`Cron job ${jobName} executed successfully`);
    } else {
      this.logger.error(`Cron job ${jobName} failed`);
    }
  }

  getJobStatus(jobName: string): SchedulerHealthStatus {
    const stats = this.jobStats.get(jobName);

    if (!stats) {
      return {
        name: jobName,
        runCount: 0,
        failureCount: 0,
        status: 'UNKNOWN',
        health: 'CRITICAL',
      };
    }

    const timeSinceLastRun = Date.now() - stats.lastRun.getTime();
    const failureRate = stats.runCount > 0 
      ? (stats.failureCount / stats.runCount) * 100 
      : 0;

    // Determine status
    const isRunning = timeSinceLastRun < 60 * 60 * 1000; // Last run within 1 hour
    const status = isRunning ? 'RUNNING' : 'STOPPED';

    // Determine health
    let health: SchedulerHealthStatus['health'] = 'HEALTHY';
    if (!isRunning) {
      health = 'CRITICAL';
    } else if (failureRate > 50) {
      health = 'CRITICAL';
    } else if (failureRate > 20) {
      health = 'DEGRADED';
    }

    return {
      name: jobName,
      lastRun: stats.lastRun,
      runCount: stats.runCount,
      failureCount: stats.failureCount,
      status,
      health,
    };
  }

  getAllJobsStatus(): SchedulerHealthStatus[] {
    const knownJobs = [
      'InterviewReminderCron',
      'ApplicationCleanupCron',
      'DepartmentSyncCron',
      'ExpiredSlotCron',
    ];

    return knownJobs.map(jobName => this.getJobStatus(jobName));
  }
}
