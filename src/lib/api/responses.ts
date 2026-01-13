/**
 * API Response Utilities
 *
 * Standardized response helpers for consistent API responses across all routes.
 * Provides type-safe success and error responses with proper HTTP status codes.
 */

import { NextResponse } from "next/server";

/**
 * Standard API error codes
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Authorization errors (403)
  FORBIDDEN: "FORBIDDEN",
  ACCESS_DENIED: "ACCESS_DENIED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  CSRF_INVALID: "CSRF_INVALID",

  // Validation errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Not found errors (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Conflict errors (409)
  CONFLICT: "CONFLICT",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // Rate limiting (429)
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",

  // Payment errors
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_DECLINED: "PAYMENT_DECLINED",
  REFUND_FAILED: "REFUND_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * API Error response structure
 */
export interface ApiError {
  error: string;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * API Success response structure
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

/**
 * Map error codes to HTTP status codes
 */
const errorCodeToStatus: Record<ErrorCode, number> = {
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_CREDENTIALS]: 401,
  [ErrorCodes.SESSION_EXPIRED]: 401,
  [ErrorCodes.TOKEN_INVALID]: 401,

  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.ACCESS_DENIED]: 403,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCodes.CSRF_INVALID]: 403,

  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,

  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.ALREADY_EXISTS]: 409,
  [ErrorCodes.DUPLICATE_ENTRY]: 409,

  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.TOO_MANY_REQUESTS]: 429,

  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.DATABASE_ERROR]: 500,

  [ErrorCodes.PAYMENT_FAILED]: 402,
  [ErrorCodes.PAYMENT_DECLINED]: 402,
  [ErrorCodes.REFUND_FAILED]: 500,
};

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  }
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  if (options?.requestId || options?.pagination) {
    response.meta = {
      timestamp: new Date().toISOString(),
    };

    if (options.requestId) {
      response.meta.requestId = options.requestId;
    }

    if (options.pagination) {
      response.meta.pagination = {
        ...options.pagination,
        hasMore: options.pagination.page * options.pagination.limit < options.pagination.total,
      };
    }
  }

  return NextResponse.json(response, { status: options?.status ?? 200 });
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    requestId?: string;
    status?: number;
  }
): NextResponse<ApiError> {
  const response: ApiError = {
    error: code,
    code,
    message,
  };

  if (options?.details) {
    response.details = options.details;
  }

  if (options?.requestId) {
    response.requestId = options.requestId;
  }

  const status = options?.status ?? errorCodeToStatus[code] ?? 500;

  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  fieldErrors?: Array<{ field: string; message: string }>
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, {
    details: fieldErrors ? { fields: fieldErrors } : undefined,
  });
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(
  message = "Authentication required"
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message);
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(
  message = "Access denied"
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.FORBIDDEN, message);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(
  resource = "Resource"
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`);
}

/**
 * Create an internal server error response
 */
export function internalErrorResponse(
  message = "An unexpected error occurred"
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message);
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(
  retryAfter: number
): NextResponse<ApiError> {
  const response = errorResponse(
    ErrorCodes.RATE_LIMITED,
    `Too many requests. Please try again in ${retryAfter} seconds.`,
    { details: { retryAfter } }
  );

  response.headers.set("Retry-After", String(retryAfter));
  response.headers.set("X-RateLimit-Remaining", "0");

  return response;
}

/**
 * Create a service unavailable response
 */
export function serviceUnavailableResponse(
  message = "Service temporarily unavailable"
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message);
}

/**
 * Convert service result to API response
 */
export function serviceResultToResponse<T>(
  result: { success: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, unknown> } },
  successStatus = 200
): NextResponse {
  if (result.success && result.data !== undefined) {
    return successResponse(result.data, { status: successStatus });
  }

  if (result.error) {
    return errorResponse(
      result.error.code as ErrorCode,
      result.error.message,
      { details: result.error.details }
    );
  }

  return internalErrorResponse();
}
