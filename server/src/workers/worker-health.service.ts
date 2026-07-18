import { Injectable, Logger } from '@nestjs/common';

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

/**
 * In-memory worker statistics.
 *
 * Note: this service previously wrote a heartbeat key to Redis every 30 seconds,
 * but nothing ever read it (getAllWorkerHeartbeats always returned []). The
 * Redis writes were removed to save ~2,900 Redis commands/day; all stats are
 * kept in process memory and exposed via getWorkerStats().
 */
@Injectable()
export class WorkerHealthService {
  private readonly logger = new Logger(WorkerHealthService.name);
  private readonly workerId: string;
  private readonly workerStats: Map<string, { processed: number; failed: number }> = new Map();

  constructor() {
    this.workerId = `worker-${process.pid}-${Date.now()}`;
  }

  recordJobProcessed(workerType: string, success: boolean) {
    const stats = this.workerStats.get(workerType) || { processed: 0, failed: 0 };
    stats.processed += 1;
    if (!success) {
      stats.failed += 1;
    }
    this.workerStats.set(workerType, stats);
  }

  async getAllWorkerHeartbeats(): Promise<WorkerHeartbeat[]> {
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
}
