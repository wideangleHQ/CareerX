export interface CareerJwtPayload {
  sub: string;
  email: string;
  departmentId: string | null;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface VerifiedPerformxUser {
  userId: string;
  email: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  careerAccess: boolean;
}

export interface RefreshTokenRecord {
  sub: string;
  email: string;
  departmentId: string | null;
  permissions: string[];
}

export interface AuthSuccessResponse {
  authenticated: true;
}

/** Returned by AuthService.exchange() — used by SSOExchangeService */
export interface AuthSuccessResult {
  accessToken: string;
  refreshToken: string;
  permissions: string[];
  response: AuthSuccessResponse;
}
