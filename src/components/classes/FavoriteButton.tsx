"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FavoriteButtonProps {
  eventId: Id<"events">;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function FavoriteButton({
  eventId,
  className,
  size = "md",
  showCount = false,
}: FavoriteButtonProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isToggling, setIsToggling] = useState(false);

  // Get favorite status for this event
  const isFavorited = useQuery(
    api.favoriteEvents.isMyFavorite,
    { eventId }
  );

  // Get favorite count if needed
  const favoriteCount = useQuery(
    api.favoriteEvents.getEventFavoriteCount,
    showCount ? { eventId } : "skip"
  );

  // Toggle mutation
  const toggleFavorite = useMutation(api.favoriteEvents.toggle);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if user is authenticated
      if (!user && !authLoading) {
        toast.error("Please sign in to save classes to your favorites");
        return;
      }

      if (isToggling) return;

      setIsToggling(true);
      try {
        const result = await toggleFavorite({ eventId });
        if (result.action === "added") {
          toast.success("Added to favorites");
        } else {
          toast.success("Removed from favorites");
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.error("Failed to update favorites. Please try again.");
      } finally {
        setIsToggling(false);
      }
    },
    [user, authLoading, isToggling, toggleFavorite, eventId]
  );

  const sizeClasses = {
    sm: "w-7 h-7 p-1.5",
    md: "w-9 h-9 p-2",
    lg: "w-11 h-11 p-2.5",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling || authLoading}
      className={cn(
        "rounded-full transition-all duration-200",
        "bg-white/90 hover:bg-white shadow-sm hover:shadow",
        "flex items-center justify-center gap-1",
        "focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorited}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-all duration-200",
          isFavorited
            ? "fill-red-500 text-red-500"
            : "fill-transparent text-gray-500 hover:text-red-400"
        )}
      />
      {showCount && favoriteCount !== undefined && favoriteCount > 0 && (
        <span className="text-xs font-medium text-gray-600">
          {favoriteCount}
        </span>
      )}
    </button>
  );
}
