/**
 * Premium Tier Configuration
 * Maps Stripe price IDs to platform tier levels
 *
 * Story 13.2: Premium Tier Webhook Handler
 */

export type PremiumTier = "free" | "starter" | "pro" | "enterprise";

/**
 * Stripe Price ID to Tier Mapping
 *
 * Note: Replace these placeholder price IDs with actual Stripe price IDs
 * from your Stripe Dashboard when you create the subscription products.
 *
 * Format: price_[tier]_[billing_period]
 */
export const PRICE_TO_TIER: Record<string, PremiumTier> = {
  // Starter Tier ($29/mo or $290/yr)
  "price_starter_monthly": "starter",
  "price_starter_yearly": "starter",

  // Pro Tier ($79/mo or $790/yr)
  "price_pro_monthly": "pro",
  "price_pro_yearly": "pro",

  // Enterprise Tier ($199/mo or $1990/yr)
  "price_enterprise_monthly": "enterprise",
  "price_enterprise_yearly": "enterprise",
};

/**
 * Map a Stripe price ID to a platform tier
 * Returns "free" if the price ID is not found
 */
export function mapPriceToTier(priceId: string | undefined | null): PremiumTier {
  if (!priceId) return "free";
  return PRICE_TO_TIER[priceId] || "free";
}

/**
 * Tier feature limits and capabilities
 */
export const TIER_FEATURES: Record<PremiumTier, {
  name: string;
  maxEventsPerMonth: number | null; // null = unlimited
  maxTicketsPerEvent: number | null;
  maxStaffPerEvent: number;
  customBranding: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  seatingCharts: boolean;
  apiAccess: boolean;
}> = {
  free: {
    name: "Free",
    maxEventsPerMonth: 3,
    maxTicketsPerEvent: 100,
    maxStaffPerEvent: 2,
    customBranding: false,
    prioritySupport: false,
    advancedAnalytics: false,
    seatingCharts: false,
    apiAccess: false,
  },
  starter: {
    name: "Starter",
    maxEventsPerMonth: 10,
    maxTicketsPerEvent: 500,
    maxStaffPerEvent: 5,
    customBranding: true,
    prioritySupport: false,
    advancedAnalytics: false,
    seatingCharts: false,
    apiAccess: false,
  },
  pro: {
    name: "Pro",
    maxEventsPerMonth: 50,
    maxTicketsPerEvent: 2000,
    maxStaffPerEvent: 15,
    customBranding: true,
    prioritySupport: true,
    advancedAnalytics: true,
    seatingCharts: true,
    apiAccess: false,
  },
  enterprise: {
    name: "Enterprise",
    maxEventsPerMonth: null, // Unlimited
    maxTicketsPerEvent: null, // Unlimited
    maxStaffPerEvent: 50,
    customBranding: true,
    prioritySupport: true,
    advancedAnalytics: true,
    seatingCharts: true,
    apiAccess: true,
  },
};

/**
 * Check if a tier has access to a specific feature
 */
export function tierHasFeature(
  tier: PremiumTier,
  feature: keyof typeof TIER_FEATURES.free
): boolean {
  const tierFeatures = TIER_FEATURES[tier];
  const value = tierFeatures[feature];

  // For boolean features, return directly
  if (typeof value === "boolean") return value;

  // For numeric limits, return true if limit exists (not null = limited, null = unlimited)
  return true;
}

/**
 * Get the tier limit for a specific resource
 */
export function getTierLimit(
  tier: PremiumTier,
  resource: "maxEventsPerMonth" | "maxTicketsPerEvent" | "maxStaffPerEvent"
): number | null {
  return TIER_FEATURES[tier][resource];
}
