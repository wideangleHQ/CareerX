import {
  Injectable,
  Logger,
} from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, correlationId, requestId } = request;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const logContext = {
      correlationId,
      requestId,
      controller,
      handler,
      method,
      url,
    };

    return next.handle().pipe(
      tap(() => {
        // Success logging handled by correlation middleware
      }),
      catchError((error) => {
        // Log errors with full context
        this.logger.error({
          ...logContext,
          message: 'Request failed',
          error: {
            name: error.name,
            message: error.message,
            status: error.status,
            stack: error.stack,
          },
        });

        return throwError(() => error);
      }),
    );
  }
}
