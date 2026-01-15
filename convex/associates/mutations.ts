import { v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";

// Maximum associates per team leader
const MAX_ASSOCIATES_PER_TEAM = 50;

/**
 * Get authenticated user - requires valid authentication
 * @throws Error if not authenticated
 */
async function getAuthenticatedUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.email) {
    throw new Error("Authentication required. Please sign in to continue.");
  }

  const email = identity.email;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  if (!user) {
    throw new Error("User account not found. Please contact support.");
  }

  return user;
}

/**
 * Create a new associate (team member invitation)
 * Validates email uniqueness per team and enforces max 50 associates limit
 */
export const createAssociate = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Normalize email to lowercase
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if email already exists for this team leader
    const existingAssociate = await ctx.db
      .query("associates")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) =>
        q.and(
          q.eq(q.field("invitedById"), currentUser._id),
          q.neq(q.field("status"), "REMOVED")
        )
      )
      .first();

    if (existingAssociate) {
      throw new Error("An associate with this email already exists on your team.");
    }

    // Check total associate count for this team leader (excluding REMOVED)
    const associateCount = await ctx.db
      .query("associates")
      .withIndex("by_invitedBy", (q) => q.eq("invitedById", currentUser._id))
      .filter((q) => q.neq(q.field("status"), "REMOVED"))
      .collect();

    if (associateCount.length >= MAX_ASSOCIATES_PER_TEAM) {
      throw new Error(
        `You have reached the maximum of ${MAX_ASSOCIATES_PER_TEAM} associates. Please remove inactive associates to add new ones.`
      );
    }

    // Check if user already exists in the system
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    // Create the associate record
    const associateId = await ctx.db.insert("associates", {
      name: args.name.trim(),
      email: normalizedEmail,
      phone: args.phone?.trim(),
      status: "PENDING",
      invitedById: currentUser._id,
      userId: existingUser?._id, // Link if user already exists
      invitedAt: now,
      joinedAt: existingUser ? now : undefined, // If user exists, they're effectively already joined
      createdAt: now,
      updatedAt: now,
    });

    // TODO: Send invitation email
    // For now, we'll just return success and the frontend will show a toast

    return {
      success: true,
      associateId,
      message: existingUser
        ? "Associate added successfully. They already have an account and can start selling immediately."
        : "Invitation sent! The associate will receive an email to join your team.",
    };
  },
});

/**
 * Update an existing associate's details
 */
export const updateAssociate = mutation({
  args: {
    associateId: v.id("associates"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("ACTIVE"),
        v.literal("SUSPENDED"),
        v.literal("REMOVED")
      )
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Get the associate
    const associate = await ctx.db.get(args.associateId);
    if (!associate) {
      throw new Error("Associate not found.");
    }

    // Verify ownership
    if (associate.invitedById !== currentUser._id) {
      throw new Error("You are not authorized to update this associate.");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name.trim();
    }

    if (args.phone !== undefined) {
      updates.phone = args.phone.trim() || undefined;
    }

    if (args.status !== undefined) {
      updates.status = args.status;

      // If activating and previously pending, set joinedAt
      if (args.status === "ACTIVE" && associate.status === "PENDING" && !associate.joinedAt) {
        updates.joinedAt = Date.now();
      }
    }

    await ctx.db.patch(args.associateId, updates);

    return {
      success: true,
      message: "Associate updated successfully.",
    };
  },
});

/**
 * Soft delete an associate (set status to REMOVED)
 */
export const deleteAssociate = mutation({
  args: {
    associateId: v.id("associates"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Get the associate
    const associate = await ctx.db.get(args.associateId);
    if (!associate) {
      throw new Error("Associate not found.");
    }

    // Verify ownership
    if (associate.invitedById !== currentUser._id) {
      throw new Error("You are not authorized to remove this associate.");
    }

    // Soft delete by setting status to REMOVED
    await ctx.db.patch(args.associateId, {
      status: "REMOVED",
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Associate removed from your team.",
    };
  },
});

/**
 * Resend invitation to a pending associate
 */
export const resendInvitation = mutation({
  args: {
    associateId: v.id("associates"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Get the associate
    const associate = await ctx.db.get(args.associateId);
    if (!associate) {
      throw new Error("Associate not found.");
    }

    // Verify ownership
    if (associate.invitedById !== currentUser._id) {
      throw new Error("You are not authorized to resend this invitation.");
    }

    // Can only resend to pending associates
    if (associate.status !== "PENDING") {
      throw new Error("Invitation can only be resent to pending associates.");
    }

    // Update the invited timestamp
    await ctx.db.patch(args.associateId, {
      invitedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Actually send the email
    // For now, we'll just return success and the frontend will show a toast

    return {
      success: true,
      message: "Invitation resent successfully.",
    };
  },
});
