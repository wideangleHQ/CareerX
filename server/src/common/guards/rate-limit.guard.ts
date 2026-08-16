import { HttpException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    let entry = store.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      store.set(ip, entry);
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS) {
      throw new HttpException(
        {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment before trying again.',
        },
        429,
      );
    }

    return true;
  }
}
