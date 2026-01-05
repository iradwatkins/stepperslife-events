"use client";

import { Flame, Zap, Ticket, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export type UrgencyLevel =
  | "none"
  | "selling_fast"
  | "limited"
  | "almost_sold_out"
  | "last_few";

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  message?: string;
  className?: string;
  compact?: boolean;
}

const urgencyConfig: Record<
  UrgencyLevel,
  {
    icon: typeof Flame;
    colors: string;
    pulse?: boolean;
  }
> = {
  none: {
    icon: Ticket,
    colors: "bg-muted text-muted-foreground",
  },
  selling_fast: {
    icon: Flame,
    colors: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  limited: {
    icon: Ticket,
    colors: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  almost_sold_out: {
    icon: Zap,
    colors: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  last_few: {
    icon: Timer,
    colors: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    pulse: true,
  },
};

export function UrgencyBadge({
  level,
  message,
  className,
  compact = false,
}: UrgencyBadgeProps) {
  if (level === "none" && !message) return null;

  const config = urgencyConfig[level];
  const Icon = config.icon;
  const displayMessage = message || getDefaultMessage(level);

  if (!displayMessage) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.colors,
        config.pulse && "animate-pulse",
        className
      )}
    >
      <Icon className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
      <span>{displayMessage}</span>
    </div>
  );
}

function getDefaultMessage(level: UrgencyLevel): string {
  switch (level) {
    case "selling_fast":
      return "Selling Fast!";
    case "limited":
      return "Limited Tickets";
    case "almost_sold_out":
      return "Almost Sold Out!";
    case "last_few":
      return "Last Few Spots!";
    default:
      return "";
  }
}
