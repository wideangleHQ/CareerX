import { Logger } from '@nestjs/common';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  module?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export class StructuredLogger extends Logger {
  log(message: string, context?: LogContext) {
    super.log(this.formatMessage(message, 'LOG', context));
  }

  error(message: string, trace?: string, context?: LogContext) {
    const formatted = this.formatMessage(message, 'ERROR', context);
    if (trace) {
      super.error(formatted, trace);
    } else {
      super.error(formatted);
    }
  }

  warn(message: string, context?: LogContext) {
    super.warn(this.formatMessage(message, 'WARN', context));
  }

  debug(message: string, context?: LogContext) {
    super.debug(this.formatMessage(message, 'DEBUG', context));
  }

  verbose(message: string, context?: LogContext) {
    super.verbose(this.formatMessage(message, 'VERBOSE', context));
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
    const logMethod = severity === 'CRITICAL' || severity === 'HIGH' ? 'error' : 'warn';
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

  private filterContext(context: LogContext): Record<string, any> {
    const filtered: Record<string, any> = {};

    if (context.correlationId) filtered.correlationId = context.correlationId;
    if (context.requestId) filtered.requestId = context.requestId;
    if (context.userId) filtered.userId = context.userId;
    if (context.module) filtered.module = context.module;
    if (context.operation) filtered.operation = context.operation;
    if (context.duration !== undefined) filtered.duration = context.duration;
    if (context.metadata) filtered.metadata = this.sanitizeMetadata(context.metadata);

    return filtered;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
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
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }
}

// Global logger instance factory
export function createStructuredLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
