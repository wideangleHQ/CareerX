import {
  Injectable,
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
    response: AuthSuccessResponse;
  }> {
    console.log("========== AuthService.exchange ==========");

console.log("A. Verifying PerformX Token");
const user = await this.verifyPerformxToken(performxToken);

console.log("Verified User:", user);

console.log("B. Loading Permissions");
const permissions = await this.getPermissions(user.role);

console.log("Permissions:", permissions);

console.log("C. Creating Session");
const session = await this.issueSession({
  sub: user.userId,
  email: user.email,
  departmentId: user.departmentId ?? null,
  permissions,
});

console.log("Session Created");
    return { ...session, permissions };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSuccessResponse;
  }> {
    const key = AUTH_REDIS_KEYS.refresh(refreshToken);
    const existing = await this.redis.get(key);
    if (!existing) throw new UnauthorizedException('Unauthorized');

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

    await this.redis.del(key);
    return this.issueSession(record);
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

  private async issueSession(payload: CareerJwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSuccessResponse;
  }> {
    console.log("1. Signing Career JWT");

const accessToken = signCareerJwt(payload, AUTH_TTL_SECONDS.access);

console.log("2. Career JWT Signed");

const refreshToken = generateOpaqueToken();

console.log("3. Refresh Token Generated");

console.log("Redis Key:", AUTH_REDIS_KEYS.refresh(refreshToken));

const stored = await this.redis.set(
  AUTH_REDIS_KEYS.refresh(refreshToken),
  JSON.stringify(payload satisfies RefreshTokenRecord),
  AUTH_TTL_SECONDS.refresh,
);

console.log("Redis Result:", stored);

    if (!stored) {
      console.log("Redis SET Failed");
      throw new ServiceUnavailableException(
        'External Dependency Unavailable',
      );
    }

    console.log("4. Session Stored");

    return {
      accessToken,
      refreshToken,
      response: { authenticated: true },
    };
  }
}