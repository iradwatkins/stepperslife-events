/**
 * Premium Features Hook
 *
 * Provides access to the current user's premium tier and feature flags.
 * Handles grace periods for expired subscriptions.
 *
 * Story 13.3: Premium Feature Gates
 */

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { TIER_FEATURES, type PremiumTier } from "@/lib/stripe/tiers";

/**
 * Feature flags available based on tier
 */
export interface PremiumFeatureFlags {
  customBranding: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  seatingCharts: boolean;
  apiAccess: boolean;
}

/**
 * Limits based on tier
 */
export interface PremiumLimits {
  maxEventsPerMonth: number | null;
  maxTicketsPerEvent: number | null;
  maxStaffPerEvent: number;
}

/**
 * Premium features state
 */
export interface PremiumFeaturesState {
  tier: PremiumTier;
  tierName: string;
  features: PremiumFeatureFlags;
  limits: PremiumLimits;
  isExpired: boolean;
  inGracePeriod: boolean;
  gracePeriodEnd: number | null;
  daysRemainingInGrace: number | null;
  currentPeriodEnd: number | null;
  isLoading: boolean;
}

/**
 * Grace period duration (7 days in milliseconds)
 */
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hook for accessing premium features and tier information
 *
 * @example
 * ```tsx
 * const { tier, features, limits, isLoading } = usePremiumFeatures();
 *
 * if (features.advancedAnalytics) {
 *   // Show advanced analytics
 * }
 * ```
 */
export function usePremiumFeatures(): PremiumFeaturesState {
  const premiumTier = useQuery(api.users.queries.getMyPremiumTier);

  // Default to free tier while loading
  if (premiumTier === undefined) {
    return {
      tier: "free",
      tierName: "Free",
      features: {
        customBranding: false,
        advancedAnalytics: false,
        prioritySupport: false,
        seatingCharts: false,
        apiAccess: false,
      },
      limits: {
        maxEventsPerMonth: 3,
        maxTicketsPerEvent: 100,
        maxStaffPerEvent: 2,
      },
      isExpired: false,
      inGracePeriod: false,
      gracePeriodEnd: null,
      daysRemainingInGrace: null,
      currentPeriodEnd: null,
      isLoading: true,
    };
  }

  const baseTier = premiumTier?.tier || "free";
  const currentPeriodEnd = premiumTier?.currentPeriodEnd || null;

  // Check if subscription is expired
  const now = Date.now();
  const isExpired = currentPeriodEnd ? now > currentPeriodEnd : false;

  // Calculate grace period
  const gracePeriodEnd = isExpired && currentPeriodEnd
    ? currentPeriodEnd + GRACE_PERIOD_MS
    : null;
  const inGracePeriod = gracePeriodEnd ? now < gracePeriodEnd : false;

  // Calculate days remaining in grace period
  const daysRemainingInGrace = gracePeriodEnd && inGracePeriod
    ? Math.ceil((gracePeriodEnd - now) / (24 * 60 * 60 * 1000))
    : null;

  // Effective tier: revert to free if expired and past grace period
  const effectiveTier: PremiumTier = (isExpired && !inGracePeriod) ? "free" : baseTier;

  // Get features for effective tier
  const tierFeatures = TIER_FEATURES[effectiveTier];

  return {
    tier: effectiveTier,
    tierName: tierFeatures.name,
    features: {
      customBranding: tierFeatures.customBranding,
      advancedAnalytics: tierFeatures.advancedAnalytics,
      prioritySupport: tierFeatures.prioritySupport,
      seatingCharts: tierFeatures.seatingCharts,
      apiAccess: tierFeatures.apiAccess,
    },
    limits: {
      maxEventsPerMonth: tierFeatures.maxEventsPerMonth,
      maxTicketsPerEvent: tierFeatures.maxTicketsPerEvent,
      maxStaffPerEvent: tierFeatures.maxStaffPerEvent,
    },
    isExpired,
    inGracePeriod,
    gracePeriodEnd,
    daysRemainingInGrace,
    currentPeriodEnd,
    isLoading: false,
  };
}

/**
 * Hook for checking if a specific feature is available
 *
 * @example
 * ```tsx
 * const hasAnalytics = usePremiumFeature("advancedAnalytics");
 * ```
 */
export function usePremiumFeature(feature: keyof PremiumFeatureFlags): boolean {
  const { features, isLoading } = usePremiumFeatures();

  if (isLoading) return false;
  return features[feature];
}

/**
 * Hook for checking if the current tier meets a minimum tier requirement
 *
 * @example
 * ```tsx
 * const isPro = useMinimumTier("pro");
 * ```
 */
export function useMinimumTier(minimumTier: PremiumTier): boolean {
  const { tier, isLoading } = usePremiumFeatures();

  if (isLoading) return false;

  const tierOrder: PremiumTier[] = ["free", "starter", "pro", "enterprise"];
  const currentIndex = tierOrder.indexOf(tier);
  const minimumIndex = tierOrder.indexOf(minimumTier);

  return currentIndex >= minimumIndex;
}
