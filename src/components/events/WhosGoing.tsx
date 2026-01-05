"use client";

import { Users, Share2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhosGoingProps {
  eventId: Id<"events">;
  eventName?: string;
  className?: string;
  onInviteFriends?: () => void;
}

export function WhosGoing({
  eventId,
  eventName,
  className,
  onInviteFriends,
}: WhosGoingProps) {
  const attendeePreview = useQuery(api.events.social.getAttendeePreview, {
    eventId,
    limit: 8,
  });

  if (!attendeePreview) {
    // Loading state
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const { attendees, totalCount, hasMore } = attendeePreview;

  if (totalCount === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who&apos;s Going
        </h3>
        <p className="text-muted-foreground text-sm">
          Be the first to get tickets for this event!
        </p>
        {onInviteFriends && (
          <Button variant="outline" size="sm" onClick={onInviteFriends}>
            <Share2 className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        )}
      </div>
    );
  }

  const remainingCount = totalCount - attendees.length;

  const handleShare = () => {
    if (onInviteFriends) {
      onInviteFriends();
      return;
    }

    // Default share behavior
    if (navigator.share) {
      navigator.share({
        title: eventName || "Check out this event!",
        text: `${totalCount} people are going to this event. Join them!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" />
        Who&apos;s Going ({totalCount})
      </h3>

      <div className="flex items-center gap-1">
        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {attendees.map((attendee) => (
            <Avatar
              key={attendee.id}
              className="w-10 h-10 border-2 border-background ring-1 ring-border"
            >
              <AvatarImage src={attendee.image || undefined} alt={attendee.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {getInitials(attendee.name)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        {/* More count */}
        {hasMore && remainingCount > 0 && (
          <div className="w-10 h-10 rounded-full bg-muted border-2 border-background ring-1 ring-border flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              +{remainingCount > 99 ? "99" : remainingCount}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Invite Friends
        </Button>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || "?";
}
