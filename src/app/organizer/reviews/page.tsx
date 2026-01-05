"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Star,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Trash2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Link from "next/link";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "flagged";

export default function OrganizerReviewsPage() {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [respondingReviewId, setRespondingReviewId] = useState<Id<"classReviews"> | null>(null);
  const [instructorResponse, setInstructorResponse] = useState("");
  const [deletingReviewId, setDeletingReviewId] = useState<Id<"classReviews"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewsData = useQuery(api.classReviews.queries.getInstructorReviews, {
    classId: classFilter !== "all" ? classFilter as Id<"events"> : undefined,
    status: statusFilter !== "all" && statusFilter !== "flagged" ? statusFilter : undefined,
  });

  const analytics = useQuery(api.classReviews.queries.getReviewAnalytics, {
    days: 90,
  });

  const moderateReview = useMutation(api.classReviews.mutations.moderateReview);
  const addInstructorResponse = useMutation(api.classReviews.mutations.addInstructorResponse);
  const deleteReview = useMutation(api.classReviews.mutations.deleteReview);
  const dismissFlags = useMutation(api.classReviews.mutations.dismissFlags);

  if (reviewsData === undefined || analytics === undefined) {
    return <LoadingSpinner fullPage text="Loading your reviews..." />;
  }

  const { reviews, classes } = reviewsData;

  // Filter for flagged if needed
  const filteredReviews = statusFilter === "flagged"
    ? reviews.filter((r) => (r.flagCount ?? 0) > 0)
    : reviews;

  const handleModerate = async (reviewId: Id<"classReviews">, status: "approved" | "rejected") => {
    setIsSubmitting(true);
    try {
      await moderateReview({ reviewId, status });
      toast.success(`Review ${status === "approved" ? "approved" : "rejected"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to moderate review");
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
      toast.success("Response posted");
      setRespondingReviewId(null);
      setInstructorResponse("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReviewId) return;
    setIsSubmitting(true);
    try {
      await deleteReview({ reviewId: deletingReviewId });
      toast.success("Review deleted");
      setDeletingReviewId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissFlags = async (reviewId: Id<"classReviews">) => {
    setIsSubmitting(true);
    try {
      await dismissFlags({ reviewId });
      toast.success("Flags dismissed, review restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss flags");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Instructor Role Indicator */}
      <div className="bg-warning/10 border-b border-warning/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-warning/20 p-1.5 rounded-full">
              <GraduationCap className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="font-medium text-foreground text-sm">Instructor View</span>
              <span className="text-warning text-xs ml-2">Manage reviews for your classes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Class Reviews</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Manage and respond to reviews for your classes
              </p>
            </div>
            <Link
              href="/organizer/reviews/analytics"
              className="flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-colors w-full sm:w-auto"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Statistics */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
          >
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Reviews</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics.totalReviews}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-muted-foreground">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics.averageRating.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Response Rate</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics.responseRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Flagged</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{analytics.flaggedCount}</p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="approved">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Approved
                    </span>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      Rejected
                    </span>
                  </SelectItem>
                  <SelectItem value="flagged">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-destructive" />
                      Flagged
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No reviews found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "Try changing the filters"
                  : "Reviews will appear here when students review your classes"}
              </p>
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(0.05 * index, 0.3) }}
                className={`bg-white rounded-lg shadow-sm border p-4 ${
                  (review.flagCount ?? 0) > 0 ? "border-destructive/50" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewerAvatar || undefined} alt={review.reviewerName} />
                      <AvatarFallback>{getInitials(review.reviewerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{review.reviewerName}</p>
                        {/* Status Badge */}
                        <Badge
                          variant={
                            review.status === "approved"
                              ? "default"
                              : review.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {review.status === "approved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {review.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                          {review.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {review.status}
                        </Badge>
                        {(review.flagCount ?? 0) > 0 && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Flag className="w-3 h-3" />
                            {review.flagCount} flags
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{review.className}</span>
                        <span>•</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <p className="text-sm text-foreground/80 mb-3">{review.reviewText}</p>
                )}

                {/* Vote Counts */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {review.helpfulCount ?? 0} helpful
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {review.unhelpfulCount ?? 0} unhelpful
                  </span>
                </div>

                {/* Flags Section */}
                {review.flags && review.flags.length > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Reported for:
                    </h4>
                    <ul className="text-sm text-destructive/80 space-y-1">
                      {review.flags.map((flag, i) => (
                        <li key={i}>
                          • {flag.reason}
                          {flag.customReason && `: ${flag.customReason}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructor Response */}
                {review.instructorResponse && (
                  <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary mb-4">
                    <p className="text-sm font-medium text-primary mb-1">Your Response</p>
                    <p className="text-sm text-foreground/80">{review.instructorResponse}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  {review.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleModerate(review._id, "approved")}
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleModerate(review._id, "rejected")}
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </>
                  )}

                  {!review.instructorResponse && review.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRespondingReviewId(review._id);
                        setInstructorResponse("");
                      }}
                      disabled={isSubmitting}
                      className="gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Respond
                    </Button>
                  )}

                  {(review.flagCount ?? 0) > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissFlags(review._id)}
                      disabled={isSubmitting}
                      className="gap-1"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Dismiss Flags
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingReviewId(review._id)}
                    disabled={isSubmitting}
                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Respond Dialog */}
      <Dialog open={!!respondingReviewId} onOpenChange={() => setRespondingReviewId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible to everyone viewing this review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={instructorResponse}
              onChange={(e) => setInstructorResponse(e.target.value)}
              placeholder="Thank you for your feedback..."
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {instructorResponse.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingReviewId(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={isSubmitting || !instructorResponse.trim()}>
              {isSubmitting ? "Posting..." : "Post Response"}
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
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
