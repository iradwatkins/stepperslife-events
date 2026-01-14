/**
 * Security Headers Configuration
 *
 * Provides security headers for protection against common web vulnerabilities:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { NextResponse } from "next/server";

/**
 * CSP directives configuration
 */
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    "https://js.stripe.com",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.sentry.io",
    "https://static.cloudflareinsights.com", // Cloudflare Web Analytics
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for styled-components/emotion/tailwind
  ],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "https://*.stripe.com",
    "https://*.paypal.com",
    "https://*.googleusercontent.com",
    "https://*.convex.cloud",
  ],
  "font-src": [
    "'self'",
    "data:",
    "https://fonts.gstatic.com",
  ],
  "connect-src": [
    "'self'",
    "https://*.convex.cloud",
    "wss://*.convex.cloud",
    "https://api.stripe.com",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
    "https://www.google-analytics.com",
    "https://*.sentry.io",
    "https://postal.toolboxhosting.com",
    // Self-hosted Convex - need both https and wss protocols
    "https://convex.toolboxhosting.com",
    "wss://convex.toolboxhosting.com",
  ].filter(Boolean),
  "frame-src": [
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://www.paypal.com",
    "https://www.sandbox.paypal.com",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
  "upgrade-insecure-requests": [],
};

/**
 * Build CSP header string from directives
 */
function buildCspHeader(directives: typeof cspDirectives): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Security headers to apply to all responses
 */
export const securityHeaders: Record<string, string> = {
  // Prevent clickjacking
  "X-Frame-Options": "SAMEORIGIN",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS filter in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // DNS prefetch control
  "X-DNS-Prefetch-Control": "on",

  // Permissions Policy (formerly Feature-Policy)
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=(self)",
    "payment=(self https://js.stripe.com https://www.paypal.com)",
  ].join(", "),
};

/**
 * Get CSP header for the current environment
 */
export function getCspHeader(): string {
  const isProduction = process.env.NODE_ENV === "production";

  // Clone directives for modification
  const directives = { ...cspDirectives };

  // In development, allow localhost connections
  if (!isProduction) {
    directives["connect-src"] = [
      ...directives["connect-src"],
      "http://localhost:*",
      "ws://localhost:*",
    ];
  }

  return buildCspHeader(directives);
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply static security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply CSP header
  response.headers.set("Content-Security-Policy", getCspHeader());

  return response;
}

/**
 * Create a new response with security headers
 */
export function secureResponse<T>(
  data: T,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const response = NextResponse.json(data, { status: options?.status ?? 200 });

  // Apply security headers
  applySecurityHeaders(response);

  // Apply custom headers
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Security headers for Next.js config
 * Use in next.config.js for static headers
 */
export const nextConfigSecurityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self https://js.stripe.com https://www.paypal.com)",
  },
];

/**
 * CORS headers for API routes
 */
export function applyCorsHeaders(
  response: NextResponse,
  options?: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
  }
): NextResponse {
  const {
    allowedOrigins = ["https://stepperslife.com", "https://events.stepperslife.com"],
    allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization", "X-CSRF-Token", "X-Request-ID"],
    maxAge = 86400,
  } = options ?? {};

  // In development, allow localhost
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:3001");
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigins.join(", "));
  response.headers.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
  response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
  response.headers.set("Access-Control-Max-Age", String(maxAge));
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}
