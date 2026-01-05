"use client";

import { cn } from "@/lib/utils";
import { Shirt, Sparkles } from "lucide-react";

export type DressCode = "all_white" | "black_tie" | "stepping_attire" | "casual" | "theme";

interface DressCodeBadgeProps {
  dressCode: DressCode | null | undefined;
  details?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const DRESS_CODE_CONFIG: Record<DressCode, {
  label: string;
  shortLabel: string;
  icon: string;
  bgColor: string;
  textColor: string;
}> = {
  all_white: {
    label: "All White",
    shortLabel: "White",
    icon: "👔",
    bgColor: "bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    textColor: "text-gray-800 dark:text-gray-200",
  },
  black_tie: {
    label: "Black Tie",
    shortLabel: "Formal",
    icon: "🎩",
    bgColor: "bg-gray-900 dark:bg-black",
    textColor: "text-white",
  },
  stepping_attire: {
    label: "Stepping Attire",
    shortLabel: "Steppin'",
    icon: "✨",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    textColor: "text-indigo-700 dark:text-indigo-300",
  },
  casual: {
    label: "Casual",
    shortLabel: "Casual",
    icon: "👟",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-700 dark:text-slate-300",
  },
  theme: {
    label: "Theme",
    shortLabel: "Theme",
    icon: "🎭",
    bgColor: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    textColor: "text-fuchsia-700 dark:text-fuchsia-300",
  },
};

export function DressCodeBadge({
  dressCode,
  details,
  size = "md",
  showLabel = true,
  className
}: DressCodeBadgeProps) {
  if (!dressCode || !DRESS_CODE_CONFIG[dressCode]) {
    return null;
  }

  const config = DRESS_CODE_CONFIG[dressCode];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const displayLabel = dressCode === "theme" && details
    ? details.slice(0, 20) + (details.length > 20 ? "..." : "")
    : config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
      title={dressCode === "theme" && details ? details : config.label}
    >
      <span className="text-sm">{config.icon}</span>
      {showLabel && <span>{displayLabel}</span>}
    </span>
  );
}

// Compact icon-only version for EventCard
export function DressCodeIcon({
  dressCode,
  details,
  className
}: {
  dressCode: DressCode | null | undefined;
  details?: string | null;
  className?: string;
}) {
  if (!dressCode || !DRESS_CODE_CONFIG[dressCode]) {
    return null;
  }

  const config = DRESS_CODE_CONFIG[dressCode];

  return (
    <span
      className={cn("inline-flex items-center", className)}
      title={`Dress Code: ${dressCode === "theme" && details ? details : config.label}`}
    >
      <Shirt className="w-4 h-4 text-muted-foreground" />
    </span>
  );
}

// Export config for use in forms
export { DRESS_CODE_CONFIG };
