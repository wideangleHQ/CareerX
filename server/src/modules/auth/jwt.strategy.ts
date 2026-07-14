import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_COOKIES } from './constants/auth.constants';
import type { CareerJwtPayload } from './interfaces/auth.interfaces';
import { readCookie } from './utils/auth-cookie.util';
import { verifyCareerJwt } from './utils/jwt.util';

@Injectable()
export class JwtStrategy {
  validateRequest(request: Request): CareerJwtPayload {
    const token = readCookie(request.headers.cookie, AUTH_COOKIES.access);
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }
    return verifyCareerJwt(token);
  }
}
