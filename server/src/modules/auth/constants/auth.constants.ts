export const AUTH_COOKIES = {
  performxAccess: 'px_at',
  access: 'career_at',
  refresh: 'career_rt',
} as const;

export const AUTH_TTL_SECONDS = {
  access: 15 * 60,
  refresh: 7 * 24 * 60 * 60,
  // Grace window during which a just-rotated refresh token is still accepted.
  // Multiple tabs share one cookie jar but refresh independently; without a
  // reuse interval the race loser is falsely logged out (401).
  refreshReuseGrace: 30,
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
