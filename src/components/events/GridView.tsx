"use client";

import { EventCard } from "./EventCard";
import { EventCardProps } from "@/lib/types/events";

interface GridViewProps {
  events: EventCardProps[];
}

export function GridView({ events }: GridViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No events found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}
