import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { sendEmailVerificationEmail } from "@/lib/email/send";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/rate-limit";

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
 * Resend email verification code
 *
 * POST /api/auth/resend-verification
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`resend-verification:${clientIp}`, {
      maxRequests: 3,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if API is available
    if (!emailVerificationApi?.getVerificationTokenInfo) {
      return NextResponse.json(
        { error: "Email verification not available. Please try again later." },
        { status: 503 }
      );
    }

    // Check if there's a pending verification and can resend
    const tokenInfo = await convex.mutation(
      emailVerificationApi.getVerificationTokenInfo,
      { email: normalizedEmail }
    );

    // If already verified
    if (tokenInfo.verified) {
      return NextResponse.json(
        { error: "Email is already verified. Please log in." },
        { status: 400 }
      );
    }

    // If resend too soon
    if (tokenInfo.exists && !tokenInfo.canResend) {
      return NextResponse.json(
        {
          error: `Please wait ${tokenInfo.waitSeconds} seconds before requesting a new code.`,
          waitSeconds: tokenInfo.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Get the user to verify they exist
    const user = await convex.query(api.users.queries.getUserByEmail, {
      email: normalizedEmail,
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { success: true, message: "If an account exists, a new verification code has been sent." },
        { status: 200 }
      );
    }

    // Check if already verified at user level
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. Please log in." },
        { status: 400 }
      );
    }

    // Delete existing token if any
    await convex.mutation(emailVerificationApi.deleteVerificationToken, {
      email: normalizedEmail,
    });

    // Generate new 6-digit verification code
    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);

    // Create new verification token
    const { expiresAt } = await convex.mutation(
      emailVerificationApi.createVerificationToken,
      {
        userId: user._id,
        email: normalizedEmail,
        codeHash,
      }
    );

    // Send verification email
    const emailResult = await sendEmailVerificationEmail(normalizedEmail, {
      name: user.name || "there",
      verificationCode: code,
      expiresIn: "15 minutes",
    });

    if (!emailResult.success) {
      console.error("[Resend Verification] Email send failed:", emailResult.error);
      // Don't delete the token - user can try to resend again
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "A new verification code has been sent to your email.",
        expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  // Generate cryptographically secure random number
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Convert to 6-digit number (100000-999999)
  const code = 100000 + (array[0] % 900000);
  return code.toString();
}

/**
 * Hash verification code using SHA-256
 */
async function hashVerificationCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + process.env.JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
