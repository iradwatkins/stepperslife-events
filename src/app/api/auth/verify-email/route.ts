import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// Email verification API - will be available after `npx convex dev` regenerates types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emailVerificationApi = (api as any).emailVerification?.mutations;

/**
 * Verify email with 6-digit code
 *
 * POST /api/auth/verify-email
 * Body: { email: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`verify-email:${clientIp}`, rateLimiters.auth);

    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      );
    }

    // Hash the code for comparison (same method used when creating)
    const codeHash = await hashVerificationCode(code);

    // Check if API is available
    if (!emailVerificationApi?.verifyEmail) {
      return NextResponse.json(
        { error: "Email verification not available. Please try again later." },
        { status: 503 }
      );
    }

    // Verify the email
    const result = await convex.mutation(emailVerificationApi.verifyEmail, {
      email: email.toLowerCase().trim(),
      codeHash,
    });

    if (!result.success) {
      const status = result.error?.includes("expired") || result.error?.includes("Too many")
        ? 410 // Gone - token expired
        : 400;

      return NextResponse.json(
        {
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! You can now log in.",
        userId: result.userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Verify Email] Error:", error);
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

    const result = await convex.mutation(
      emailVerificationApi.getVerificationTokenInfo,
      { email: email.toLowerCase().trim() }
    );

    return NextResponse.json({
      hasPendingVerification: result.exists && !result.verified && !result.expired,
      verified: result.verified,
      expired: result.expired,
      canResend: result.canResend,
      waitSeconds: result.waitSeconds,
    });
  } catch (error) {
    console.error("[Verify Email Status] Error:", error);
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
