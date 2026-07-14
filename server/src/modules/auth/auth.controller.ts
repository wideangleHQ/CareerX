import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SSOExchangeService } from './sso-exchange.service';
import { AUTH_COOKIES } from './constants/auth.constants';
import type { ExchangeResponseDto } from './dto/exchange.dto';
import type { RefreshResponseDto } from './dto/refresh.dto';
import { clearAuthCookies, readCookie, setAuthCookies } from './utils/auth-cookie.util';
import { CareerJwtAuthGuard } from '../../common/guards/career-jwt-auth.guard';
import { verifyCareerJwt } from './utils/jwt.util';
import type { CareerJwtPayload } from './interfaces/auth.interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ssoExchangeService: SSOExchangeService,
  ) {}

  // ─── SSO exchange ────────────────────────────────────────────────────────────
  // Controller is intentionally thin: resolve → verify → validate → issue cookies.
  // All business logic lives in SSOExchangeService and AuthService.
  @Post('exchange')
  async exchange(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ExchangeResponseDto> {
    console.log("========== SSO Exchange Started ==========");

const performxToken = this.ssoExchangeService.resolveIncomingToken(request);
console.log("✅ Step 1 - Token Resolved");

this.ssoExchangeService.preVerifyPerformxJwt(performxToken);
console.log("✅ Step 2 - Pre Verification Passed");

const result = await this.ssoExchangeService.exchangeWithPerformx(performxToken);
console.log("✅ Step 3 - AuthService.exchange() Completed");

this.ssoExchangeService.validateHRResult(result.permissions);
console.log("✅ Step 4 - Permission Validation Passed");

setAuthCookies(response, result.accessToken, result.refreshToken);
console.log("✅ Step 5 - Cookies Issued");
    
    return result.response;
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = readCookie(request.headers.cookie, AUTH_COOKIES.refresh);
    if (!refreshToken) throw new UnauthorizedException('Unauthorized');

    const result = await this.authService.refresh(refreshToken);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return result.response;
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ExchangeResponseDto> {
    const refreshToken = readCookie(request.headers.cookie, AUTH_COOKIES.refresh);
    const result = await this.authService.logout(refreshToken);
    clearAuthCookies(response);
    return result;
  }

  // ─── Session check ───────────────────────────────────────────────────────────
  // Reads career_at, verifies the Career JWT, returns the authenticated HR profile.
  // Never touches the PerformX JWT.
  @Get('me')
  @UseGuards(CareerJwtAuthGuard)
  me(@Req() request: Request): CareerJwtPayload {
    const token = readCookie(request.headers.cookie, AUTH_COOKIES.access);
    if (!token) throw new UnauthorizedException('Unauthorized');
    return verifyCareerJwt(token);
  }
}
