import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface PerformxDepartmentItem {
  id: string;
  name: string;
}

const CACHE_KEY = 'performx:departments';
const CACHE_TTL_SECONDS = 10 * 60; // 10 minutes
const TIMEOUT_MS = 5000;

@Injectable()
export class DepartmentSyncService {
  private readonly logger = new Logger(DepartmentSyncService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly redis: RedisService) {
    this.baseUrl = process.env.PERFORMX_API_URL ?? '';
    this.apiKey = process.env.PERFORMX_INTERNAL_API_KEY ?? '';
  }

  async getDepartments(): Promise<PerformxDepartmentItem[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as PerformxDepartmentItem[];
      } catch {
        await this.redis.del(CACHE_KEY);
      }
    }

    return this.fetchAndCache();
  }

  async validateDepartmentId(departmentId: string): Promise<boolean> {
    const departments = await this.getDepartments();
    return departments.some((d) => d.id === departmentId);
  }

  async getDepartmentById(departmentId: string): Promise<PerformxDepartmentItem | null> {
    const departments = await this.getDepartments();
    return departments.find((d) => d.id === departmentId) ?? null;
  }

  async refreshCache(): Promise<{ synced: number }> {
    const departments = await this.fetchAndCache();
    return { synced: departments.length };
  }

  private async fetchAndCache(): Promise<PerformxDepartmentItem[]> {
    this.logger.log('Department Sync Started');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/internal/departments`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-internal-api-key': this.apiKey,
          },
          signal: controller.signal,
        },
      );

      if (response.status === 401 || response.status === 403) {
        this.logger.error('Department Sync Failed: Unauthorized access to PerformX internal API');
        return this.fallbackToCache();
      }

      if (response.status === 404) {
        this.logger.error('Department Sync Failed: PerformX internal departments endpoint not found');
        return this.fallbackToCache();
      }

      if (response.status === 408 || !response.ok) {
        this.logger.error(`Department Sync Failed: PerformX returned ${response.status}`);
        return this.fallbackToCache();
      }

      const payload = (await response.json()) as unknown;
      const rows: unknown[] = Array.isArray(payload)
        ? payload
        : typeof payload === 'object' &&
          payload !== null &&
          Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : [];

      if (rows.length === 0 && !Array.isArray(payload)) {
        this.logger.error('Department Sync Failed: Unexpected response shape from PerformX');
        return this.fallbackToCache();
      }

      const departments: PerformxDepartmentItem[] = rows
        .filter(
          (row): row is { id: string; name: string } =>
            typeof row === 'object' &&
            row !== null &&
            typeof (row as { id?: unknown }).id === 'string' &&
            typeof (row as { name?: unknown }).name === 'string',
        )
        .map((row) => ({ id: row.id, name: row.name }));

      await this.redis.set(CACHE_KEY, JSON.stringify(departments), CACHE_TTL_SECONDS);
      this.logger.log(`Department Sync Success: ${departments.length} departments cached`);
      return departments;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('Department Sync Failed: Network error or timeout reaching PerformX');
      return this.fallbackToCache();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fallbackToCache(): Promise<PerformxDepartmentItem[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as PerformxDepartmentItem[];
      } catch {
        // Stale cache is unreadable
      }
    }
    throw new ServiceUnavailableException('Department data unavailable: PerformX is unreachable and no cached data exists');
  }
}
