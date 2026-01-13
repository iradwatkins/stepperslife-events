/**
 * Auth Service Layer
 *
 * Centralizes authentication business logic, providing a clean separation
 * between API routes and core functionality. This enables:
 * - Better testability
 * - Consistent error handling
 * - Reusable auth operations
 * - Type-safe results
 */

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexClient } from "@/lib/auth/convex-client";
import { hashPassword, verifyPassword } from "@/lib/auth/password-utils";
import { sendEmailVerificationEmail } from "@/lib/email/send";
import { logger, securityLogger } from "@/lib/logging/logger";

// Email verification API - dynamically accessed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emailVerificationApi = (api as any).emailVerification?.mutations;

/**
 * Result type for service operations
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * User data returned from auth operations
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

/**
 * Login result
 */
export interface LoginResult {
  user: AuthUser;
  requiresVerification: boolean;
}

/**
 * Registration result
 */
export interface RegisterResult {
  userId: string;
  email: string;
  requiresVerification: boolean;
}

/**
 * Auth Service class with static methods for authentication operations
 */
export class AuthService {
  /**
   * Authenticate a user with email and password
   */
  static async login(
    email: string,
    password: string,
    clientIp: string
  ): Promise<ServiceResult<LoginResult>> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Get user from database
      const user = await convexClient.query(api.users.queries.getUserByEmail, {
        email: normalizedEmail,
      });

      if (!user || !user.passwordHash) {
        securityLogger.authFailure(normalizedEmail, "User not found or no password", clientIp);
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        };
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        securityLogger.authFailure(normalizedEmail, "Invalid password", clientIp);
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        };
      }

      // Check email verification status
      const requiresVerification = user.emailVerified !== true;

      securityLogger.authSuccess(user._id, user.email, "password", clientIp);

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name || user.email,
            role: user.role || "user",
            emailVerified: user.emailVerified === true,
          },
          requiresVerification,
        },
      };
    } catch (error) {
      logger.error("Login service error", error instanceof Error ? error : undefined);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during login",
        },
      };
    }
  }

  /**
   * Register a new user
   */
  static async register(
    name: string,
    email: string,
    password: string,
    clientIp: string
  ): Promise<ServiceResult<RegisterResult>> {
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    try {
      // Check if user already exists
      const existingUser = await convexClient.query(api.users.queries.getUserByEmail, {
        email: normalizedEmail,
      });

      if (existingUser) {
        return {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "An account with this email already exists",
          },
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const userId = await convexClient.mutation(api.users.mutations.createUser, {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "user",
      });

      if (!userId) {
        return {
          success: false,
          error: {
            code: "CREATE_FAILED",
            message: "Failed to create user account",
          },
        };
      }

      // Initialize credits (non-blocking)
      try {
        await convexClient.mutation(api.credits.mutations.initializeCredits, {
          organizerId: userId,
        });
      } catch {
        // Non-fatal - credits can be initialized later
      }

      // Send verification email
      await this.sendVerificationEmail(userId, normalizedEmail, trimmedName);

      securityLogger.authSuccess(userId, normalizedEmail, "registration", clientIp);

      return {
        success: true,
        data: {
          userId,
          email: normalizedEmail,
          requiresVerification: true,
        },
      };
    } catch (error) {
      logger.error("Registration service error", error instanceof Error ? error : undefined);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during registration",
        },
      };
    }
  }

  /**
   * Send email verification code
   */
  static async sendVerificationEmail(
    userId: Id<"users">,
    email: string,
    name: string
  ): Promise<ServiceResult<{ expiresAt: number }>> {
    try {
      // Generate verification code
      const code = this.generateVerificationCode();
      const codeHash = await this.hashVerificationCode(code);

      // Create verification token in database
      if (emailVerificationApi?.createVerificationToken) {
        const result = await convexClient.mutation(
          emailVerificationApi.createVerificationToken,
          {
            userId,
            email: email.toLowerCase(),
            codeHash,
          }
        );

        // Send email
        const emailResult = await sendEmailVerificationEmail(email, {
          name,
          verificationCode: code,
          expiresIn: "15 minutes",
        });

        if (!emailResult.success) {
          logger.warn("Verification email failed", { email, error: emailResult.error });
        }

        return {
          success: true,
          data: { expiresAt: result.expiresAt },
        };
      }

      return {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Email verification not available",
        },
      };
    } catch (error) {
      logger.error("Send verification email error", error instanceof Error ? error : undefined);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send verification email",
        },
      };
    }
  }

  /**
   * Verify email with code
   */
  static async verifyEmail(
    email: string,
    code: string,
    clientIp: string
  ): Promise<ServiceResult<{ userId: string }>> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const codeHash = await this.hashVerificationCode(code);

      if (!emailVerificationApi?.verifyEmail) {
        return {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Email verification not available",
          },
        };
      }

      const result = await convexClient.mutation(emailVerificationApi.verifyEmail, {
        email: normalizedEmail,
        codeHash,
      });

      if (!result.success) {
        securityLogger.authFailure(normalizedEmail, result.error || "Verification failed", clientIp);
        return {
          success: false,
          error: {
            code: "VERIFICATION_FAILED",
            message: result.error || "Invalid verification code",
            details: { attemptsRemaining: result.attemptsRemaining },
          },
        };
      }

      securityLogger.authSuccess(result.userId, normalizedEmail, "email-verification", clientIp);

      return {
        success: true,
        data: { userId: result.userId },
      };
    } catch (error) {
      logger.error("Verify email service error", error instanceof Error ? error : undefined);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during verification",
        },
      };
    }
  }

  /**
   * Get verification status for an email
   */
  static async getVerificationStatus(email: string): Promise<ServiceResult<{
    hasPendingVerification: boolean;
    verified: boolean;
    expired: boolean;
    canResend: boolean;
    waitSeconds: number;
  }>> {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      if (!emailVerificationApi?.getVerificationTokenInfo) {
        return {
          success: true,
          data: {
            hasPendingVerification: false,
            verified: false,
            expired: false,
            canResend: false,
            waitSeconds: 0,
          },
        };
      }

      const result = await convexClient.mutation(
        emailVerificationApi.getVerificationTokenInfo,
        { email: normalizedEmail }
      );

      return {
        success: true,
        data: {
          hasPendingVerification: result.exists && !result.verified && !result.expired,
          verified: result.verified || false,
          expired: result.expired || false,
          canResend: result.canResend || false,
          waitSeconds: result.waitSeconds || 0,
        },
      };
    } catch (error) {
      logger.error("Get verification status error", error instanceof Error ? error : undefined);
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check verification status",
        },
      };
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private static generateVerificationCode(): string {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }

  /**
   * Hash verification code using SHA-256
   */
  private static async hashVerificationCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code + process.env.JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
