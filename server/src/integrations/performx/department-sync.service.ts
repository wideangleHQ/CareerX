import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface PerformxDepartmentItem {
  id: string;
  name: string;
}

const CACHE_KEY = 'performx:departments';
const CACHE_TTL_SECONDS = 10 * 60;
const TIMEOUT_MS = 8000;

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
    const url = `${this.baseUrl}/api/v1/internal/departments`;

    this.logger.log(`Fetching departments from ${url}`);

    if (!this.baseUrl) {
      this.logger.error('PERFORMX_API_URL is not configured');
      return this.fallbackToCache();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-internal-api-key': this.apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '<unreadable>');
        this.logger.error(
          `PerformX returned ${response.status} from ${url} — body: ${body.substring(0, 500)}`,
        );
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
        this.logger.error(
          `Unexpected response shape from ${url}: ${JSON.stringify(payload).substring(0, 300)}`,
        );
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
      this.logger.log(`Department sync success: ${departments.length} departments cached`);
      return departments;
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error({
        message: 'Department sync network failure',
        url,
        errorName: error?.name,
        errorMessage: error?.message,
        code: error?.code,
        errno: error?.errno,
        cause: error?.cause?.message,
      });
      return this.fallbackToCache();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fallbackToCache(): Promise<PerformxDepartmentItem[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      try {
        this.logger.warn('Serving departments from stale cache');
        return JSON.parse(cached) as PerformxDepartmentItem[];
      } catch {
        // Stale cache is unreadable
      }
    }
    throw new ServiceUnavailableException(
      'Department data unavailable: PerformX is unreachable and no cached data exists',
    );
  }
}
