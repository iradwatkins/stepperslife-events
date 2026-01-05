"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other";

interface ReportReviewDialogProps {
  reviewId: Id<"classReviews"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Promotional content or unrelated to the class",
  },
  {
    value: "inappropriate",
    label: "Inappropriate Content",
    description: "Offensive language, hate speech, or explicit content",
  },
  {
    value: "fake",
    label: "Fake Review",
    description: "Suspected to be fraudulent or from someone who didn't attend",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Targets an individual with harmful intent",
  },
  {
    value: "other",
    label: "Other",
    description: "Another issue not listed above",
  },
];

export function ReportReviewDialog({
  reviewId,
  open,
  onOpenChange,
}: ReportReviewDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flagReview = useMutation(api.classReviews.mutations.flagReview);

  const handleSubmit = async () => {
    if (!reviewId || !reason) return;

    // Validate custom reason if "other" is selected
    if (reason === "other" && !customReason.trim()) {
      toast.error("Please provide a reason", {
        description: "When selecting 'Other', please explain why you're reporting this review.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await flagReview({
        reviewId,
        reason,
        customReason: reason === "other" ? customReason.trim() : undefined,
      });

      toast.success("Report submitted", {
        description: result.isHidden
          ? "This review has been temporarily hidden pending moderation."
          : "Thank you for your report. We'll review it shortly.",
      });

      // Reset and close
      setReason(null);
      setCustomReason("");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast.error("Error", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason(null);
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Review
          </DialogTitle>
          <DialogDescription>
            Help us understand why you're reporting this review. False reports may result in action against your account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Why are you reporting this review?
            </Label>
            <RadioGroup
              value={reason ?? ""}
              onValueChange={(value) => setReason(value as ReportReason)}
              className="space-y-3"
            >
              {REPORT_REASONS.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setReason(option.value)}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">
                Please describe the issue <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why you're reporting this review..."
                rows={3}
                maxLength={300}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {customReason.length}/300
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
