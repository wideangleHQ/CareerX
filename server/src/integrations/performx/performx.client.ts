import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

export interface PerformxVerifyResponse {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  careerAccess: boolean;
}

export interface PerformxDepartment {
  id: string;
  name: string;
}

@Injectable()
export class PerformxClient {
  private readonly baseUrl = process.env.PERFORMX_API_URL ?? 'https://api.ruchiperformx.in';
  private readonly internalApiKey = process.env.PERFORMX_INTERNAL_API_KEY ?? '';
  private readonly timeoutMs = 2000;

  async verifyToken(token: string): Promise<PerformxVerifyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      console.log('Base URL:', this.baseUrl);
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
      const response = await fetch(`${this.baseUrl}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('Unauthorized');
      }

      if (!response.ok) {
        console.log(await response.text());
        
      }

      const data = (await response.json()) as Partial<PerformxVerifyResponse>;
      if (
        !data.userId ||
        !data.email ||
        !data.role ||
        typeof data.careerAccess !== 'boolean'
      ) {
        throw new UnauthorizedException('Unauthorized');
}

      return {
        userId: data.userId,
  email: data.email,
  role: data.role,
  departmentId: data.departmentId ?? null,
  departmentName: data.departmentName ?? null,
  careerAccess: data.careerAccess,
};
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException('External Dependency Unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  async getDepartments(): Promise<PerformxDepartment[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/internal/departments`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-internal-api-key': this.internalApiKey,
        },
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('Unauthorized');
      }

      if (!response.ok) {
        throw new ServiceUnavailableException('External Dependency Unavailable');
      }

      const payload = (await response.json()) as unknown;
      const rows = Array.isArray(payload)
        ? payload
        : typeof payload === 'object' && payload !== null && Array.isArray((payload as { data?: unknown }).data)
          ? (payload as { data: unknown[] }).data
          : null;

      if (!rows) throw new ServiceUnavailableException('External Dependency Unavailable');

      return rows.map((row) => {
        if (
          typeof row !== 'object' ||
          row === null ||
          typeof (row as { id?: unknown }).id !== 'string' ||
          typeof (row as { name?: unknown }).name !== 'string'
        ) {
          throw new ServiceUnavailableException('External Dependency Unavailable');
        }

        return {
          id: (row as { id: string }).id,
          name: (row as { name: string }).name,
        };
      });
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException('External Dependency Unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}
