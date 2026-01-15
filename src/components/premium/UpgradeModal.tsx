"use client";

/**
 * Upgrade Modal Component
 *
 * Shows tier comparison and upgrade options.
 *
 * Story 13.3: Premium Feature Gates
 */

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import { usePremiumFeatures, type PremiumFeatureFlags } from "@/hooks/usePremiumFeatures";
import { TIER_FEATURES, type PremiumTier } from "@/lib/stripe/tiers";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  highlightFeature?: keyof PremiumFeatureFlags;
}

/**
 * Tier pricing information
 */
const TIER_PRICING: Record<PremiumTier, { monthly: number; yearly: number } | null> = {
  free: null,
  starter: { monthly: 29, yearly: 290 },
  pro: { monthly: 79, yearly: 790 },
  enterprise: { monthly: 199, yearly: 1990 },
};

/**
 * Tier icons
 */
const TIER_ICONS: Record<PremiumTier, typeof Sparkles> = {
  free: Sparkles,
  starter: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

/**
 * Feature display configuration
 */
const FEATURES_DISPLAY = [
  { key: "customBranding", label: "Custom Branding" },
  { key: "advancedAnalytics", label: "Advanced Analytics" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "seatingCharts", label: "Seating Charts" },
  { key: "apiAccess", label: "API Access" },
] as const;

export function UpgradeModal({ open, onClose, highlightFeature }: UpgradeModalProps) {
  const router = useRouter();
  const { tier: currentTier } = usePremiumFeatures();

  const handleUpgrade = (targetTier: PremiumTier) => {
    onClose();
    router.push(`/pricing?tier=${targetTier}`);
  };

  const tiers: PremiumTier[] = ["starter", "pro", "enterprise"];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Unlock powerful features to grow your events
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {tiers.map((tier) => {
            const features = TIER_FEATURES[tier];
            const pricing = TIER_PRICING[tier];
            const Icon = TIER_ICONS[tier];
            const isCurrentTier = tier === currentTier;
            const isRecommended = tier === "pro";

            return (
              <div
                key={tier}
                className={cn(
                  "relative border rounded-lg p-4",
                  isRecommended && "border-primary border-2",
                  isCurrentTier && "bg-muted/50"
                )}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Recommended
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <Icon className={cn(
                    "h-8 w-8 mx-auto mb-2",
                    tier === "enterprise" ? "text-amber-500" : "text-primary"
                  )} />
                  <h3 className="text-lg font-semibold">{features.name}</h3>
                  {pricing && (
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${pricing.monthly}</span>
                      <span className="text-muted-foreground">/mo</span>
                      <p className="text-xs text-muted-foreground">
                        or ${pricing.yearly}/year (save 17%)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {/* Limits */}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Events/month: </span>
                    <span className="font-medium">
                      {features.maxEventsPerMonth === null
                        ? "Unlimited"
                        : features.maxEventsPerMonth}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tickets/event: </span>
                    <span className="font-medium">
                      {features.maxTicketsPerEvent === null
                        ? "Unlimited"
                        : features.maxTicketsPerEvent}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Staff/event: </span>
                    <span className="font-medium">{features.maxStaffPerEvent}</span>
                  </div>

                  {/* Features */}
                  <div className="border-t pt-2 mt-2">
                    {FEATURES_DISPLAY.map(({ key, label }) => {
                      const hasFeature = features[key as keyof typeof features];
                      const isHighlighted = highlightFeature === key;

                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex items-center gap-2 text-sm py-1",
                            isHighlighted && "bg-primary/10 -mx-2 px-2 rounded"
                          )}
                        >
                          {hasFeature ? (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(!hasFeature && "text-muted-foreground")}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={isCurrentTier ? "outline" : isRecommended ? "default" : "secondary"}
                  disabled={isCurrentTier}
                  onClick={() => handleUpgrade(tier)}
                >
                  {isCurrentTier ? "Current Plan" : `Upgrade to ${features.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
