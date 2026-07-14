import type { Response } from 'express';
import { AUTH_COOKIES, AUTH_TTL_SECONDS } from '../constants/auth.constants';

const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;
const secureCookie = process.env.AUTH_COOKIE_SECURE === 'true';

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header || name.length === 0) return null;
  const parts = header.split(';');
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string): void {
  response.cookie(AUTH_COOKIES.access, accessToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    domain: cookieDomain,
    path: '/',
    maxAge: AUTH_TTL_SECONDS.access * 1000,
  });
  response.cookie(AUTH_COOKIES.refresh, refreshToken, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    domain: cookieDomain,
    path: '/',
    maxAge: AUTH_TTL_SECONDS.refresh * 1000,
  });
}

export function clearAuthCookies(response: Response): void {
  const options = {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax' as const,
    domain: cookieDomain,
    path: '/',
  };
  response.clearCookie(AUTH_COOKIES.access, options);
  response.clearCookie(AUTH_COOKIES.refresh, options);
}
