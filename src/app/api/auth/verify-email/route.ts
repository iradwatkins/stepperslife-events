import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
  createRateLimitResponse,
} from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validations/schemas";
import { createRequestLogger, securityLogger } from "@/lib/logging/logger";
import { z } from "zod";

// Email verification API - will be available after `npx convex dev` regenerates types
// Dynamically access module that may not exist in generated types
import type { FunctionReference } from "convex/server";
type EmailVerificationMutations = Record<string, FunctionReference<"mutation">>;
type ConvexApiWithEmailVerification = {
  emailVerification?: {
    mutations?: EmailVerificationMutations;
  };
};
const emailVerificationApi = (api as unknown as ConvexApiWithEmailVerification)
  .emailVerification?.mutations;

/**
 * Verify email with 6-digit code
 *
 * POST /api/auth/verify-email
 * Body: { email: string, code: string }
 */
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  const clientIp = getClientIp(request);

  try {
    // Rate limiting - 10 attempts per minute per IP
    const rateLimit = checkRateLimit(`verify-email:${clientIp}`, rateLimiters.verification);

    if (!rateLimit.success) {
      securityLogger.rateLimited(`verify-email:${clientIp}`, "/api/auth/verify-email", clientIp);
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    // Parse and validate request body with Zod
    let validatedData;
    try {
      const body = await request.json();
      validatedData = verifyEmailSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues.map((e) => e.message).join(", ");
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, code } = validatedData;

    logger.debug("Email verification attempt", { email });

    // Hash the code for comparison (same method used when creating)
    const codeHash = await hashVerificationCode(code);

    // Check if API is available
    if (!emailVerificationApi?.verifyEmail) {
      logger.warn("Email verification API not available");
      return NextResponse.json(
        { error: "Email verification not available. Please try again later." },
        { status: 503 }
      );
    }

    // Verify the email
    const result = await convex.mutation(emailVerificationApi.verifyEmail, {
      email,
      codeHash,
    });

    if (!result.success) {
      const isExpired = result.error?.includes("expired") || result.error?.includes("Too many");
      const status = isExpired ? 410 : 400;

      securityLogger.authFailure(email, result.error || "Verification failed", clientIp);
      logger.debug("Verification failed", { email, error: result.error });

      return NextResponse.json(
        {
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status }
      );
    }

    securityLogger.authSuccess(result.userId, email, "email-verification", clientIp);
    logger.logWithTiming("info", "Email verified successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! You can now log in.",
        userId: result.userId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Verify email error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "An error occurred during verification. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Check verification status
 *
 * GET /api/auth/verify-email?email=user@example.com
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Check if API is available
    if (!emailVerificationApi?.getVerificationTokenInfo) {
      return NextResponse.json({
        hasPendingVerification: false,
        verified: false,
        error: "Email verification not available",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    logger.debug("Checking verification status", { email: normalizedEmail });

    const result = await convex.mutation(
      emailVerificationApi.getVerificationTokenInfo,
      { email: normalizedEmail }
    );

    return NextResponse.json({
      hasPendingVerification: result.exists && !result.verified && !result.expired,
      verified: result.verified,
      expired: result.expired,
      canResend: result.canResend,
      waitSeconds: result.waitSeconds,
    });
  } catch (error) {
    logger.error("Verify email status error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Hash verification code using simple SHA-256
 * This provides basic security without the overhead of bcrypt
 */
async function hashVerificationCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + process.env.JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
