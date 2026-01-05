"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Ticket } from "lucide-react";
import { formatEventDate } from "@/lib/date-format";

interface MasonryEventCardProps {
  event: {
    _id: string;
    name: string;
    startDate?: number;
    timezone?: string;
    imageUrl?: string;
    images: string[];
    eventType: string;
    ticketsVisible?: boolean;
    organizerName?: string;
    isClaimable?: boolean;
  };
}

export function MasonryEventCard({ event }: MasonryEventCardProps) {
  // Use imageUrl from event, fallback to Unsplash random images
  const imageUrl =
    event.imageUrl ||
    (event.images && event.images[0]) ||
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`;

  return (
    <Link href={`/events/${event._id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-card">
        {/* Full Event Image - shows whole picture without cropping */}
        <div className="relative w-full">
          <Image
            src={imageUrl}
            alt={event.name}
            width={400}
            height={600}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] rounded-t-xl"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
          />

          {/* Subtle gradient overlay at top for badge visibility */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

          {/* Event Type Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 text-xs font-semibold bg-card/90 backdrop-blur-sm rounded-full shadow-sm">
              {event.eventType.replace("_", " ")}
            </span>
          </div>

          {/* Tickets Available Badge - Top Right */}
          {event.ticketsVisible && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-success text-success-foreground text-xs font-semibold rounded-full shadow-sm">
                <Ticket className="w-3 h-3" />
                <span>Available</span>
              </div>
            </div>
          )}
        </div>

        {/* Event Info Footer */}
        <div className="p-3 bg-card border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {formatEventDate(event.startDate, event.timezone)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
