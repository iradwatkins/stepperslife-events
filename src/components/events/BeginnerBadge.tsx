"use client";

import { cn } from "@/lib/utils";
import { Star, GraduationCap, Clock } from "lucide-react";

interface BeginnerBadgeProps {
  beginnerFriendly?: boolean | null;
  hasLesson?: boolean | null;
  lessonTime?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "card" | "detail";
  className?: string;
}

export function BeginnerBadge({
  beginnerFriendly,
  hasLesson,
  lessonTime,
  size = "md",
  variant = "badge",
  className
}: BeginnerBadgeProps) {
  if (!beginnerFriendly) {
    return null;
  }

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

  // Compact badge for cards
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          "bg-emerald-100 dark:bg-emerald-900/30",
          "text-emerald-700 dark:text-emerald-300",
          sizeClasses[size],
          className
        )}
        title={hasLesson && lessonTime ? `Beginner Lesson: ${lessonTime}` : "Beginner Friendly"}
      >
        <Star className={cn(iconSizes[size], "fill-current")} />
        <span>Beginner Friendly</span>
      </span>
    );
  }

  // Card variant - shows more info
  if (variant === "card") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          "bg-emerald-100 dark:bg-emerald-900/30",
          "text-emerald-700 dark:text-emerald-300",
          className
        )}
      >
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>Beginner Friendly</span>
        {hasLesson && (
          <>
            <span className="text-emerald-500">•</span>
            <GraduationCap className="w-3 h-3" />
            <span>Lesson</span>
          </>
        )}
      </div>
    );
  }

  // Detail variant - shows full info including lesson time
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <Star className="w-4 h-4 fill-current" />
          <span>Beginner Friendly</span>
        </span>
      </div>

      {hasLesson && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              Free Beginner Lesson
            </p>
            {lessonTime && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{lessonTime}</span>
              </div>
            )}
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
              New to stepping? Join us early for a free lesson before the main event!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
