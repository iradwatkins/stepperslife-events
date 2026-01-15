import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Save all notification preferences for the current user
 */
export const saveNotificationPreferences = mutation({
  args: {
    enablePush: v.boolean(),
    enableEmail: v.boolean(),
    categories: v.object({
      order: v.boolean(),
      event: v.boolean(),
      ticket: v.boolean(),
      class: v.boolean(),
      payout: v.boolean(),
      review: v.boolean(),
      message: v.boolean(),
      system: v.boolean(),
      promotion: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Parse the identity
    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      throw new Error("Email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Check if preferences already exist
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        enablePush: args.enablePush,
        enableEmail: args.enableEmail,
        categories: args.categories,
        updatedAt: now,
      });
      return { success: true, preferencesId: existing._id, action: "updated" };
    } else {
      // Create new preferences
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        enablePush: args.enablePush,
        enableEmail: args.enableEmail,
        categories: args.categories,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, preferencesId, action: "created" };
    }
  },
});

/**
 * Update a single notification category preference
 */
export const updateCategoryPreference = mutation({
  args: {
    category: v.union(
      v.literal("order"),
      v.literal("event"),
      v.literal("ticket"),
      v.literal("class"),
      v.literal("payout"),
      v.literal("review"),
      v.literal("message"),
      v.literal("system"),
      v.literal("promotion")
    ),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      throw new Error("Email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Get existing preferences or create defaults
    let preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (preferences) {
      // Update the specific category
      const updatedCategories = {
        ...preferences.categories,
        [args.category]: args.enabled,
      };

      await ctx.db.patch(preferences._id, {
        categories: updatedCategories,
        updatedAt: now,
      });
    } else {
      // Create with defaults, but set the specified category
      const defaultCategories = {
        order: true,
        event: true,
        ticket: true,
        class: true,
        payout: true,
        review: true,
        message: true,
        system: true,
        promotion: false,
      };

      await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        enablePush: true,
        enableEmail: true,
        categories: {
          ...defaultCategories,
          [args.category]: args.enabled,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Toggle master push notifications on/off
 */
export const togglePushNotifications = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      throw new Error("Email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (preferences) {
      await ctx.db.patch(preferences._id, {
        enablePush: args.enabled,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        enablePush: args.enabled,
        enableEmail: true,
        categories: {
          order: true,
          event: true,
          ticket: true,
          class: true,
          payout: true,
          review: true,
          message: true,
          system: true,
          promotion: false,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Toggle master email notifications on/off
 */
export const toggleEmailNotifications = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      throw new Error("Email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (preferences) {
      await ctx.db.patch(preferences._id, {
        enableEmail: args.enabled,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId: user._id,
        enablePush: true,
        enableEmail: args.enabled,
        categories: {
          order: true,
          event: true,
          ticket: true,
          class: true,
          payout: true,
          review: true,
          message: true,
          system: true,
          promotion: false,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
