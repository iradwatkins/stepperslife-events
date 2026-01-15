"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  FileText,
  Send,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "WON" | "LOST" | "CLOSED";
type Provider = "stripe" | "paypal";

export default function AdminDisputesPage() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "ALL">("ALL");
  const [providerFilter, setProviderFilter] = useState<Provider | "ALL">("ALL");
  const [selectedDisputeId, setSelectedDisputeId] = useState<Id<"paymentDisputes"> | null>(null);
  const [notes, setNotes] = useState("");

  // Queries
  const stats = useQuery(api.paymentDisputes.queries.getDisputeStats, {});
  const disputes = useQuery(api.paymentDisputes.queries.getAdminDisputes, {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    provider: providerFilter === "ALL" ? undefined : providerFilter,
  });
  const selectedDispute = useQuery(
    api.paymentDisputes.queries.getDisputeById,
    selectedDisputeId ? { disputeId: selectedDisputeId } : "skip"
  );

  // Mutations
  const addNotes = useMutation(api.paymentDisputes.mutations.addDisputeNotes);
  const markEvidence = useMutation(api.paymentDisputes.mutations.markEvidenceSubmitted);

  if (isAuthLoading) {
    return <LoadingSpinner fullPage text="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Authentication required.</p>
          <a href="/login?redirect=/admin/disputes" className="text-primary hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!stats || !disputes) {
    return <LoadingSpinner fullPage text="Loading disputes..." />;
  }

  const handleAddNotes = async () => {
    if (!selectedDisputeId || !notes.trim()) return;
    try {
      await addNotes({ disputeId: selectedDisputeId, notes: notes.trim() });
      toast.success("Notes saved");
      setNotes("");
    } catch (error) {
      toast.error("Failed to save notes");
    }
  };

  const handleMarkEvidence = async () => {
    if (!selectedDisputeId) return;
    try {
      await markEvidence({ disputeId: selectedDisputeId });
      toast.success("Marked as evidence submitted");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "UNDER_REVIEW":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "WON":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "LOST":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: "bg-red-100 text-red-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      WON: "bg-green-100 text-green-800",
      LOST: "bg-red-100 text-red-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.CLOSED}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Disputes</h1>
        <p className="text-muted-foreground mt-1">
          Manage PayPal and Stripe chargebacks and disputes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">Open</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.open}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">Under Review</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.underReview}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">Won</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.won}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Lost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.lost}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">At Risk</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            ${(stats.totalAmountCents / 100).toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | "ALL")}
          className="px-3 py-2 border rounded-lg text-sm bg-background"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value as Provider | "ALL")}
          className="px-3 py-2 border rounded-lg text-sm bg-background"
        >
          <option value="ALL">All Providers</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
        </select>
      </div>

      {/* Disputes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-card border rounded-lg p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Disputes Found</h3>
              <p className="text-muted-foreground mt-2">
                {statusFilter !== "ALL" || providerFilter !== "ALL"
                  ? "No disputes match your filters."
                  : "Great news! No payment disputes have been filed."}
              </p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <motion.div
                key={dispute._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedDisputeId(dispute._id)}
                className={`bg-card border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDisputeId === dispute._id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(dispute.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {dispute.disputeId}
                        </span>
                        {getStatusBadge(dispute.status)}
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {dispute.provider.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground">
                        ${(dispute.amountCents / 100).toFixed(2)} {dispute.currency}
                      </p>
                      {dispute.event && (
                        <p className="text-sm text-muted-foreground">
                          Event: {dispute.event.name}
                        </p>
                      )}
                      {dispute.order && (
                        <p className="text-sm text-muted-foreground">
                          Buyer: {dispute.order.buyerName || dispute.order.buyerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{format(new Date(dispute.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-xs">
                      {dispute.reason.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                {dispute.responseDeadline && dispute.status === "OPEN" && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Response due: {format(new Date(dispute.responseDeadline), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDispute ? (
            <div className="bg-card border rounded-lg p-4 sticky top-4 space-y-4">
              <h3 className="font-semibold text-lg">Dispute Details</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Dispute ID:</span>
                  <p className="font-mono">{selectedDispute.disputeId}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="text-lg font-bold">
                    ${(selectedDispute.amountCents / 100).toFixed(2)} {selectedDispute.currency}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Reason:</span>
                  <p>{selectedDispute.reason.replace(/_/g, " ")}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <p className="capitalize">{selectedDispute.provider}</p>
                </div>

                {selectedDispute.event && (
                  <div>
                    <span className="text-muted-foreground">Event:</span>
                    <p>{selectedDispute.event.name}</p>
                  </div>
                )}

                {selectedDispute.organizer && (
                  <div>
                    <span className="text-muted-foreground">Organizer:</span>
                    <p>{selectedDispute.organizer.name || selectedDispute.organizer.email}</p>
                  </div>
                )}

                {selectedDispute.order && (
                  <div>
                    <span className="text-muted-foreground">Buyer:</span>
                    <p>{selectedDispute.order.buyerName}</p>
                    <p className="text-xs text-muted-foreground">{selectedDispute.order.buyerEmail}</p>
                  </div>
                )}

                {selectedDispute.responseDeadline && (
                  <div>
                    <span className="text-muted-foreground">Response Deadline:</span>
                    <p className={selectedDispute.status === "OPEN" ? "text-red-600 font-medium" : ""}>
                      {format(new Date(selectedDispute.responseDeadline), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}

                {selectedDispute.evidenceSubmitted && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Evidence submitted {selectedDispute.evidenceSubmittedAt && format(new Date(selectedDispute.evidenceSubmittedAt), "MMM d")}</span>
                  </div>
                )}

                {selectedDispute.internalNotes && (
                  <div>
                    <span className="text-muted-foreground">Internal Notes:</span>
                    <p className="bg-muted p-2 rounded mt-1 text-xs whitespace-pre-wrap">
                      {selectedDispute.internalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedDispute.status === "OPEN" && (
                <div className="space-y-3 pt-4 border-t">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="w-full p-2 border rounded text-sm resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNotes}
                    disabled={!notes.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    Save Notes
                  </button>

                  {!selectedDispute.evidenceSubmitted && (
                    <button
                      onClick={handleMarkEvidence}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4" />
                      Mark Evidence Submitted
                    </button>
                  )}

                  <a
                    href={
                      selectedDispute.provider === "paypal"
                        ? `https://www.paypal.com/resolutioncenter`
                        : `https://dashboard.stripe.com/disputes`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded hover:bg-muted text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in {selectedDispute.provider === "paypal" ? "PayPal" : "Stripe"}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-8 text-center sticky top-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select a dispute to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
