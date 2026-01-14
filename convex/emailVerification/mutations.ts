import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Email Verification Mutations
 *
 * Handles email verification for new user registrations.
 * Uses 6-digit codes that expire after 15 minutes.
 */

// Verification code expires in 15 minutes
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000;

// Max verification attempts before lockout
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Create a new email verification token
 * Called after user registration from the API route
 */
export const createVerificationToken = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    codeHash: v.string(), // Pre-hashed 6-digit code
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete any existing verification tokens for this user
    const existingTokens = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const token of existingTokens) {
      await ctx.db.delete(token._id);
    }

    // Create new verification token
    const tokenId = await ctx.db.insert("emailVerificationTokens", {
      userId: args.userId,
      email: args.email.toLowerCase(),
      code: args.codeHash,
      expiresAt: now + VERIFICATION_EXPIRY_MS,
      verified: false,
      attempts: 0,
      createdAt: now,
    });

    return { tokenId, expiresAt: now + VERIFICATION_EXPIRY_MS };
  },
});

/**
 * Verify an email using the verification code
 * Returns success status and any error messages
 */
export const verifyEmail = mutation({
  args: {
    email: v.string(),
    codeHash: v.string(), // Pre-hashed code for comparison
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.toLowerCase();

    // Find the verification token
    const token = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!token) {
      return {
        success: false,
        error: "No verification token found. Please request a new code.",
      };
    }

    // Check if already verified
    if (token.verified) {
      return {
        success: false,
        error: "Email already verified. Please log in.",
      };
    }

    // Check if expired
    if (token.expiresAt < now) {
      // Delete expired token
      await ctx.db.delete(token._id);
      return {
        success: false,
        error: "Verification code expired. Please request a new code.",
      };
    }

    // Check if too many attempts
    if ((token.attempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
      // Delete the token to force a new request
      await ctx.db.delete(token._id);
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code.",
      };
    }

    // Verify the code
    if (token.code !== args.codeHash) {
      // Increment attempts
      await ctx.db.patch(token._id, {
        attempts: (token.attempts || 0) + 1,
      });
      return {
        success: false,
        error: "Invalid verification code. Please try again.",
        attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - ((token.attempts || 0) + 1),
      };
    }

    // Code is valid - mark as verified and update user
    await ctx.db.patch(token._id, {
      verified: true,
    });

    // Update the user's emailVerified status
    await ctx.db.patch(token.userId, {
      emailVerified: true,
      updatedAt: now,
    });

    // Delete the token (no longer needed)
    await ctx.db.delete(token._id);

    return {
      success: true,
      userId: token.userId,
    };
  },
});

/**
 * Check if a user's email is verified
 */
export const checkEmailVerified = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return { verified: false, error: "User not found" };
    }

    return {
      verified: user.emailVerified === true,
      email: user.email,
    };
  },
});

/**
 * Get pending verification token info (for resend)
 * Does not return the actual code, just metadata
 */
export const getVerificationTokenInfo = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    const token = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!token) {
      return { exists: false };
    }

    const now = Date.now();

    return {
      exists: true,
      expired: token.expiresAt < now,
      verified: token.verified === true,
      attemptsUsed: token.attempts || 0,
      expiresAt: token.expiresAt,
      // Rate limit info - don't allow resend if token was created less than 60 seconds ago
      canResend: now - token.createdAt > 60 * 1000,
      waitSeconds: Math.max(0, Math.ceil((token.createdAt + 60 * 1000 - now) / 1000)),
    };
  },
});

/**
 * Delete verification token (for cleanup or forced resend)
 */
export const deleteVerificationToken = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    const tokens = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    return { deleted: tokens.length };
  },
});

/**
 * Internal mutation to clean up expired tokens
 * Should be run periodically via cron job
 */
export const cleanupExpiredTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deleted = 0;

    // Get all tokens and filter expired ones
    const allTokens = await ctx.db.query("emailVerificationTokens").collect();

    for (const token of allTokens) {
      // Delete if expired (more than 24 hours old as extra buffer)
      if (token.expiresAt < now - 24 * 60 * 60 * 1000) {
        await ctx.db.delete(token._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
