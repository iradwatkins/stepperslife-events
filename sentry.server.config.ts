/**
 * Sentry Server Configuration
 *
 * This file configures the Sentry SDK for server-side error tracking.
 * Runs in Node.js server environment.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Set environment
  environment: process.env.NODE_ENV,

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Expected disconnects
    "Convex client disconnected",
    // Network issues
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
  ],
});
