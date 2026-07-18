import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface PerformxEmployeeItem {
  id: string;
  fullName: string;
  email: string;
  departmentId: string | null;
  role: string;
  isActive: boolean;
}

const CACHE_KEY = 'performx:employees';
const CACHE_TTL_SECONDS = 10 * 60;
const TIMEOUT_MS = 15000;

@Injectable()
export class EmployeeSyncService {
  private readonly logger = new Logger(EmployeeSyncService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.baseUrl = process.env.PERFORMX_API_URL ?? '';
    this.apiKey = process.env.PERFORMX_INTERNAL_API_KEY ?? '';
  }

  async getEmployees(): Promise<PerformxEmployeeItem[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as PerformxEmployeeItem[];
      } catch {
        await this.redis.del(CACHE_KEY);
      }
    }

    return this.fetchAndCache();
  }

  async refreshAndUpsert(): Promise<{ synced: number }> {
    const employees = await this.fetchAndCache();
    await this.bulkUpsert(employees);
    return { synced: employees.length };
  }

  async upsertSingle(employee: PerformxEmployeeItem): Promise<void> {
    await this.prisma.hr_employees.upsert({
      where: { id: employee.id },
      create: {
        id: employee.id,
        full_name: employee.fullName,
        email: employee.email,
        department_id: employee.departmentId,
        performx_role: employee.role,
        is_active: employee.isActive,
        synced_at: new Date(),
      },
      update: {
        full_name: employee.fullName,
        email: employee.email,
        department_id: employee.departmentId,
        performx_role: employee.role,
        is_active: employee.isActive,
        synced_at: new Date(),
      },
    });
  }

  private async bulkUpsert(employees: PerformxEmployeeItem[]): Promise<void> {
    if (employees.length === 0) return;

    const now = new Date();

    await this.prisma.$transaction(
      employees.map((emp) =>
        this.prisma.hr_employees.upsert({
          where: { id: emp.id },
          create: {
            id: emp.id,
            full_name: emp.fullName,
            email: emp.email,
            department_id: emp.departmentId,
            performx_role: emp.role,
            is_active: emp.isActive,
            synced_at: now,
          },
          update: {
            full_name: emp.fullName,
            email: emp.email,
            department_id: emp.departmentId,
            performx_role: emp.role,
            is_active: emp.isActive,
            synced_at: now,
          },
        }),
      ),
    );

    this.logger.log(`Bulk upserted ${employees.length} employees to hr_employees`);
  }

  private async fetchAndCache(): Promise<PerformxEmployeeItem[]> {
    const url = `${this.baseUrl}/api/v1/internal/employees`;

    this.logger.log(`Fetching employees from ${url}`);

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

      const employees: PerformxEmployeeItem[] = rows
        .filter(
          (row): row is Record<string, unknown> =>
            typeof row === 'object' &&
            row !== null &&
            typeof (row as Record<string, unknown>).id === 'string' &&
            typeof (row as Record<string, unknown>).email === 'string',
        )
        .map((row) => ({
          id: row.id as string,
          fullName:
            (row.fullName as string) ??
            (row.full_name as string) ??
            (row.name as string) ??
            '',
          email: row.email as string,
          departmentId:
            (row.departmentId as string | null) ??
            (row.department_id as string | null) ??
            null,
          role:
            (row.role as string) ??
            (row.performx_role as string) ??
            'EMPLOYEE',
          isActive: (row.isActive as boolean) ?? (row.is_active as boolean) ?? true,
        }));

      await this.redis.set(CACHE_KEY, JSON.stringify(employees), CACHE_TTL_SECONDS);
      this.logger.log(`Employee sync success: ${employees.length} employees cached`);
      return employees;
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error({
        message: 'Employee sync network failure',
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

  private async fallbackToCache(): Promise<PerformxEmployeeItem[]> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      try {
        this.logger.warn('Serving employees from stale cache');
        return JSON.parse(cached) as PerformxEmployeeItem[];
      } catch {
        // Stale cache is unreadable
      }
    }
    throw new ServiceUnavailableException(
      'Employee data unavailable: PerformX is unreachable and no cached data exists',
    );
  }
}
