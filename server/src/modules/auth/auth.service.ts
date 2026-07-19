import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PerformxClient } from '../../integrations/performx/performx.client';
import { AUTH_REDIS_KEYS, AUTH_TTL_SECONDS } from './constants/auth.constants';
import type {
  AuthSuccessResponse,
  CareerJwtPayload,
  RefreshTokenRecord,
  VerifiedPerformxUser,
} from './interfaces/auth.interfaces';
import { PerformxCircuitBreaker } from './utils/circuit-breaker.util';
import { generateOpaqueToken, sha256, signCareerJwt } from './utils/jwt.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly breaker: PerformxCircuitBreaker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly performxClient: PerformxClient,
  ) {
    this.breaker = new PerformxCircuitBreaker(redis);
  }

  async exchange(performxToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    permissions: string[];
    canAccessCareerHR: boolean;
    response: AuthSuccessResponse;
  }> {
    const user = await this.verifyPerformxToken(performxToken);
    let permissions = await this.getPermissions(user.role);

    if (user.careerAccess && permissions.length === 0) {
      permissions = await this.getAllHRPermissions();
    }

    await this.ensureHrEmployee(user);

    const session = await this.issueSession(
      {
        sub: user.userId,
        email: user.email,
        departmentId: user.departmentId ?? null,
        permissions,
        canAccessCareerHR: user.careerAccess || undefined,
      },
      user.role,
    );

    return { ...session, permissions, canAccessCareerHR: user.careerAccess };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSuccessResponse;
  }> {
    const key = AUTH_REDIS_KEYS.refresh(refreshToken);
    const existing = await this.redis.get(key);
    if (!existing) {
      // Distinguish "token expired/revoked" (401) from "Redis unreachable"
      // (503): a dead dependency must not destroy the client session.
      if (!(await this.redis.ping())) {
        throw new ServiceUnavailableException('External Dependency Unavailable');
      }
      throw new UnauthorizedException('Unauthorized');
    }

    let record: RefreshTokenRecord;
    try {
      record = JSON.parse(existing) as RefreshTokenRecord;
      if (!record.sub || !record.email || !Array.isArray(record.permissions)) {
        throw new Error('Invalid refresh token record');
      }
    } catch {
      await this.redis.del(key);
      throw new UnauthorizedException('Unauthorized');
    }

    // Rotate with a reuse-grace window instead of an immediate delete. Tabs
    // share the career_rt cookie but refresh independently; with single-use
    // deletion the concurrent loser gets a false 401 and its page dies. The
    // old token stays valid for a few more seconds, then expires.
    await this.redis.set(key, existing, AUTH_TTL_SECONDS.refreshReuseGrace);

    let permissions = record.role
      ? await this.getPermissions(record.role)
      : record.permissions;

    if (record.canAccessCareerHR && permissions.length === 0) {
      permissions = await this.getAllHRPermissions();
    }

    return this.issueSession(
      {
        sub: record.sub,
        email: record.email,
        departmentId: record.departmentId,
        permissions,
        canAccessCareerHR: record.canAccessCareerHR,
      },
      record.role || '',
    );
  }

  async logout(refreshToken: string | null): Promise<AuthSuccessResponse> {
    if (refreshToken) await this.redis.del(AUTH_REDIS_KEYS.refresh(refreshToken));
    return { authenticated: true };
  }

  private async verifyPerformxToken(token: string): Promise<VerifiedPerformxUser> {
    const cacheKey = AUTH_REDIS_KEYS.verify(sha256(token));
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as VerifiedPerformxUser;
      } catch {
        await this.redis.del(cacheKey);
      }
    }

    await this.breaker.assertClosed();

    try {
      const verified = await this.performxClient.verifyToken(token);
      const user: VerifiedPerformxUser = {
        userId: verified.userId,
        email: verified.email,
        role: verified.role,
        departmentId: verified.departmentId ?? null,
        departmentName: verified.departmentName ?? null,
        careerAccess: verified.careerAccess,
      };
      await this.redis.set(cacheKey, JSON.stringify(user), AUTH_TTL_SECONDS.verifyCache);
      await this.breaker.recordSuccess();
      return user;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        await this.breaker.recordFailure();
      }
      throw error;
    }
  }

  private async getPermissions(role: string): Promise<string[]> {
    try {
      const rows = await this.prisma.hr_role_permissions.findMany({
        where: { performx_role: role },
        select: { permission: true },
      });
      return rows.map((row) => row.permission);
    } catch {
      throw new ServiceUnavailableException('External Dependency Unavailable');
    }
  }

  private async getAllHRPermissions(): Promise<string[]> {
    try {
      const rows = await this.prisma.hr_role_permissions.findMany({
        select: { permission: true },
        distinct: ['permission'],
      });
      return rows.map((row) => row.permission);
    } catch {
      throw new ServiceUnavailableException('External Dependency Unavailable');
    }
  }

  private async ensureHrEmployee(user: VerifiedPerformxUser): Promise<void> {
    try {
      await this.prisma.hr_employees.upsert({
        where: { id: user.userId },
        create: {
          id: user.userId,
          full_name: user.email.split('@')[0] ?? user.email,
          email: user.email,
          department_id: user.departmentId ?? null,
          performx_role: user.role,
          is_active: true,
          synced_at: new Date(),
        },
        update: {
          email: user.email,
          department_id: user.departmentId ?? null,
          performx_role: user.role,
          is_active: true,
          synced_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to upsert hr_employee for ${user.userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async issueSession(
    payload: CareerJwtPayload,
    role: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSuccessResponse;
  }> {
    const accessToken = signCareerJwt(payload, AUTH_TTL_SECONDS.access);
    const refreshToken = generateOpaqueToken();

    const refreshRecord: RefreshTokenRecord = {
      sub: payload.sub,
      email: payload.email,
      departmentId: payload.departmentId,
      permissions: payload.permissions,
      role,
      canAccessCareerHR: payload.canAccessCareerHR,
    };

    const stored = await this.redis.set(
      AUTH_REDIS_KEYS.refresh(refreshToken),
      JSON.stringify(refreshRecord),
      AUTH_TTL_SECONDS.refresh,
    );

    if (!stored) {
      throw new ServiceUnavailableException(
        'External Dependency Unavailable',
      );
    }

    return {
      accessToken,
      refreshToken,
      response: { authenticated: true },
    };
  }
}