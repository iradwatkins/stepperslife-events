"use client";

import { cn } from "@/lib/utils";

interface EventCardSkeletonProps {
  className?: string;
}

export function EventCardSkeleton({ className }: EventCardSkeletonProps) {
  return (
    <div className={cn("block", className)}>
      <div className="relative overflow-hidden rounded-lg shadow-md bg-card">
        {/* Event Image Skeleton */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted animate-pulse">
          {/* Event Type Badge Skeleton */}
          <div className="absolute top-3 left-3">
            <div className="w-20 h-6 bg-card/70 rounded-full" />
          </div>
          {/* Interested Button Skeleton */}
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 bg-card/70 rounded-full" />
          </div>
        </div>

        {/* Event Info Skeleton */}
        <div className="p-4 space-y-3">
          {/* Event Name */}
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />

          {/* Date */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          </div>

          {/* Categories */}
          <div className="flex gap-1 mt-2">
            <div className="w-16 h-5 bg-muted animate-pulse rounded-full" />
            <div className="w-20 h-5 bg-muted animate-pulse rounded-full" />
          </div>

          {/* Social Proof */}
          <div className="pt-2 border-t border-border mt-2">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface EventSkeletonGridProps {
  count?: number;
  viewMode?: "masonry" | "list" | "grid";
}

export function EventSkeletonGrid({ count = 12, viewMode = "masonry" }: EventSkeletonGridProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-card rounded-lg shadow-md">
            {/* Image */}
            <div className="w-32 h-32 bg-muted animate-pulse rounded-lg flex-shrink-0" />
            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
              <div className="flex gap-2 mt-2">
                <div className="w-16 h-5 bg-muted animate-pulse rounded-full" />
                <div className="w-20 h-5 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {skeletons.map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
