import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import type { CareerJwtPayload } from '../interfaces/auth.interfaces';

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function decodeBase64Url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

function getSecret(): string {
  const secret = process.env.CAREER_JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT secret is not configured');
  }
  return secret;
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function signCareerJwt(payload: CareerJwtPayload, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedBody = base64Url(JSON.stringify(body));
  const signature = createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyCareerJwt(token: string): CareerJwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new UnauthorizedException('Unauthorized');
  }

  const [encodedHeader, encodedBody, signature] = parts as [string, string, string];
  const expected = createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedException('Unauthorized');
  }

  try {
    const header = JSON.parse(decodeBase64Url(encodedHeader).toString()) as { alg?: string };
    if (header.alg !== 'HS256') throw new Error('Invalid alg');
    const payload = JSON.parse(decodeBase64Url(encodedBody).toString()) as CareerJwtPayload;
    if (!payload.sub || !payload.email || !Array.isArray(payload.permissions)) {
      throw new Error('Invalid payload');
    }
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Unauthorized');
    }
    return payload;
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('Unauthorized');
  }
}
