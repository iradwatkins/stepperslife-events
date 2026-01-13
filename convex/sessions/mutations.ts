import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Session Token Mutations
 *
 * Handles session management for secure session revocation:
 * - Create session on login
 * - Revoke session on logout
 * - Revoke all sessions (logout everywhere)
 * - Validate session is not revoked
 * - Cleanup expired sessions
 */

/**
 * Create a new session token record
 * Called after successful login to track the session
 */
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    tokenHash: v.string(), // Hash of JWT jti claim
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessionId = await ctx.db.insert("sessionTokens", {
      userId: args.userId,
      tokenHash: args.tokenHash,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      isRevoked: false,
      lastActiveAt: now,
      expiresAt: args.expiresAt,
      createdAt: now,
    });

    return { sessionId };
  },
});

/**
 * Check if a session is valid (not revoked and not expired)
 */
export const validateSession = mutation({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessionTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    if (session.isRevoked) {
      return { valid: false, reason: "Session revoked", revokedReason: session.revokedReason };
    }

    const now = Date.now();
    if (session.expiresAt < now) {
      return { valid: false, reason: "Session expired" };
    }

    // Update last active time
    await ctx.db.patch(session._id, {
      lastActiveAt: now,
    });

    return { valid: true, userId: session.userId };
  },
});

/**
 * Revoke a specific session (single logout)
 */
export const revokeSession = mutation({
  args: {
    tokenHash: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessionTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.isRevoked) {
      return { success: true, alreadyRevoked: true };
    }

    await ctx.db.patch(session._id, {
      isRevoked: true,
      revokedAt: Date.now(),
      revokedReason: args.reason || "logout",
    });

    return { success: true };
  },
});

/**
 * Revoke all sessions for a user (logout everywhere)
 */
export const revokeAllUserSessions = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
    excludeTokenHash: v.optional(v.string()), // Optionally keep current session
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let revokedCount = 0;

    // Get all active sessions for the user
    const sessions = await ctx.db
      .query("sessionTokens")
      .withIndex("by_userId_active", (q) =>
        q.eq("userId", args.userId).eq("isRevoked", false)
      )
      .collect();

    for (const session of sessions) {
      // Skip the excluded session (current session if specified)
      if (args.excludeTokenHash && session.tokenHash === args.excludeTokenHash) {
        continue;
      }

      await ctx.db.patch(session._id, {
        isRevoked: true,
        revokedAt: now,
        revokedReason: args.reason || "logout_all",
      });
      revokedCount++;
    }

    return { success: true, revokedCount };
  },
});

/**
 * Get active sessions for a user
 * Useful for "Manage Sessions" UI
 */
export const getUserSessions = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessions = await ctx.db
      .query("sessionTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to active, non-expired sessions
    const activeSessions = sessions
      .filter((s) => !s.isRevoked && s.expiresAt > now)
      .map((s) => ({
        id: s._id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }));

    return { sessions: activeSessions };
  },
});

/**
 * Cleanup expired sessions (run via cron)
 */
export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Delete sessions expired more than 24 hours ago
    const cutoff = now - 24 * 60 * 60 * 1000;
    let deleted = 0;

    // Get all sessions and filter expired ones
    const allSessions = await ctx.db.query("sessionTokens").collect();

    for (const session of allSessions) {
      if (session.expiresAt < cutoff) {
        await ctx.db.delete(session._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

/**
 * Revoke session by ID (for admin use)
 */
export const revokeSessionById = mutation({
  args: {
    sessionId: v.id("sessionTokens"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.isRevoked) {
      return { success: true, alreadyRevoked: true };
    }

    await ctx.db.patch(args.sessionId, {
      isRevoked: true,
      revokedAt: Date.now(),
      revokedReason: args.reason || "admin_revoke",
    });

    return { success: true };
  },
});
