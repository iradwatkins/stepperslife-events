/**
 * Notification Preferences Queries
 *
 * Story 13.8: Push Notification Preferences UI
 */

import { query } from "../_generated/server";

/**
 * Get notification preferences for the current user
 */
export const getMyNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    // Get existing preferences
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    // Return defaults if no preferences exist
    if (!preferences) {
      return {
        userId: user._id,
        enablePush: true,
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
          promotion: false, // Promotions off by default
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return preferences;
  },
});
