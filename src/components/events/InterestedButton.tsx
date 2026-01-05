"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface InterestedButtonProps {
  eventId: Id<"events">;
  variant?: "card" | "detail";
  className?: string;
}

export function InterestedButton({
  eventId,
  variant = "card",
  className,
}: InterestedButtonProps) {
  const { user, isAuthenticated } = useAuth();
  // The user._id from useAuth is a string, cast it to Convex Id type for queries
  const userId = user?._id as unknown as Id<"users"> | undefined;

  // Queries
  const isInterested = useQuery(
    api.events.social.isUserInterested,
    userId ? { eventId, userId } : "skip"
  );
  const interestCount = useQuery(api.events.social.getInterestCount, {
    eventId,
  });

  // Mutation
  const toggleInterest = useMutation(api.events.social.toggleInterest);

  // Optimistic UI state
  const [optimisticInterested, setOptimisticInterested] = useState<
    boolean | null
  >(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  // Computed values (use optimistic if available)
  const displayInterested = optimisticInterested ?? isInterested ?? false;
  const displayCount = optimisticCount ?? interestCount ?? 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !userId) {
      // Could redirect to login here
      return;
    }

    // Optimistic update
    const newInterested = !displayInterested;
    setOptimisticInterested(newInterested);
    setOptimisticCount(displayCount + (newInterested ? 1 : -1));

    try {
      await toggleInterest({ eventId, userId });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticInterested(null);
      setOptimisticCount(null);
      console.error("Failed to toggle interest:", error);
    }
  };

  // After mutation completes, sync with real data
  if (
    optimisticInterested !== null &&
    isInterested !== undefined &&
    optimisticInterested === isInterested
  ) {
    setOptimisticInterested(null);
    setOptimisticCount(null);
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
          displayInterested
            ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            : "bg-muted/80 text-muted-foreground hover:bg-muted",
          className
        )}
        title={isAuthenticated ? "Toggle interest" : "Sign in to show interest"}
      >
        <Heart
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            displayInterested && "fill-current scale-110"
          )}
        />
        <span>{displayCount > 0 ? displayCount : "Interested"}</span>
      </button>
    );
  }

  // Detail page variant - larger button
  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
        displayInterested
          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border",
        className
      )}
      title={isAuthenticated ? "Toggle interest" : "Sign in to show interest"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-transform duration-200",
          displayInterested && "fill-current scale-110"
        )}
      />
      <span>
        {displayInterested ? "Interested" : "Mark Interested"}
        {displayCount > 0 && ` (${displayCount})`}
      </span>
    </button>
  );
}
