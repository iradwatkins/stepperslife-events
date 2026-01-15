/**
 * Premium Feature Server-Side Validation
 *
 * Provides server-side checks for premium feature access.
 * Used to validate feature access in mutations and actions.
 *
 * Story 13.3: Premium Feature Gates
 */

import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

/**
 * Premium tier type
 */
type PremiumTier = "free" | "starter" | "pro" | "enterprise";

/**
 * Feature access by tier
 */
const TIER_FEATURES: Record<PremiumTier, Record<string, boolean>> = {
  free: {
    customBranding: false,
    advancedAnalytics: false,
    prioritySupport: false,
    seatingCharts: false,
    apiAccess: false,
  },
  starter: {
    customBranding: true,
    advancedAnalytics: false,
    prioritySupport: false,
    seatingCharts: false,
    apiAccess: false,
  },
  pro: {
    customBranding: true,
    advancedAnalytics: true,
    prioritySupport: true,
    seatingCharts: true,
    apiAccess: false,
  },
  enterprise: {
    customBranding: true,
    advancedAnalytics: true,
    prioritySupport: true,
    seatingCharts: true,
    apiAccess: true,
  },
};

/**
 * Tier limits
 */
const TIER_LIMITS: Record<PremiumTier, {
  maxEventsPerMonth: number | null;
  maxTicketsPerEvent: number | null;
  maxStaffPerEvent: number;
}> = {
  free: {
    maxEventsPerMonth: 3,
    maxTicketsPerEvent: 100,
    maxStaffPerEvent: 2,
  },
  starter: {
    maxEventsPerMonth: 10,
    maxTicketsPerEvent: 500,
    maxStaffPerEvent: 5,
  },
  pro: {
    maxEventsPerMonth: 50,
    maxTicketsPerEvent: 2000,
    maxStaffPerEvent: 15,
  },
  enterprise: {
    maxEventsPerMonth: null,
    maxTicketsPerEvent: null,
    maxStaffPerEvent: 50,
  },
};

/**
 * Grace period duration (7 days in milliseconds)
 */
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get effective tier accounting for expiration and grace period
 */
function getEffectiveTier(user: Doc<"users">): PremiumTier {
  const baseTier = user.premiumTier?.tier || "free";
  const currentPeriodEnd = user.premiumTier?.currentPeriodEnd;

  if (!currentPeriodEnd) return baseTier;

  const now = Date.now();
  const isExpired = now > currentPeriodEnd;
  const gracePeriodEnd = currentPeriodEnd + GRACE_PERIOD_MS;
  const inGracePeriod = isExpired && now < gracePeriodEnd;

  // Revert to free if expired and past grace period
  if (isExpired && !inGracePeriod) {
    return "free";
  }

  return baseTier;
}

/**
 * Check if a user has access to a specific feature
 *
 * @example
 * ```ts
 * const access = await ctx.runQuery(api.users.premiumFeatures.checkFeatureAccess, {
 *   feature: "advancedAnalytics"
 * });
 * if (!access.allowed) throw new Error(access.reason);
 * ```
 */
export const checkFeatureAccess = query({
  args: {
    feature: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        allowed: false,
        reason: "unauthenticated",
        tier: "free" as PremiumTier,
      };
    }

    // Parse identity to get email
    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      return {
        allowed: false,
        reason: "email_not_found",
        tier: "free" as PremiumTier,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return {
        allowed: false,
        reason: "user_not_found",
        tier: "free" as PremiumTier,
      };
    }

    const effectiveTier = getEffectiveTier(user);
    const featureAccess = TIER_FEATURES[effectiveTier];
    const hasFeature = featureAccess[args.feature] || false;

    return {
      allowed: hasFeature,
      reason: hasFeature ? "allowed" : "tier_insufficient",
      tier: effectiveTier,
      requiredTier: getMinimumTierForFeature(args.feature),
    };
  },
});

/**
 * Check if a user is within their event creation limit
 */
export const checkEventLimit = query({
  args: {
    organizerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "unauthenticated", remaining: 0, limit: 0 };
    }

    // Parse identity to get email
    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      return { allowed: false, reason: "email_not_found", remaining: 0, limit: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return { allowed: false, reason: "user_not_found", remaining: 0, limit: 0 };
    }

    // If organizerId provided, verify it matches or user is admin
    if (args.organizerId && args.organizerId !== user._id && user.role !== "admin") {
      return { allowed: false, reason: "unauthorized", remaining: 0, limit: 0 };
    }

    const effectiveTier = getEffectiveTier(user);
    const limits = TIER_LIMITS[effectiveTier];

    // Unlimited events for pro/enterprise
    if (limits.maxEventsPerMonth === null) {
      return { allowed: true, reason: "unlimited", remaining: Infinity, limit: null };
    }

    // Count events created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const eventsThisMonth = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startOfMonth),
          q.neq(q.field("status"), "deleted")
        )
      )
      .collect();

    const count = eventsThisMonth.length;
    const remaining = Math.max(0, limits.maxEventsPerMonth - count);

    return {
      allowed: remaining > 0,
      reason: remaining > 0 ? "allowed" : "limit_reached",
      remaining,
      limit: limits.maxEventsPerMonth,
      used: count,
    };
  },
});

/**
 * Check if a user is within their staff limit for an event
 */
export const checkStaffLimit = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { allowed: false, reason: "event_not_found", remaining: 0, limit: 0 };
    }

    if (!event.organizerId) {
      return { allowed: false, reason: "organizer_not_found", remaining: 0, limit: 0 };
    }

    const organizer = await ctx.db.get(event.organizerId);
    if (!organizer) {
      return { allowed: false, reason: "organizer_not_found", remaining: 0, limit: 0 };
    }

    const effectiveTier = getEffectiveTier(organizer as Doc<"users">);
    const limits = TIER_LIMITS[effectiveTier];

    // Count active staff for this event
    const activeStaff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const count = activeStaff.length;
    const remaining = Math.max(0, limits.maxStaffPerEvent - count);

    return {
      allowed: remaining > 0,
      reason: remaining > 0 ? "allowed" : "limit_reached",
      remaining,
      limit: limits.maxStaffPerEvent,
      used: count,
    };
  },
});

/**
 * Get the minimum tier required for a feature
 */
function getMinimumTierForFeature(feature: string): PremiumTier {
  const tiers: PremiumTier[] = ["free", "starter", "pro", "enterprise"];

  for (const tier of tiers) {
    if (TIER_FEATURES[tier][feature]) {
      return tier;
    }
  }

  return "enterprise"; // Default to highest tier if not found
}

/**
 * Get full premium status for current user
 */
export const getMyPremiumStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Parse identity to get email
    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return null;
    }

    const effectiveTier = getEffectiveTier(user);
    const baseTier = user.premiumTier?.tier || "free";
    const currentPeriodEnd = user.premiumTier?.currentPeriodEnd;
    const now = Date.now();
    const isExpired = currentPeriodEnd ? now > currentPeriodEnd : false;
    const gracePeriodEnd = currentPeriodEnd ? currentPeriodEnd + GRACE_PERIOD_MS : null;
    const inGracePeriod = gracePeriodEnd ? isExpired && now < gracePeriodEnd : false;

    return {
      baseTier,
      effectiveTier,
      features: TIER_FEATURES[effectiveTier],
      limits: TIER_LIMITS[effectiveTier],
      subscription: {
        stripeSubscriptionId: user.premiumTier?.stripeSubscriptionId,
        stripeCustomerId: user.premiumTier?.stripeCustomerId,
        currentPeriodEnd,
        isExpired,
        inGracePeriod,
        gracePeriodEnd,
      },
    };
  },
});
