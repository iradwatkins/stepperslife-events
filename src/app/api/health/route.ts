/**
 * Health Check Endpoint
 *
 * Provides system health status for monitoring and load balancers.
 * Returns detailed status of all critical dependencies.
 *
 * GET /api/health - Full health check
 * GET /api/health?quick=true - Quick liveness check
 */

import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";
import { getRateLimitStatus } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  service: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    email: ComponentHealth;
    stripe: ComponentHealth;
    paypal: ComponentHealth;
  };
}

interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * Check Convex database connectivity
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    // Simple query to verify database connectivity
    await convexClient.query(api.users.queries.getUserByEmail, {
      email: "health-check@internal.test",
    });
    const latency = Math.round(performance.now() - start);
    return { status: "healthy", latency };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    // Query will return null for non-existent user, but connection works
    // Only truly fail if it's a connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("null") ||
      errorMessage.includes("undefined")
    ) {
      return { status: "healthy", latency };
    }
    return {
      status: "unhealthy",
      latency,
      message: "Database connection failed",
    };
  }
}

/**
 * Check Redis connectivity (if configured)
 */
function checkRedis(): ComponentHealth {
  const status = getRateLimitStatus();
  if (status.mode === "redis" && status.redisConnected) {
    return { status: "healthy", message: "Redis connected" };
  }
  // Not having Redis is degraded, not unhealthy (has fallback)
  return {
    status: "degraded",
    message: status.mode === "memory" ? "Using in-memory fallback" : "Redis not connected",
  };
}

/**
 * Check email service configuration
 */
function checkEmail(): ComponentHealth {
  const postalKey = process.env.POSTAL_API_KEY;
  const postalUrl = process.env.POSTAL_URL;

  if (postalKey && postalUrl) {
    return { status: "healthy", message: "Email service configured" };
  }
  return {
    status: "degraded",
    message: "Email service not fully configured",
  };
}

/**
 * Check Stripe configuration
 */
function checkStripe(): ComponentHealth {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (secretKey && webhookSecret && publishableKey) {
    return { status: "healthy", message: "Stripe fully configured" };
  }
  if (secretKey && publishableKey) {
    return { status: "degraded", message: "Stripe webhook secret missing" };
  }
  return { status: "unhealthy", message: "Stripe not configured" };
}

/**
 * Check PayPal configuration
 */
function checkPayPal(): ComponentHealth {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return { status: "healthy", message: "PayPal configured" };
  }
  return {
    status: "degraded",
    message: "PayPal not configured",
  };
}

/**
 * Determine overall health from component checks
 */
function determineOverallStatus(
  checks: HealthStatus["checks"]
): "healthy" | "degraded" | "unhealthy" {
  const statuses = Object.values(checks).map((c) => c.status);

  // If any critical component is unhealthy, overall is unhealthy
  if (checks.database.status === "unhealthy") {
    return "unhealthy";
  }

  // If Stripe is unhealthy (payments critical), overall is degraded
  if (checks.stripe.status === "unhealthy") {
    return "degraded";
  }

  // If any component is unhealthy, overall is degraded
  if (statuses.some((s) => s === "unhealthy")) {
    return "degraded";
  }

  // If any component is degraded, overall is degraded
  if (statuses.some((s) => s === "degraded")) {
    return "degraded";
  }

  return "healthy";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const isQuickCheck = searchParams.get("quick") === "true";

  // Quick liveness check - just return OK
  if (isQuickCheck) {
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "events-stepperslife",
      },
      { status: 200 }
    );
  }

  // Full health check
  const [database] = await Promise.all([checkDatabase()]);

  const checks: HealthStatus["checks"] = {
    database,
    redis: checkRedis(),
    email: checkEmail(),
    stripe: checkStripe(),
    paypal: checkPayPal(),
  };

  const overallStatus = determineOverallStatus(checks);

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.round((Date.now() - serverStartTime) / 1000),
    service: "events-stepperslife",
    checks,
  };

  // Return appropriate HTTP status code
  const httpStatus =
    overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
