import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { verifyPassword } from "@/lib/auth/password-utils";
import { createAndSetSession } from "@/lib/auth/session-manager";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
  createRateLimitResponse,
} from "@/lib/rate-limit";
import { loginSchema, ValidationError } from "@/lib/validations/schemas";
import { createRequestLogger, securityLogger } from "@/lib/logging/logger";

export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  const clientIp = getClientIp(request);

  try {
    // Rate limiting - 5 attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${clientIp}`, rateLimiters.auth);

    if (!rateLimit.success) {
      securityLogger.rateLimited(`login:${clientIp}`, "/api/auth/login", clientIp);
      return createRateLimitResponse(rateLimit.retryAfter || 60);
    }

    // Parse and validate request body with Zod
    let validatedData;
    try {
      const body = await request.json();
      validatedData = loginSchema.parse(body);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(error.toJSON(), { status: 400 });
      }
      // Zod error - use issues property
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: Array<{ message: string }> };
        const message = zodError.issues.map((e) => e.message).join(", ");
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = validatedData;

    logger.debug("Login attempt", { email });

    // Get user from Convex
    const user = await convex.query(api.users.queries.getUserByEmail, {
      email,
    });

    if (!user || !user.passwordHash) {
      securityLogger.authFailure(email, "User not found or no password", clientIp);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password using centralized utility
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      securityLogger.authFailure(email, "Invalid password", clientIp);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if email is verified (soft check - allow login but flag)
    const requiresVerification = user.emailVerified !== true;

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified === true,
        },
        requiresVerification,
      },
      { status: 200 }
    );

    // Create session token and set cookie using centralized utility
    await createAndSetSession(
      response,
      {
        userId: user._id,
        email: user.email,
        name: user.name || user.email,
        role: user.role || "user",
      },
      request
    );

    securityLogger.authSuccess(user._id, user.email, "password", clientIp);
    logger.logWithTiming("info", "Login successful");

    return response;
  } catch (error) {
    logger.error("Login error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
