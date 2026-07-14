import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { CareerJwtPayload } from '../../modules/auth/interfaces/auth.interfaces';

type AuthenticatedRequest = Request & { user?: CareerJwtPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CareerJwtPayload | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
