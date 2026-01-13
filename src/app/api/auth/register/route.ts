import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import {
  hashPassword,
  validatePasswordStrength,
  validateEmailFormat,
} from "@/lib/auth/password-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
  createRateLimitResponse,
} from "@/lib/rate-limit";
import { sendEmailVerificationEmail } from "@/lib/email/send";

// Email verification API - will be available after `npx convex dev` regenerates types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emailVerificationApi = (api as any).emailVerification?.mutations;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}`, rateLimiters.auth);

    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Please provide all required fields" }, { status: 400 });
    }

    if (!validateEmailFormat(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // Check if user already exists
    try {
      const existingUser = await convex.query(api.users.queries.getUserByEmail, {
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    } catch {
      // User not found - this is expected, continue with registration
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user in Convex
    const userId = await convex.mutation(api.users.mutations.createUser, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      role: "user",
    });

    if (!userId) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    // Initialize credits for the new user (non-blocking)
    try {
      await convex.mutation(api.credits.mutations.initializeCredits, {
        organizerId: userId,
      });
    } catch {
      // Non-fatal - credits can be initialized later
    }

    // Generate and send email verification code
    const verificationCode = generateVerificationCode();
    const codeHash = await hashVerificationCode(verificationCode);

    try {
      // Create verification token in database
      // Note: emailVerificationApi may be undefined until convex types are regenerated
      if (emailVerificationApi?.createVerificationToken) {
        await convex.mutation(emailVerificationApi.createVerificationToken, {
          userId,
          email: email.toLowerCase().trim(),
          codeHash,
        });
      } else {
        console.warn("[Register] Email verification API not available - run 'npx convex dev' to regenerate types");
      }

      // Send verification email
      const emailResult = await sendEmailVerificationEmail(email.toLowerCase().trim(), {
        name: name.trim(),
        verificationCode,
        expiresIn: "15 minutes",
      });

      if (!emailResult.success) {
        console.error("[Register] Verification email failed:", emailResult.error);
        // Continue - user can request resend
      }
    } catch (verificationError) {
      console.error("[Register] Verification setup failed:", verificationError);
      // Continue - user can request resend
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created! Please check your email for a verification code.",
        userId,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
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
