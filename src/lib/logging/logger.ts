/**
 * Structured Logging Framework
 *
 * Enterprise-grade logging with:
 * - Structured JSON output
 * - Log levels (debug, info, warn, error)
 * - Context/correlation IDs
 * - Request metadata capture
 * - Performance timing
 * - Security event logging
 */

import { NextRequest } from "next/server";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Environment-based log level configuration
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    // JSON format for production (structured logging)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m", // green
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const color = levelColors[entry.level];

  let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`;

  if (entry.context?.requestId) {
    output += ` (${entry.context.requestId})`;
  }

  if (entry.duration !== undefined) {
    output += ` [${entry.duration}ms]`;
  }

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    output += `\n  Metadata: ${JSON.stringify(entry.metadata)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    // Show stack trace in development
    if (entry.error.stack) {
      output += `\n  Stack: ${entry.error.stack}`;
    }
  }

  return output;
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  metadata?: Record<string, unknown>,
  error?: Error
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    metadata,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Extract context from Next.js request
 */
export function extractRequestContext(request: NextRequest): LogContext {
  return {
    requestId: generateRequestId(),
    ip: request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown",
    userAgent: request.headers.get("user-agent") || undefined,
    path: new URL(request.url).pathname,
    method: request.method,
  };
}

/**
 * Logger class with context support
 */
export class Logger {
  private context: LogContext;
  private startTime?: number;

  constructor(context?: LogContext) {
    this.context = context || {};
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext,
    });
  }

  /**
   * Start a timer for performance logging
   */
  startTimer(): void {
    this.startTime = performance.now();
  }

  /**
   * Get elapsed time since startTimer was called
   */
  getElapsedMs(): number | undefined {
    if (this.startTime === undefined) return undefined;
    return Math.round(performance.now() - this.startTime);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    log("debug", message, this.context, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    log("info", message, this.context, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    log("warn", message, this.context, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    log("error", message, this.context, metadata, error);
  }

  /**
   * Log with timing information
   */
  logWithTiming(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      duration: this.getElapsedMs(),
      metadata,
    };

    const output = formatLogEntry(entry);
    console.log(output);
  }
}

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(request: NextRequest): Logger {
  const context = extractRequestContext(request);
  const logger = new Logger(context);
  logger.startTimer();
  return logger;
}

/**
 * Security event logging
 */
export const securityLogger = {
  authSuccess(userId: string, email: string, method: string, ip: string): void {
    log("info", "Authentication successful", { userId, email, ip }, {
      event: "auth_success",
      method,
    });
  },

  authFailure(email: string, reason: string, ip: string): void {
    log("warn", "Authentication failed", { email, ip }, {
      event: "auth_failure",
      reason,
    });
  },

  rateLimited(identifier: string, endpoint: string, ip: string): void {
    log("warn", "Rate limit exceeded", { ip }, {
      event: "rate_limited",
      identifier,
      endpoint,
    });
  },

  csrfViolation(path: string, ip: string): void {
    log("warn", "CSRF validation failed", { path, ip }, {
      event: "csrf_violation",
    });
  },

  suspiciousActivity(description: string, context: LogContext, metadata?: Record<string, unknown>): void {
    log("warn", `Suspicious activity: ${description}`, context, {
      event: "suspicious_activity",
      ...metadata,
    });
  },

  accessDenied(userId: string, resource: string, action: string): void {
    log("warn", "Access denied", { userId }, {
      event: "access_denied",
      resource,
      action,
    });
  },
};

/**
 * Payment event logging
 */
export const paymentLogger = {
  paymentInitiated(
    orderId: string,
    amount: number,
    provider: "stripe" | "paypal",
    userId?: string
  ): void {
    log("info", "Payment initiated", { userId }, {
      event: "payment_initiated",
      orderId,
      amount,
      provider,
    });
  },

  paymentCompleted(
    orderId: string,
    amount: number,
    provider: "stripe" | "paypal",
    transactionId: string,
    userId?: string
  ): void {
    log("info", "Payment completed", { userId }, {
      event: "payment_completed",
      orderId,
      amount,
      provider,
      transactionId,
    });
  },

  paymentFailed(
    orderId: string,
    provider: "stripe" | "paypal",
    error: string,
    userId?: string
  ): void {
    log("error", "Payment failed", { userId }, {
      event: "payment_failed",
      orderId,
      provider,
      error,
    });
  },

  refundProcessed(
    orderId: string,
    amount: number,
    provider: "stripe" | "paypal",
    refundId: string
  ): void {
    log("info", "Refund processed", undefined, {
      event: "refund_processed",
      orderId,
      amount,
      provider,
      refundId,
    });
  },

  webhookReceived(provider: "stripe" | "paypal", eventType: string): void {
    log("info", `Webhook received: ${eventType}`, undefined, {
      event: "webhook_received",
      provider,
      eventType,
    });
  },

  webhookError(provider: "stripe" | "paypal", error: string): void {
    log("error", "Webhook processing error", undefined, {
      event: "webhook_error",
      provider,
      error,
    });
  },
};

/**
 * Default logger instance
 */
export const logger = new Logger();
