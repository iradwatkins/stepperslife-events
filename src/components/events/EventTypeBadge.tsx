"use client";

import { cn } from "@/lib/utils";
import { PartyPopper, Moon, Trophy, GraduationCap, Users } from "lucide-react";

export type EventSubType = "weekender" | "set" | "ball" | "workshop" | "social";

interface EventTypeBadgeProps {
  subType: EventSubType | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const EVENT_TYPE_CONFIG: Record<EventSubType, {
  label: string;
  description: string;
  icon: typeof PartyPopper;
  bgColor: string;
  textColor: string;
}> = {
  weekender: {
    label: "Weekender",
    description: "Multi-day event with workshops + parties",
    icon: PartyPopper,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  set: {
    label: "Set",
    description: "Evening dance party",
    icon: Moon,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  ball: {
    label: "Ball",
    description: "Formal competition/showcase",
    icon: Trophy,
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  workshop: {
    label: "Workshop",
    description: "Learning focused",
    icon: GraduationCap,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
  },
  social: {
    label: "Social",
    description: "Casual practice",
    icon: Users,
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    textColor: "text-rose-700 dark:text-rose-300",
  },
};

export function EventTypeBadge({
  subType,
  size = "md",
  showLabel = true,
  className
}: EventTypeBadgeProps) {
  if (!subType || !EVENT_TYPE_CONFIG[subType]) {
    return null;
  }

  const config = EVENT_TYPE_CONFIG[subType];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Export config for use in forms
export { EVENT_TYPE_CONFIG };
