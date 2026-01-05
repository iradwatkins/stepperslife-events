"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassRatingProps {
  rating: number;
  totalReviews?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}

export function ClassRating({
  rating,
  totalReviews = 0,
  size = 16,
  showCount = true,
  className,
}: ClassRatingProps) {
  // Round to nearest 0.5 for half-star display
  const roundedRating = Math.round(rating * 2) / 2;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(roundedRating);
          const isHalf = !isFilled && star === Math.ceil(roundedRating) && roundedRating % 1 !== 0;

          return (
            <span key={star} className="relative">
              {/* Background star (gray) */}
              <Star
                size={size}
                className="text-gray-300"
              />
              {/* Filled star (yellow) - full or half */}
              {(isFilled || isHalf) && (
                <Star
                  size={size}
                  className={cn(
                    "absolute top-0 left-0 fill-yellow-400 text-yellow-400",
                    isHalf && "clip-half"
                  )}
                  style={isHalf ? { clipPath: "inset(0 50% 0 0)" } : undefined}
                />
              )}
            </span>
          );
        })}
      </div>
      {showCount && totalReviews > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          ({totalReviews})
        </span>
      )}
      {showCount && totalReviews === 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          No reviews
        </span>
      )}
    </div>
  );
}

// Compact version for class cards
export function ClassRatingCompact({
  rating,
  totalReviews = 0,
  className,
}: {
  rating: number;
  totalReviews?: number;
  className?: string;
}) {
  if (totalReviews === 0) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        No reviews yet
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star size={14} className="fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({totalReviews})</span>
    </div>
  );
}
