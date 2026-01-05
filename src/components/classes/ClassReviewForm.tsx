"use client";

import { useState, useId } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarInput } from "./StarInput";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassReviewFormProps {
  classId: Id<"events">;
  onSuccess?: () => void;
  className?: string;
}

export function ClassReviewForm({
  classId,
  onSuccess,
  className,
}: ClassReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate unique IDs for accessibility
  const formId = useId();
  const ratingId = `${formId}-rating`;
  const ratingErrorId = `${formId}-rating-error`;
  const textareaId = `${formId}-review-text`;
  const errorId = `${formId}-error`;

  const canReview = useQuery(api.classReviews.queries.canUserReview, { classId });
  const submitReview = useMutation(api.classReviews.mutations.submitReview);

  // Retry logic with exponential backoff for network errors
  const submitWithRetry = async (maxRetries = 3): Promise<void> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await submitReview({
          classId,
          rating,
          reviewText: reviewText.trim() || undefined,
        });
        return; // Success
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Failed to submit review");

        // Don't retry validation errors (they won't change on retry)
        const errorMessage = lastError.message.toLowerCase();
        if (
          errorMessage.includes("rating") ||
          errorMessage.includes("already reviewed") ||
          errorMessage.includes("must be enrolled") ||
          errorMessage.includes("please wait") ||
          errorMessage.includes("logged in")
        ) {
          throw lastError;
        }

        // Network/timeout error - retry with backoff
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw lastError || new Error("Failed to submit review after multiple attempts");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (reviewText.length > 500) {
      setError("Review must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitWithRetry();
      setSuccess(true);
      setRating(0);
      setReviewText("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (canReview === undefined) {
    return (
      <div className={cn("flex items-center justify-center p-6", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={cn("bg-green-50 border border-green-200 rounded-lg p-6", className)}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Review submitted!</p>
            <p className="text-sm text-green-600">Thank you for your feedback.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cannot review states
  if (!canReview.canReview) {
    const messages: Record<string, { title: string; description: string }> = {
      not_authenticated: {
        title: "Sign in to leave a review",
        description: "You must be logged in to review classes.",
      },
      user_not_found: {
        title: "Account not found",
        description: "Please sign in with a valid account.",
      },
      already_reviewed: {
        title: "Already reviewed",
        description: "You have already submitted a review for this class.",
      },
      no_enrollment: {
        title: "Enrollment required",
        description: "You must be enrolled in this class to leave a review.",
      },
      class_not_ended: {
        title: "Class in progress",
        description: "You can leave a review after the class has ended.",
      },
    };

    const reason = canReview.reason ?? "unknown";
    const message = messages[reason] || {
      title: "Cannot leave review",
      description: "You are unable to review this class at this time.",
    };

    return (
      <div className={cn("bg-muted/50 border rounded-lg p-6", className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{message.title}</p>
            <p className="text-sm text-muted-foreground">{message.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // Review form
  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      aria-describedby={error ? errorId : undefined}
      noValidate
    >
      {/* Rating Field */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium" id={ratingId}>
          Your Rating <span className="text-destructive">*</span>
        </legend>
        <StarInput
          value={rating}
          onChange={setRating}
          size={32}
          disabled={isSubmitting}
          label="Your Rating"
          aria-describedby={rating === 0 && error ? ratingErrorId : undefined}
        />
        {rating === 0 && error?.includes("rating") && (
          <p
            id={ratingErrorId}
            className="text-sm text-destructive"
            role="alert"
          >
            Please select a rating
          </p>
        )}
      </fieldset>

      {/* Review Text Field */}
      <div className="space-y-2">
        <label htmlFor={textareaId} className="block text-sm font-medium">
          Your Review{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          id={textareaId}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this class..."
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
          className="resize-none"
          aria-describedby={`${textareaId}-count`}
        />
        <p
          id={`${textareaId}-count`}
          className="text-xs text-muted-foreground text-right"
          aria-live="polite"
        >
          {reviewText.length}/500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id={errorId}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            <span>Submitting...</span>
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
