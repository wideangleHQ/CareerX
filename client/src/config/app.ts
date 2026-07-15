export const AppConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  performxLoginUrl: process.env.NEXT_PUBLIC_PERFORMX_LOGIN_URL ?? 'http://localhost:4001/login',
  candidateDomain: process.env.NEXT_PUBLIC_CANDIDATE_DOMAIN ?? 'localhost:3001',
  hrDomain: process.env.NEXT_PUBLIC_HR_DOMAIN ?? 'localhost:3001',
} as const;
