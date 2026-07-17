export interface CareerJwtPayload {
  sub: string;
  email: string;
  departmentId: string | null;
  permissions: string[];
  canAccessCareerHR?: boolean | undefined;
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
  canAccessCareerHR?: boolean | undefined;
}

export interface AuthSuccessResponse {
  authenticated: true;
}

/** Returned by AuthService.exchange() — used by SSOExchangeService */
export interface AuthSuccessResult {
  accessToken: string;
  refreshToken: string;
  permissions: string[];
  canAccessCareerHR: boolean;
  response: AuthSuccessResponse;
}
