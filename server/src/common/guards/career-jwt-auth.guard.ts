import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_COOKIES } from '../../modules/auth/constants/auth.constants';
import type { CareerJwtPayload } from '../../modules/auth/interfaces/auth.interfaces';
import { readCookie } from '../../modules/auth/utils/auth-cookie.util';
import { verifyCareerJwt } from '../../modules/auth/utils/jwt.util';

type AuthenticatedRequest = Request & { user?: CareerJwtPayload };

@Injectable()
export class CareerJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    try {
      const token = readCookie(request.headers.cookie, AUTH_COOKIES.access);
      if (!token) {
        throw new UnauthorizedException('Unauthorized');
      }
      request.user = verifyCareerJwt(token);
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
