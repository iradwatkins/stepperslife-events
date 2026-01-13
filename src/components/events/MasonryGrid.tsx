"use client";

import { MasonryEventCard } from "./MasonryEventCard";
import { EventCardProps } from "@/lib/types/events";

interface MasonryGridProps {
  events: EventCardProps[];
}

export function MasonryGrid({ events }: MasonryGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No events found</p>
        <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  // PERFORMANCE FIX: Single responsive masonry grid instead of 3 separate renders
  // Previous implementation rendered events 3x (desktop, tablet, mobile)
  // This reduces component renders by 66% and improves paint performance
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-3 sm:gap-4">
      {events.map((event) => (
        <div key={event._id} className="break-inside-avoid mb-3 sm:mb-4">
          <MasonryEventCard event={event} />
        </div>
      ))}
    </div>
  );
}
