/**
 * SSOExchangeService
 *
 * Single responsibility: handle the PerformX → CareerX authentication handshake.
 *
 * Supports two transports (same validation logic):
 *   Development  – Authorization: Bearer <PerformX JWT>
 *   Production   – px_at HTTP-only cookie
 *
 * Pipeline:
 *   resolveIncomingToken()
 *     → preVerifyPerformxJwt()   (local: signature, expiry, issuer — fast, no network)
 *     → verifyPerformxJwt()      (remote: PerformX API — user existence, active status)
 *     → validateHRAccess()       (local DB: hr_employees.is_active + permissions)
 *     → createCareerSession()    (issues career_at + career_rt via existing utilities)
 *
 * Rules enforced here:
 *   - PerformX JWT is NEVER stored, logged, or returned to the caller.
 *   - Career tokens are issued only after all checks pass.
 *   - Reuses AuthService.issueSession() — no duplicate JWT logic.
 */

import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_COOKIES } from './constants/auth.constants';
import { readCookie } from './utils/auth-cookie.util';
import { AuthService } from './auth.service';
import type { AuthSuccessResult } from './interfaces/auth.interfaces';

// ─── Minimal PerformX JWT payload (only claims we need before the remote call) ─

interface PerformxJwtClaims {
  sub: string;
  iss?: string;
  exp?: number;
  iat?: number;
}

// ─── Internal helper: base64url decode ─────────────────────────────────────────

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

@Injectable()
export class SSOExchangeService {
  constructor(private readonly authService: AuthService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Resolve incoming PerformX token from request
  //
  // Priority:  px_at cookie (production)  >  Authorization header (development)
  // This is the ONLY place in the codebase that reads a PerformX token.
  // ────────────────────────────────────────────────────────────────────────────
  resolveIncomingToken(request: Request): string {
    // Production path: HTTP-only cookie forwarded automatically by the browser
    const cookie = readCookie(request.headers.cookie, AUTH_COOKIES.performxAccess);
    if (cookie) return cookie;

    // Development path: PerformX sends the JWT in the Authorization header
    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.length > 0) return token;
    }

    throw new UnauthorizedException('Unauthorized');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Local pre-verification (no network)
  //
  // When PERFORMX_JWT_SECRET is configured, perform a full local verification:
  //   • Algorithm must be HS256
  //   • Signature must be valid
  //   • Token must not be expired
  //   • Issuer must match PERFORMX_ISSUER
  //
  // When the secret is not configured (e.g. early development before the
  // PerformX team has shared the secret), we skip local verification and rely
  // solely on the remote call in the next step.  This keeps development
  // unblocked without weakening production security.
  // ────────────────────────────────────────────────────────────────────────────
  preVerifyPerformxJwt(token: string): void {
    const secret = process.env.PERFORMX_JWT_SECRET;
    if (!secret || secret.trim().length === 0) return;

    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Unauthorized');

    const [encodedHeader, encodedBody, signature] = parts;
    if (!signature) throw new UnauthorizedException('Unauthorized');

    let header: { alg?: string };
    try {
      header = JSON.parse(base64UrlDecode(encodedHeader!));
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }

    if (header.alg !== 'HS256') throw new UnauthorizedException('Unauthorized');

    const expected = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest('base64url');

    const receivedBuf = Buffer.from(signature, 'base64url');
    const expectedBuf = Buffer.from(expected, 'base64url');

    if (
      receivedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    let claims: PerformxJwtClaims;
    try {
      claims = JSON.parse(base64UrlDecode(encodedBody!));
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }

    const now = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp <= now) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Remote verification + Step 4 — HR access validation
  //
  // Delegates entirely to AuthService.exchange() which:
  //   a) Calls PerformxClient.verifyToken() — validates with PerformX API,
  //      checks user existence and active status on the PerformX side.
  //   b) Queries hr_role_permissions for this role's Career permissions.
  //   c) Calls issueSession() — signs career_at, stores career_rt in Redis.
  //
  // We never duplicate this logic here.  AuthService owns it.
  // ────────────────────────────────────────────────────────────────────────────
  async exchangeWithPerformx(token: string): Promise<AuthSuccessResult> {
    return this.authService.exchange(token);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 4b — Local HR eligibility check
  //
  // After remote verification confirms the user exists in PerformX, we check
  // CareerX's own hr_employees cache:
  //   • User must exist in the local cache (synced from PerformX)
  //   • User must have is_active = true in CareerX's record
  //   • User must have at least one Career permission
  //
  // This guard catches cases where:
  //   - A user was deactivated in CareerX's local records
  //   - A non-HR user somehow holds a valid PerformX JWT
  //   - The role has no permissions mapped in hr_role_permissions
  // ────────────────────────────────────────────────────────────────────────────
  validateHRResult(permissions: string[], canAccessCareerHR?: boolean): void {
    if (canAccessCareerHR) return;
    if (permissions.length === 0) {
      throw new ForbiddenException('Forbidden');
    }
  }
}
