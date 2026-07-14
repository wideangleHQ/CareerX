export const AUTH_COOKIES = {
  performxAccess: 'px_at',
  access: 'career_at',
  refresh: 'career_rt',
} as const;

export const AUTH_TTL_SECONDS = {
  access: 15 * 60,
  refresh: 7 * 24 * 60 * 60,
  verifyCache: 60,
  breakerWindow: 30,
  breakerOpen: 30,
} as const;

export const AUTH_REDIS_KEYS = {
  verify: (hash: string) => `career:verify:${hash}`,
  refresh: (token: string) => `career:rt:${token}`,
  breakerFailures: 'career:performx:breaker:failures',
  breakerOpen: 'career:performx:breaker:open',
} as const;
