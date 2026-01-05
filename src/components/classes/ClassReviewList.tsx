"use client";

import { useState, useId } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ClassReviewCard } from "./ClassReviewCard";
import { ClassReviewForm } from "./ClassReviewForm";
import { ClassRating } from "./ClassRating";
import { StarInput } from "./StarInput";
import { ReportReviewDialog } from "./ReportReviewDialog";
import { Loader2, Star, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type SortOption = "recent" | "helpful" | "highest" | "lowest";

interface ClassReviewListProps {
  classId: Id<"events">;
  showForm?: boolean;
  isInstructor?: boolean;
  className?: string;
}

// Loading skeleton for reviews
function ReviewSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function RatingSummarySkeleton() {
  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="text-center md:text-left space-y-2">
          <Skeleton className="h-12 w-16 mx-auto md:mx-0" />
          <Skeleton className="h-5 w-28 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-20 mx-auto md:mx-0" />
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "helpful", label: "Most Helpful" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

export function ClassReviewList({
  classId,
  showForm = true,
  isInstructor = false,
  className,
}: ClassReviewListProps) {
  const { isAuthenticated } = useAuth();
  const [displayLimit, setDisplayLimit] = useState(5);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [editingReview, setEditingReview] = useState<{
    id: Id<"classReviews">;
    rating: number;
    reviewText: string;
  } | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<Id<"classReviews"> | null>(null);
  const [respondingReviewId, setRespondingReviewId] = useState<Id<"classReviews"> | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<Id<"classReviews"> | null>(null);
  const [instructorResponse, setInstructorResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique IDs for accessibility
  const dialogId = useId();
  const editRatingId = `${dialogId}-edit-rating`;
  const editTextId = `${dialogId}-edit-text`;
  const responseTextId = `${dialogId}-response-text`;

  const reviewsData = useQuery(api.classReviews.queries.getClassReviews, {
    classId,
    limit: displayLimit,
    sortBy,
  });
  const ratingData = useQuery(api.classReviews.queries.getClassRating, { classId });

  const updateReview = useMutation(api.classReviews.mutations.updateReview);
  const deleteReview = useMutation(api.classReviews.mutations.deleteReview);
  const addInstructorResponse = useMutation(api.classReviews.mutations.addInstructorResponse);

  // Loading state with skeletons
  if (reviewsData === undefined || ratingData === undefined) {
    return (
      <div className={cn("space-y-6", className)}>
        <RatingSummarySkeleton />
        {showForm && (
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-8 w-40 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        <div>
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="space-y-4">
            <ReviewSkeleton />
            <ReviewSkeleton />
            <ReviewSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const { reviews, hasMore } = reviewsData;

  const handleEdit = (reviewId: Id<"classReviews">) => {
    const review = reviews.find((r) => r._id === reviewId);
    if (review) {
      setEditingReview({
        id: reviewId,
        rating: review.rating,
        reviewText: review.reviewText || "",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    setIsSubmitting(true);
    try {
      await updateReview({
        reviewId: editingReview.id,
        rating: editingReview.rating,
        reviewText: editingReview.reviewText.trim() || undefined,
      });
      setEditingReview(null);
    } catch (error) {
      console.error("Failed to update review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReviewId) return;
    setIsSubmitting(true);
    try {
      await deleteReview({ reviewId: deletingReviewId });
      setDeletingReviewId(null);
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async () => {
    if (!respondingReviewId || !instructorResponse.trim()) return;
    setIsSubmitting(true);
    try {
      await addInstructorResponse({
        reviewId: respondingReviewId,
        response: instructorResponse.trim(),
      });
      setRespondingReviewId(null);
      setInstructorResponse("");
    } catch (error) {
      console.error("Failed to add response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 5);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Rating summary */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Overall rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold">
              {ratingData.totalReviews > 0 ? ratingData.averageRating.toFixed(1) : "—"}
            </div>
            <ClassRating
              rating={ratingData.averageRating}
              totalReviews={ratingData.totalReviews}
              size={20}
              showCount={false}
              className="justify-center md:justify-start mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {ratingData.totalReviews} review{ratingData.totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating distribution */}
          {ratingData.totalReviews > 0 && (
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingData.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5];
                const percentage = ratingData.totalReviews > 0
                  ? (count / ratingData.totalReviews) * 100
                  : 0;

                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-right">{stars}</span>
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
          <ClassReviewForm classId={classId} />
        </div>
      )}

      {/* Reviews list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Reviews ({ratingData.totalReviews})
          </h3>
          {/* Sort dropdown */}
          {ratingData.totalReviews > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(sortBy === option.value && "bg-accent")}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to review this class!
            </p>
          </div>
        ) : (
          <div className="space-y-4" role="feed" aria-label="Class reviews">
            {reviews.map((review) => (
              <ClassReviewCard
                key={review._id}
                review={review}
                isOwner={review.isOwner}
                isInstructor={isInstructor}
                isLoggedIn={isAuthenticated}
                onEdit={handleEdit}
                onDelete={setDeletingReviewId}
                onRespond={(id) => {
                  setRespondingReviewId(id);
                  setInstructorResponse("");
                }}
                onReport={setReportingReviewId}
              />
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load more reviews
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>
              Update your rating and review text below.
            </DialogDescription>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4 py-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium" id={editRatingId}>
                  Your Rating
                </legend>
                <StarInput
                  value={editingReview.rating}
                  onChange={(rating) =>
                    setEditingReview((prev) => (prev ? { ...prev, rating } : null))
                  }
                  size={32}
                  disabled={isSubmitting}
                  label="Your Rating"
                />
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor={editTextId}>
                  Your Review{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id={editTextId}
                  value={editingReview.reviewText}
                  onChange={(e) =>
                    setEditingReview((prev) =>
                      prev ? { ...prev, reviewText: e.target.value } : null
                    )
                  }
                  placeholder="Share your experience..."
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  className="resize-none"
                  aria-describedby={`${editTextId}-count`}
                />
                <p
                  id={`${editTextId}-count`}
                  className="text-xs text-muted-foreground text-right"
                  aria-live="polite"
                >
                  {editingReview.reviewText.length}/500 characters
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting || !editingReview?.rating}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReviewId} onOpenChange={() => setDeletingReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instructor Response Dialog */}
      <Dialog open={!!respondingReviewId} onOpenChange={() => setRespondingReviewId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible to everyone viewing this review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor={responseTextId} className="sr-only">
              Your response
            </Label>
            <Textarea
              id={responseTextId}
              value={instructorResponse}
              onChange={(e) => setInstructorResponse(e.target.value)}
              placeholder="Thank you for your feedback..."
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
              className="resize-none"
              aria-describedby={`${responseTextId}-count`}
            />
            <p
              id={`${responseTextId}-count`}
              className="text-xs text-muted-foreground text-right"
              aria-live="polite"
            >
              {instructorResponse.length}/500 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingReviewId(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isSubmitting || !instructorResponse.trim()}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                  Posting...
                </>
              ) : (
                "Post Response"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog */}
      <ReportReviewDialog
        reviewId={reportingReviewId}
        open={!!reportingReviewId}
        onOpenChange={(open) => !open && setReportingReviewId(null)}
      />
    </div>
  );
}
