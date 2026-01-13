/**
 * CSRF Protection Middleware
 *
 * Provides CSRF token generation and validation for state-changing operations.
 * Uses the double-submit cookie pattern with cryptographically secure tokens.
 */

import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(
  response: NextResponse,
  token: string,
  isLocalhost: boolean
): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: !isLocalhost,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    domain: isLocalhost ? undefined : ".stepperslife.com",
  });
}

/**
 * Get CSRF token from request cookie
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token using double-submit cookie pattern
 * Compares the token from the header with the token from the cookie
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a CSRF validation error response
 */
export function createCsrfErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "CSRF validation failed",
      message: "Invalid or missing CSRF token. Please refresh the page and try again.",
      code: "CSRF_INVALID",
    },
    { status: 403 }
  );
}

/**
 * CSRF protection middleware for API routes
 * Use this wrapper for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export function withCsrfProtection<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T | { error: string; message: string; code: string }>> {
  return async (request: NextRequest) => {
    // Skip CSRF validation for safe methods
    const method = request.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return handler(request);
    }

    // Validate CSRF token
    if (!validateCsrfToken(request)) {
      return createCsrfErrorResponse() as NextResponse<T | { error: string; message: string; code: string }>;
    }

    return handler(request);
  };
}

/**
 * Middleware to generate and set CSRF token if not present
 * Should be used in middleware.ts or on GET requests that render forms
 */
export function ensureCsrfToken(
  request: NextRequest,
  response: NextResponse,
  isLocalhost: boolean
): void {
  const existingToken = getCsrfTokenFromCookie(request);

  if (!existingToken) {
    const newToken = generateCsrfToken();
    setCsrfCookie(response, newToken, isLocalhost);
  }
}

/**
 * API route helper to get or create CSRF token
 * Returns the token for inclusion in page data
 */
export function getOrCreateCsrfToken(request: NextRequest): {
  token: string;
  isNew: boolean;
} {
  const existingToken = getCsrfTokenFromCookie(request);

  if (existingToken) {
    return { token: existingToken, isNew: false };
  }

  return { token: generateCsrfToken(), isNew: true };
}
