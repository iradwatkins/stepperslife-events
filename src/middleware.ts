/**
 * Next.js Middleware
 *
 * Applies security headers, CSRF protection, and request logging
 * to all incoming requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCspHeader, securityHeaders } from "@/lib/security/headers";
import { generateRequestId } from "@/lib/logging/logger";

/**
 * Paths that should skip security header enforcement
 */
const SKIP_SECURITY_HEADERS = [
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

/**
 * API paths that require CSRF protection (state-changing methods)
 */
const CSRF_PROTECTED_PATHS = [
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/reset-password",
  "/api/events",
  "/api/tickets",
  "/api/payments",
  "/api/organizer",
];

/**
 * Check if path should skip security headers
 */
function shouldSkipSecurityHeaders(pathname: string): boolean {
  return SKIP_SECURITY_HEADERS.some((path) => pathname.startsWith(path));
}

/**
 * Check if request requires CSRF protection
 */
function requiresCsrfProtection(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // Only protect state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return false;
  }

  const pathname = new URL(request.url).pathname;

  // Skip webhooks (they have their own signature verification)
  if (pathname.startsWith("/api/webhooks")) {
    return false;
  }

  // Check if path is in protected list
  return CSRF_PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Validate CSRF token using timing-safe comparison
 */
function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("csrf_token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Timing-safe comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply static security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply CSP header
  response.headers.set("Content-Security-Policy", getCspHeader());

  return response;
}

/**
 * Generate CSRF token and set cookie
 */
function generateCsrfCookie(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  // Generate request ID for correlation
  const requestId = generateRequestId();

  // Skip security headers for static assets
  if (shouldSkipSecurityHeaders(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Request-ID", requestId);
    return response;
  }

  // CSRF Protection for state-changing API requests
  if (requiresCsrfProtection(request)) {
    if (!validateCsrfToken(request)) {
      // Log CSRF violation
      const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown";

      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          message: "CSRF validation failed",
          context: { path: pathname, ip: clientIp },
          metadata: { event: "csrf_violation" },
        })
      );

      return NextResponse.json(
        {
          error: "CSRF_INVALID",
          code: "CSRF_INVALID",
          message: "Invalid or missing CSRF token",
        },
        { status: 403 }
      );
    }
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers
  applySecurityHeaders(response);

  // Add request ID header
  response.headers.set("X-Request-ID", requestId);

  // Set CSRF cookie if not present (for GET requests)
  if (request.method === "GET" && !request.cookies.get("csrf_token")) {
    const csrfToken = generateCsrfCookie();
    response.cookies.set("csrf_token", csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
