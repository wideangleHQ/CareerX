import { Injectable, Logger } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

// Extend Express Request to include correlation metadata
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing correlation ID
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    const requestId = randomUUID();
    const startTime = Date.now();

    // Attach to request object
    req.correlationId = correlationId;
    req.requestId = requestId;
    req.startTime = startTime;

    // Add to response headers
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Log incoming request
    this.logger.log({
      message: 'Incoming request',
      correlationId,
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 500 ? 'error' 
        : res.statusCode >= 400 ? 'warn' 
        : 'log';

      this.logger[level]({
        message: 'Request completed',
        correlationId,
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  }
}
