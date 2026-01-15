"use client";

/**
 * Feature Gate Component
 *
 * Wraps premium features and shows upgrade prompts for users
 * who don't have access to the feature.
 *
 * Story 13.3: Premium Feature Gates
 */

import { useState } from "react";
import { usePremiumFeatures, type PremiumFeatureFlags } from "@/hooks/usePremiumFeatures";
import { UpgradeModal } from "./UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";

interface FeatureGateProps {
  /** The feature to check access for */
  feature: keyof PremiumFeatureFlags;
  /** Content to show when user has access */
  children: React.ReactNode;
  /** Optional custom fallback when user doesn't have access */
  fallback?: React.ReactNode;
  /** Title for the locked state */
  title?: string;
  /** Description for the locked state */
  description?: string;
  /** Whether to show a minimal locked indicator (just an icon) */
  minimal?: boolean;
}

/**
 * Feature names for display
 */
const FEATURE_NAMES: Record<keyof PremiumFeatureFlags, string> = {
  customBranding: "Custom Branding",
  advancedAnalytics: "Advanced Analytics",
  prioritySupport: "Priority Support",
  seatingCharts: "Seating Charts",
  apiAccess: "API Access",
};

/**
 * Minimum tier required for each feature
 */
const FEATURE_MIN_TIER: Record<keyof PremiumFeatureFlags, string> = {
  customBranding: "Starter",
  advancedAnalytics: "Pro",
  prioritySupport: "Pro",
  seatingCharts: "Pro",
  apiAccess: "Enterprise",
};

/**
 * Feature Gate Component
 *
 * @example
 * ```tsx
 * <FeatureGate feature="advancedAnalytics" title="Advanced Analytics">
 *   <AnalyticsDashboard />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  title,
  description,
  minimal = false,
}: FeatureGateProps) {
  const { features, isLoading, tier } = usePremiumFeatures();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User has access - show children
  if (features[feature]) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback or locked state
  if (fallback) {
    return <>{fallback}</>;
  }

  // Minimal locked indicator
  if (minimal) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setShowUpgrade(true)}
      >
        <Lock className="h-4 w-4 mr-1" />
        <span className="text-xs">{FEATURE_MIN_TIER[feature]}+</span>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          highlightFeature={feature}
        />
      </Button>
    );
  }

  // Default locked state
  return (
    <>
      <Card className="border-dashed border-2 bg-muted/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">
            {title || FEATURE_NAMES[feature]}
          </CardTitle>
          <CardDescription>
            {description ||
              `This feature is available on ${FEATURE_MIN_TIER[feature]} tier and above.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;re currently on the <strong>{tier}</strong> tier.
          </p>
          <Button onClick={() => setShowUpgrade(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Unlock
          </Button>
        </CardContent>
      </Card>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        highlightFeature={feature}
      />
    </>
  );
}

/**
 * Simple hook wrapper for conditional rendering
 *
 * @example
 * ```tsx
 * const { hasAccess, showUpgrade, UpgradePrompt } = useFeatureGate("advancedAnalytics");
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function useFeatureGate(feature: keyof PremiumFeatureFlags) {
  const { features, tier } = usePremiumFeatures();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const hasAccess = features[feature];

  const UpgradePrompt = () => (
    <>
      <Button variant="outline" onClick={() => setShowUpgrade(true)}>
        <Lock className="h-4 w-4 mr-2" />
        Upgrade to Unlock
      </Button>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        highlightFeature={feature}
      />
    </>
  );

  return {
    hasAccess,
    tier,
    showUpgrade: () => setShowUpgrade(true),
    UpgradePrompt,
  };
}
