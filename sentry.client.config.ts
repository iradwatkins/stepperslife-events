/**
 * Sentry Client Configuration
 *
 * This file configures the Sentry SDK for client-side error tracking.
 * Only runs in production unless DEBUG_SENTRY is enabled.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Only enable in production (unless debugging)
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.DEBUG_SENTRY === "true",

  // Add integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text for privacy
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Set environment
  environment: process.env.NODE_ENV,

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    // Chrome errors
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network errors
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // Convex client disconnect (expected during page navigation)
    "Convex client disconnected",
  ],

  // Additional configuration
  beforeSend(event) {
    // Don't send events for localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.DEBUG_SENTRY
    ) {
      return null;
    }
    return event;
  },
});
