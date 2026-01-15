"use client";

/**
 * Premium Badge Component
 *
 * Displays the user's current premium tier with appropriate styling.
 *
 * Story 13.3: Premium Feature Gates
 */

import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Crown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PremiumTier } from "@/lib/stripe/tiers";

interface PremiumBadgeProps {
  /** Override the tier to display */
  tier?: PremiumTier;
  /** Show the badge even for free tier */
  showFree?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "default" | "lg";
}

/**
 * Badge configuration per tier
 */
const TIER_CONFIG: Record<PremiumTier, {
  label: string;
  icon: typeof Sparkles;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  free: {
    label: "Free",
    icon: Sparkles,
    variant: "secondary",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
  starter: {
    label: "Starter",
    icon: Sparkles,
    variant: "default",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    variant: "default",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    variant: "default",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
  },
};

/**
 * Premium Badge Component
 *
 * @example
 * ```tsx
 * // Auto-detect tier from current user
 * <PremiumBadge />
 *
 * // Override tier
 * <PremiumBadge tier="pro" />
 *
 * // Show free tier badge
 * <PremiumBadge showFree />
 * ```
 */
export function PremiumBadge({
  tier: overrideTier,
  showFree = false,
  className,
  size = "default",
}: PremiumBadgeProps) {
  const { tier: currentTier, inGracePeriod, daysRemainingInGrace, isLoading } = usePremiumFeatures();

  const tier = overrideTier || currentTier;

  // Don't show badge for free tier unless explicitly requested
  if (tier === "free" && !showFree) {
    return null;
  }

  // Loading state
  if (isLoading && !overrideTier) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        Loading...
      </Badge>
    );
  }

  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  // Show grace period warning
  if (inGracePeriod && daysRemainingInGrace !== null) {
    return (
      <Badge
        variant="destructive"
        className={cn(sizeClasses[size], "gap-1", className)}
      >
        <AlertCircle className={iconSizes[size]} />
        <span>{config.label}</span>
        <span className="opacity-75">({daysRemainingInGrace}d left)</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, sizeClasses[size], "gap-1", className)}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Inline premium indicator for use in text
 */
export function PremiumIndicator({ tier }: { tier: PremiumTier }) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (tier === "free") return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium">
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  );
}
