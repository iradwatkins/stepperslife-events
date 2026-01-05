"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket, ChevronRight } from "lucide-react";
import { formatEventDateTime } from "@/lib/date-format";

interface ListViewProps {
  events: any[];
}

export function ListView({ events }: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Link
          key={event._id}
          href={`/events/${event._id}`}
          className="block bg-card rounded-lg shadow-sm border border hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Event Image */}
            <div className="relative sm:w-64 h-48 sm:h-auto bg-muted flex-shrink-0">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 256px"
                  className="object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary">
                  <Calendar className="w-12 h-12 text-primary-foreground opacity-50" />
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                    {event.name}
                  </h3>

                  {/* Event Type Badge */}
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                    {event.eventType.replace("_", " ")}
                  </span>
                </div>

                <ChevronRight className="w-6 h-6 text-muted-foreground ml-4 flex-shrink-0" />
              </div>

              {/* Description Preview */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.description}</p>

              {/* Meta Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatEventDateTime(event.startDate, event.timezone)}</span>
                </div>

                {event.location && (event.location.city || event.location.state) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {event.location.venueName && `${event.location.venueName}, `}
                      {event.location.city && event.location.state
                        ? `${event.location.city}, ${event.location.state}`
                        : event.location.city || event.location.state}
                    </span>
                  </div>
                )}

                {event.ticketsVisible && (
                  <div className="flex items-center gap-2 text-sm text-success font-medium">
                    <Ticket className="w-4 h-4" />
                    <span>Tickets Available</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {event.categories && event.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.categories.slice(0, 3).map((category: string) => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs bg-muted text-foreground rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                  {event.categories.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-muted text-foreground rounded-full">
                      +{event.categories.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
