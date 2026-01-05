"use client";

import { Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { UrgencyBadge, type UrgencyLevel } from "./UrgencyBadge";
import { cn } from "@/lib/utils";

interface SocialProofProps {
  eventId: Id<"events">;
  variant?: "card" | "detail";
  className?: string;
  showUrgency?: boolean;
}

export function SocialProof({
  eventId,
  variant = "card",
  className,
  showUrgency = true,
}: SocialProofProps) {
  const socialProof = useQuery(api.events.social.getEventSocialProof, {
    eventId,
  });

  if (!socialProof) {
    // Loading state - show skeleton
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const { interestedCount, goingCount, urgency, ticketsRemaining } = socialProof;

  // Format the going count with thresholds
  const formatCount = (count: number): string => {
    if (count >= 100) return "100+ going";
    if (count >= 50) return "50+ going";
    if (count >= 10) return "10+ going";
    if (count > 0) return `${count} going`;
    return "";
  };

  const goingText = formatCount(goingCount);

  if (variant === "card") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap text-sm", className)}>
        {goingCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{goingText}</span>
          </div>
        )}
        {showUrgency && urgency.level !== "none" && (
          <>
            {goingCount > 0 && (
              <span className="text-muted-foreground/50">•</span>
            )}
            <UrgencyBadge
              level={urgency.level as UrgencyLevel}
              message={urgency.message}
              compact
            />
          </>
        )}
      </div>
    );
  }

  // Detail page variant - more comprehensive
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4 flex-wrap">
        {goingCount > 0 && (
          <div className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">{goingText}</span>
          </div>
        )}
        {interestedCount > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{interestedCount} interested</span>
          </div>
        )}
      </div>

      {showUrgency && urgency.level !== "none" && (
        <UrgencyBadge
          level={urgency.level as UrgencyLevel}
          message={urgency.message}
        />
      )}

      {ticketsRemaining !== undefined && ticketsRemaining > 0 && ticketsRemaining <= 20 && (
        <p className="text-sm text-muted-foreground">
          Only {ticketsRemaining} tickets left!
        </p>
      )}
    </div>
  );
}
