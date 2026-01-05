"use client";

import { Star } from "lucide-react";
import { useState, useRef, useId, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StarInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
  /** ID for aria-describedby linking to error messages */
  "aria-describedby"?: string;
  /** Custom label for the rating group */
  label?: string;
}

const RATING_LABELS = [
  "1 star - Poor",
  "2 stars - Fair",
  "3 stars - Good",
  "4 stars - Very Good",
  "5 stars - Excellent",
];

export function StarInput({
  value,
  onChange,
  size = 24,
  disabled = false,
  className,
  "aria-describedby": ariaDescribedBy,
  label = "Rating",
}: StarInputProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupId = useId();

  // Announce rating changes to screen readers
  const announceRating = useCallback((rating: number) => {
    setAnnouncement(`Selected ${RATING_LABELS[rating - 1]}`);
    // Clear after announcement
    setTimeout(() => setAnnouncement(""), 1000);
  }, []);

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
      announceRating(rating);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (disabled) return;

    const rating = starIndex + 1;
    let newRating = rating;
    let newIndex = starIndex;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onChange(rating);
        announceRating(rating);
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        if (starIndex < 4) {
          newIndex = starIndex + 1;
          newRating = newIndex + 1;
          buttonRefs.current[newIndex]?.focus();
          onChange(newRating);
          announceRating(newRating);
        }
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        if (starIndex > 0) {
          newIndex = starIndex - 1;
          newRating = newIndex + 1;
          buttonRefs.current[newIndex]?.focus();
          onChange(newRating);
          announceRating(newRating);
        }
        break;
      case "Home":
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        onChange(1);
        announceRating(1);
        break;
      case "End":
        e.preventDefault();
        buttonRefs.current[4]?.focus();
        onChange(5);
        announceRating(5);
        break;
    }
  };

  // Touch-friendly minimum size (44x44px for WCAG)
  const touchSize = Math.max(size, 44);
  const iconSize = size;

  return (
    <div className={cn("relative", className)}>
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={ariaDescribedBy}
        className="flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((star, index) => {
          const isFilled = star <= (hoverValue || value);
          const isSelected = star === value;

          return (
            <button
              key={star}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={RATING_LABELS[index]}
              disabled={disabled}
              tabIndex={
                // Only the selected or first star is in tab order (roving tabindex)
                isSelected || (value === 0 && star === 1) ? 0 : -1
              }
              className={cn(
                // Minimum touch target size (44x44px)
                "flex items-center justify-center rounded-md",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                // Respect reduced motion preference
                "motion-safe:transition-transform motion-safe:duration-150",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer motion-safe:hover:scale-110 active:scale-95"
              )}
              style={{
                width: touchSize,
                height: touchSize,
              }}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              onTouchStart={() => !disabled && setHoverValue(star)}
              onTouchEnd={() => {
                setHoverValue(0);
                handleClick(star);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Star
                size={iconSize}
                className={cn(
                  "motion-safe:transition-colors motion-safe:duration-150",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400" // Changed from gray-300 for better contrast (4.5:1)
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* Visual indicator of current selection */}
      {value > 0 && (
        <p className="text-sm text-muted-foreground mt-1 sr-only">
          Current rating: {RATING_LABELS[value - 1]}
        </p>
      )}
    </div>
  );
}
