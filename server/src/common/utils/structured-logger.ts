import { Logger } from '@nestjs/common';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  module?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class StructuredLogger extends Logger {
  override log(message: unknown, ...optionalParams: unknown[]) {
    if (typeof message === 'string' && optionalParams.length === 1 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null && !Array.isArray(optionalParams[0])) {
      super.log(this.formatMessage(message, 'LOG', optionalParams[0] as LogContext));
    } else {
      super.log(message, ...optionalParams);
    }
  }

  override error(message: unknown, ...optionalParams: unknown[]) {
    if (typeof message === 'string' && optionalParams.length >= 1) {
      const trace = typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined;
      const ctx = optionalParams.length >= 2 && typeof optionalParams[1] === 'object' ? optionalParams[1] as LogContext : undefined;
      const formatted = this.formatMessage(message, 'ERROR', ctx);
      if (trace) {
        super.error(formatted, trace);
      } else {
        super.error(formatted);
      }
    } else {
      super.error(message, ...optionalParams);
    }
  }

  override warn(message: unknown, ...optionalParams: unknown[]) {
    if (typeof message === 'string' && optionalParams.length === 1 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null && !Array.isArray(optionalParams[0])) {
      super.warn(this.formatMessage(message, 'WARN', optionalParams[0] as LogContext));
    } else {
      super.warn(message, ...optionalParams);
    }
  }

  override debug(message: unknown, ...optionalParams: unknown[]) {
    if (typeof message === 'string' && optionalParams.length === 1 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null && !Array.isArray(optionalParams[0])) {
      super.debug(this.formatMessage(message, 'DEBUG', optionalParams[0] as LogContext));
    } else {
      super.debug(message, ...optionalParams);
    }
  }

  override verbose(message: unknown, ...optionalParams: unknown[]) {
    if (typeof message === 'string' && optionalParams.length === 1 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null && !Array.isArray(optionalParams[0])) {
      super.verbose(this.formatMessage(message, 'VERBOSE', optionalParams[0] as LogContext));
    } else {
      super.verbose(message, ...optionalParams);
    }
  }

  // Specialized logging methods for common operations
  logOperation(operation: string, duration: number, success: boolean, context?: Partial<LogContext>) {
    this.log(`Operation ${operation} ${success ? 'succeeded' : 'failed'}`, {
      ...context,
      operation,
      duration,
      metadata: {
        ...context?.metadata,
        success,
      },
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: Partial<LogContext>) {
    if (duration > 1000) {
      this.warn(`Slow database query detected`, {
        ...context,
        operation: 'database_query',
        duration,
        metadata: {
          query: this.sanitizeQuery(query),
          threshold: 1000,
        },
      });
    } else {
      this.debug(`Database query executed`, {
        ...context,
        operation: 'database_query',
        duration,
      });
    }
  }

  logQueueOperation(queueName: string, jobId: string, operation: string, context?: Partial<LogContext>) {
    this.log(`Queue operation: ${operation}`, {
      ...context,
      operation: 'queue_operation',
      metadata: {
        queue: queueName,
        jobId,
        operation,
      },
    });
  }

  logEmailOperation(recipient: string, template: string, status: string, context?: Partial<LogContext>) {
    this.log(`Email ${status}`, {
      ...context,
      operation: 'email_operation',
      metadata: {
        recipient: this.maskEmail(recipient),
        template,
        status,
      },
    });
  }

  logSecurityEvent(eventType: string, severity: string, context?: Partial<LogContext>) {
    const logMethod = severity === 'CRITICAL' || severity === 'HIGH' ? 'warn' : 'warn';
    this[logMethod](`Security event: ${eventType}`, {
      ...context,
      operation: 'security_event',
      metadata: {
        eventType,
        severity,
        ...context?.metadata,
      },
    });
  }

  private formatMessage(message: string, level: string, context?: LogContext): string | object {
    const timestamp = new Date().toISOString();
    
    // If context is provided, return structured JSON log
    if (context) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...this.filterContext(context),
      });
    }

    // Simple string format for basic logs
    return `[${timestamp}] ${message}`;
  }

  private filterContext(context: LogContext): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    if (context.correlationId) filtered.correlationId = context.correlationId;
    if (context.requestId) filtered.requestId = context.requestId;
    if (context.userId) filtered.userId = context.userId;
    if (context.module) filtered.module = context.module;
    if (context.operation) filtered.operation = context.operation;
    if (context.duration !== undefined) filtered.duration = context.duration;
    if (context.metadata) filtered.metadata = this.sanitizeMetadata(context.metadata);

    return filtered;
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie'];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private sanitizeQuery(query: string): string {
    // Truncate long queries
    if (query.length > 200) {
      return query.substring(0, 200) + '...';
    }
    return query;
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'invalid';
    const parts = email.split('@');
    const local = parts[0];
    const domain = parts[1];
    if (!local || !domain) return 'invalid';
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
}

// Global logger instance factory
export function createStructuredLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
