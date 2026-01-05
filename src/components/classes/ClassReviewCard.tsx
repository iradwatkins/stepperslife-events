"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Star,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassReviewCardProps {
  review: {
    _id: Id<"classReviews">;
    rating: number;
    reviewText?: string;
    instructorResponse?: string;
    createdAt: number;
    userName: string;
    userAvatar: string | null;
    // Story 6.3.1: Helpful voting
    helpfulCount?: number;
    unhelpfulCount?: number;
    userVote?: "helpful" | "unhelpful" | null;
    // Story 6.3.2: Verified attendee
    isVerifiedAttendee?: boolean;
    // Story 6.3.10: Deleted user handling
    isDeletedUser?: boolean;
  };
  isOwner?: boolean;
  isInstructor?: boolean;
  isLoggedIn?: boolean;
  onEdit?: (reviewId: Id<"classReviews">) => void;
  onDelete?: (reviewId: Id<"classReviews">) => void;
  onRespond?: (reviewId: Id<"classReviews">) => void;
  onReport?: (reviewId: Id<"classReviews">) => void;
  className?: string;
}

export function ClassReviewCard({
  review,
  isOwner = false,
  isInstructor = false,
  isLoggedIn = false,
  onEdit,
  onDelete,
  onRespond,
  onReport,
  className,
}: ClassReviewCardProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [localVote, setLocalVote] = useState<"helpful" | "unhelpful" | null>(
    review.userVote ?? null
  );
  const [localHelpful, setLocalHelpful] = useState(review.helpfulCount ?? 0);
  const [localUnhelpful, setLocalUnhelpful] = useState(review.unhelpfulCount ?? 0);

  const voteOnReview = useMutation(api.classReviews.mutations.voteOnReview);

  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const initials = review.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const reviewTextTruncated =
    review.reviewText && review.reviewText.length > 200 && !showFullText
      ? review.reviewText.slice(0, 200) + "..."
      : review.reviewText;

  const handleVote = async (voteType: "helpful" | "unhelpful") => {
    if (isOwner || !isLoggedIn || isVoting) return;

    setIsVoting(true);
    const previousVote = localVote;
    const previousHelpful = localHelpful;
    const previousUnhelpful = localUnhelpful;

    // Optimistic update
    if (localVote === voteType) {
      // Toggle off
      setLocalVote(null);
      if (voteType === "helpful") setLocalHelpful((prev) => Math.max(0, prev - 1));
      else setLocalUnhelpful((prev) => Math.max(0, prev - 1));
    } else {
      // Change or add vote
      if (localVote === "helpful") setLocalHelpful((prev) => Math.max(0, prev - 1));
      else if (localVote === "unhelpful") setLocalUnhelpful((prev) => Math.max(0, prev - 1));

      setLocalVote(voteType);
      if (voteType === "helpful") setLocalHelpful((prev) => prev + 1);
      else setLocalUnhelpful((prev) => prev + 1);
    }

    try {
      await voteOnReview({ reviewId: review._id, voteType });
    } catch (error) {
      // Rollback on error
      setLocalVote(previousVote);
      setLocalHelpful(previousHelpful);
      setLocalUnhelpful(previousUnhelpful);
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={cn("border rounded-lg p-4", className)} data-testid="review-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className={cn("h-10 w-10", review.isDeletedUser && "opacity-50")}>
            {review.isDeletedUser ? (
              <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
            ) : (
              <>
                <AvatarImage src={review.userAvatar || undefined} alt={review.userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-medium",
                review.isDeletedUser && "text-muted-foreground italic"
              )}>
                {review.userName}
              </p>
              {/* Story 6.3.2: Verified Attendee Badge */}
              {review.isVerifiedAttendee && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="gap-1 px-1.5 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-xs">Verified</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This reviewer attended this class</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Star rating */}
              <div className="flex" aria-label={`${review.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={cn(
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        {(isOwner || isInstructor || isLoggedIn) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="review-menu">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(review._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit review
                </DropdownMenuItem>
              )}
              {isOwner && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(review._id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete review
                </DropdownMenuItem>
              )}
              {isInstructor && !review.instructorResponse && onRespond && (
                <DropdownMenuItem onClick={() => onRespond(review._id)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Respond to review
                </DropdownMenuItem>
              )}
              {/* Story 6.3.3: Report option */}
              {!isOwner && isLoggedIn && onReport && (
                <>
                  {(isOwner || isInstructor) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onReport(review._id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report review
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Review text */}
      {review.reviewText && (
        <div className="mt-3">
          <p className="text-sm text-foreground/80">{reviewTextTruncated}</p>
          {review.reviewText.length > 200 && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-sm text-primary hover:underline mt-1"
            >
              {showFullText ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Story 6.3.1: Helpful voting */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Was this helpful?</span>
        <div className="flex items-center gap-2">
          <Button
            variant={localVote === "helpful" ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-2 gap-1",
              localVote === "helpful" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              isOwner && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleVote("helpful")}
            disabled={isOwner || !isLoggedIn || isVoting}
            aria-pressed={localVote === "helpful"}
            aria-label={`Helpful (${localHelpful})`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{localHelpful > 0 ? localHelpful : ""}</span>
          </Button>
          <Button
            variant={localVote === "unhelpful" ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-2 gap-1",
              localVote === "unhelpful" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              isOwner && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleVote("unhelpful")}
            disabled={isOwner || !isLoggedIn || isVoting}
            aria-pressed={localVote === "unhelpful"}
            aria-label={`Not helpful (${localUnhelpful})`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>{localUnhelpful > 0 ? localUnhelpful : ""}</span>
          </Button>
        </div>
        {isOwner && (
          <span className="text-xs text-muted-foreground italic">
            You can't vote on your own review
          </span>
        )}
      </div>

      {/* Instructor response */}
      {review.instructorResponse && (
        <div className="mt-4 bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
          <p className="text-sm font-medium text-primary mb-1">Instructor Response</p>
          <p className="text-sm text-foreground/80">{review.instructorResponse}</p>
        </div>
      )}
    </div>
  );
}
