import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface WorkerHeartbeat {
  workerId: string;
  workerType: string;
  status: 'RUNNING' | 'IDLE' | 'BUSY' | 'ERROR';
  processedJobs: number;
  failedJobs: number;
  lastHeartbeat: Date;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
}

@Injectable()
export class WorkerHealthService implements OnModuleInit {
  private readonly logger = new Logger(WorkerHealthService.name);
  private readonly workerId: string;
  private readonly workerStats: Map<string, { processed: number; failed: number }> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private readonly redis: RedisService) {
    this.workerId = `worker-${process.pid}-${Date.now()}`;
  }

  onModuleInit() {
    // Start heartbeat every 30 seconds
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat().catch(err => {
        this.logger.error('Failed to send heartbeat', err);
      });
    }, 30000); // 30 seconds
  }

  private async sendHeartbeat() {
    const heartbeatKey = `worker:heartbeat:${this.workerId}`;
    const heartbeat: WorkerHeartbeat = {
      workerId: this.workerId,
      workerType: 'combined', // Email, Notification, Resume, Report workers
      status: 'RUNNING',
      processedJobs: this.getTotalProcessed(),
      failedJobs: this.getTotalFailed(),
      lastHeartbeat: new Date(),
      memoryUsage: process.memoryUsage(),
      uptime: Math.floor(process.uptime()),
    };

    try {
      await this.redis.set(heartbeatKey, JSON.stringify(heartbeat), 60); // TTL 60 seconds
      this.logger.debug(`Heartbeat sent for worker ${this.workerId}`);
    } catch (error) {
      this.logger.error('Failed to write heartbeat to Redis', error);
    }
  }

  recordJobProcessed(workerType: string, success: boolean) {
    const stats = this.workerStats.get(workerType) || { processed: 0, failed: 0 };
    stats.processed += 1;
    if (!success) {
      stats.failed += 1;
    }
    this.workerStats.set(workerType, stats);
  }

  private getTotalProcessed(): number {
    return Array.from(this.workerStats.values()).reduce((sum, stats) => sum + stats.processed, 0);
  }

  private getTotalFailed(): number {
    return Array.from(this.workerStats.values()).reduce((sum, stats) => sum + stats.failed, 0);
  }

  async getAllWorkerHeartbeats(): Promise<WorkerHeartbeat[]> {
    // This would scan Redis for all worker heartbeat keys
    // For now, return empty array - would need Redis SCAN implementation
    return [];
  }

  getWorkerStats() {
    return {
      workerId: this.workerId,
      stats: Object.fromEntries(this.workerStats),
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
    };
  }

  async stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Send final heartbeat with stopped status
    const heartbeatKey = `worker:heartbeat:${this.workerId}`;
    await this.redis.del(heartbeatKey);
    this.logger.log('Worker heartbeat stopped');
  }
}
