"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket, Clock, Shirt } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-format";
import { SocialProof } from "./SocialProof";
import { InterestedButton } from "./InterestedButton";
import { EventTypeBadge, type EventSubType } from "./EventTypeBadge";
import { BeginnerBadge } from "./BeginnerBadge";
import { type DressCode } from "./DressCodeBadge";
import { Id } from "../../../convex/_generated/dataModel";

interface EventCardProps {
  event: {
    _id: string;
    name: string;
    description: string;
    startDate?: number;
    timezone?: string;
    location?: {
      city?: string;
      state?: string;
      venueName?: string;
    } | string;
    images?: string[];
    imageUrl?: string;
    eventType?: string;
    categories?: string[];
    ticketsVisible?: boolean;
    organizerName?: string;
    isClaimable?: boolean;
    // Culture-specific fields
    eventSubType?: EventSubType | null;
    dressCode?: DressCode | null;
    beginnerFriendly?: boolean | null;
    hasBeginnerLesson?: boolean | null;
  };
  showSocialProof?: boolean;
}

export function EventCard({ event, showSocialProof = true }: EventCardProps) {
  // Use imageUrl from event, fallback to Unsplash random images
  const imageUrl =
    event.imageUrl ||
    (event.images && event.images[0]) ||
    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`;

  const eventId = event._id as Id<"events">;

  return (
    <Link href={`/events/${event._id}`} className="group block cursor-pointer">
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-card cursor-pointer">
        {/* Event Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
          />

          {/* Event Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {/* Event Sub-Type Badge (Stepping-specific) */}
            {event.eventSubType ? (
              <EventTypeBadge subType={event.eventSubType} size="sm" />
            ) : event.eventType ? (
              <span className="px-3 py-1 text-xs font-semibold bg-card/90 backdrop-blur-sm rounded-full shadow-sm">
                {event.eventType.replace("_", " ")}
              </span>
            ) : null}

            {/* Beginner Friendly Badge */}
            {event.beginnerFriendly && (
              <BeginnerBadge
                beginnerFriendly={event.beginnerFriendly}
                hasLesson={event.hasBeginnerLesson}
                size="sm"
                variant="badge"
              />
            )}
          </div>

          {/* Interested Button - Top Right */}
          {showSocialProof && (
            <div className="absolute top-3 right-3">
              <InterestedButton eventId={eventId} variant="card" />
            </div>
          )}

          {/* Tickets Available Badge - Bottom Right */}
          {event.ticketsVisible && (
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-success text-success-foreground text-xs font-semibold rounded-full shadow-sm">
                <Ticket className="w-3 h-3" />
                <span>Available</span>
              </div>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="p-4 space-y-2">
          {/* Event Name */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.name}
          </h3>

          {/* Date & Time - Always in EVENT's timezone */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatEventDate(event.startDate, event.timezone)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatEventTime(event.startDate, event.timezone)}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {typeof event.location === "string"
                  ? event.location
                  : event.location.city && event.location.state
                    ? `${event.location.city}, ${event.location.state}`
                    : event.location.city || event.location.state || ""}
              </span>
            </div>
          )}

          {/* Categories & Dress Code Row */}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {/* Dress Code Indicator */}
            {event.dressCode && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted text-foreground rounded-full"
                title={`Dress Code: ${event.dressCode.replace("_", " ")}`}
              >
                <Shirt className="w-3 h-3" />
                <span className="capitalize">{event.dressCode.replace("_", " ")}</span>
              </span>
            )}

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <>
                {event.categories.slice(0, event.dressCode ? 1 : 2).map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 text-xs bg-muted text-foreground rounded-full"
                  >
                    {category}
                  </span>
                ))}
                {event.categories.length > (event.dressCode ? 1 : 2) && (
                  <span className="px-2 py-1 text-xs bg-muted text-foreground rounded-full">
                    +{event.categories.length - (event.dressCode ? 1 : 2)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Social Proof - Going count & Urgency */}
          {showSocialProof && (
            <SocialProof eventId={eventId} variant="card" className="mt-2 pt-2 border-t border-border" />
          )}
        </div>
      </div>
    </Link>
  );
}
