/**
 * Next.js Instrumentation
 *
 * This file is used by Next.js to initialize instrumentation
 * such as Sentry for different runtimes.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
