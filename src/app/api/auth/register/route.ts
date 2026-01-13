import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { hashPassword } from "@/lib/auth/password-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
  createRateLimitResponse,
} from "@/lib/rate-limit";
import { sendEmailVerificationEmail } from "@/lib/email/send";
import { registerSchema } from "@/lib/validations/schemas";
import { createRequestLogger, securityLogger } from "@/lib/logging/logger";
import { z } from "zod";

// Email verification API - will be available after `npx convex dev` regenerates types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emailVerificationApi = (api as any).emailVerification?.mutations;

export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  const clientIp = getClientIp(request);

  try {
    // Rate limiting - 5 attempts per minute per IP
    const rateLimit = checkRateLimit(`register:${clientIp}`, rateLimiters.auth);

    if (!rateLimit.success) {
      securityLogger.rateLimited(`register:${clientIp}`, "/api/auth/register", clientIp);
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    // Parse and validate request body with Zod
    let validatedData;
    try {
      const body = await request.json();
      validatedData = registerSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues.map((e) => e.message).join(", ");
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, password } = validatedData;

    logger.debug("Registration attempt", { email });

    // Check if user already exists
    const existingUser = await convex.query(api.users.queries.getUserByEmail, {
      email,
    });

    if (existingUser) {
      logger.debug("Registration failed - user exists", { email });
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user in Convex
    const userId = await convex.mutation(api.users.mutations.createUser, {
      name,
      email,
      passwordHash: hashedPassword,
      role: "user",
    });

    if (!userId) {
      logger.error("Failed to create user account");
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    logger.info("User created successfully", { userId, email });

    // Initialize credits for the new user (non-blocking)
    try {
      await convex.mutation(api.credits.mutations.initializeCredits, {
        organizerId: userId,
      });
    } catch (creditError) {
      logger.warn("Failed to initialize credits", { userId, error: String(creditError) });
      // Non-fatal - credits can be initialized later
    }

    // Generate and send email verification code
    const verificationCode = generateVerificationCode();
    const codeHash = await hashVerificationCode(verificationCode);

    try {
      // Create verification token in database
      if (emailVerificationApi?.createVerificationToken) {
        await convex.mutation(emailVerificationApi.createVerificationToken, {
          userId,
          email,
          codeHash,
        });
        logger.debug("Verification token created", { userId });
      } else {
        logger.warn("Email verification API not available");
      }

      // Send verification email
      const emailResult = await sendEmailVerificationEmail(email, {
        name,
        verificationCode,
        expiresIn: "15 minutes",
      });

      if (!emailResult.success) {
        logger.warn("Verification email failed", { email, error: emailResult.error });
        // Continue - user can request resend
      } else {
        logger.debug("Verification email sent", { email });
      }
    } catch (verificationError) {
      logger.error("Verification setup failed", verificationError instanceof Error ? verificationError : undefined);
      // Continue - user can request resend
    }

    securityLogger.authSuccess(userId, email, "registration", clientIp);
    logger.logWithTiming("info", "Registration completed");

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
    logger.error("Registration error", error instanceof Error ? error : undefined);
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
