"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Wallet,
  Plus,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function PayoutsPage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const payouts = useQuery(api.organizerPayouts.queries.getOrganizerPayouts, {});
  const payoutEligibility = useQuery(api.organizerPayouts.queries.canRequestPayout, {});
  const payoutStats = useQuery(api.organizerPayouts.queries.getPayoutStats, {});

  const requestPayoutMutation = useMutation(api.organizerPayouts.mutations.requestPayout);

  const isLoading =
    currentUser === undefined ||
    payouts === undefined ||
    payoutEligibility === undefined;

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading payouts..." />;
  }

  if (currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Please sign in to view payouts.</p>
        </div>
      </div>
    );
  }

  const handleRequestPayout = async () => {
    if (!payoutEligibility?.canRequest) return;

    setIsRequesting(true);
    setRequestError(null);
    setRequestSuccess(false);

    try {
      await requestPayoutMutation({});
      setRequestSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setRequestSuccess(false), 5000);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Failed to request payout"
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const formatPaymentMethod = (method: string | undefined): string => {
    if (!method) return "Not specified";
    switch (method) {
      case "stripe":
        return "Stripe Transfer";
      case "bank_transfer":
        return "Bank Transfer";
      case "paypal":
        return "PayPal";
      case "check":
        return "Check";
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning-foreground flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-info flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary flex items-center gap-1 w-fit">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/20 text-destructive flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/20 text-destructive flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/organizer/earnings"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Payout History
                </h1>
                <p className="text-muted-foreground mt-1">
                  View all your past and upcoming payouts
                </p>
              </div>
            </div>
            {payoutEligibility?.canRequest && (
              <button
                onClick={handleRequestPayout}
                disabled={isRequesting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Request Payout
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* Request Success/Error Messages */}
        {requestSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-success">
              Payout requested successfully! It will be reviewed by our team.
            </p>
          </motion.div>
        )}

        {requestError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">{requestError}</p>
          </motion.div>
        )}

        {/* Available Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Available for Payout
              </h2>
              <p className="text-3xl font-bold text-primary">
                $
                {(
                  (payoutEligibility?.availableBalanceCents || 0) / 100
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Minimum payout: $
                {((payoutEligibility?.minimumPayoutCents || 2500) / 100).toFixed(
                  2
                )}
              </p>
            </div>
            <div className="hidden sm:block">
              <Wallet className="w-16 h-16 text-primary/20" />
            </div>
          </div>
          {!payoutEligibility?.canRequest && payoutEligibility?.reason && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {payoutEligibility.reason}
              </p>
            </div>
          )}
        </motion.div>

        {/* Stats Summary */}
        {payoutStats && payoutStats.totalPayouts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-muted-foreground">Total Payouts</p>
              <p className="text-2xl font-bold text-foreground">
                {payoutStats.totalPayouts}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">
                {payoutStats.pendingCount}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">
                {payoutStats.completedCount}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-muted-foreground">Total Paid Out</p>
              <p className="text-2xl font-bold text-primary">
                ${((payoutStats.totalPaidOut || 0) / 100).toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Payouts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {payouts && payouts.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {payouts.map((payout) => (
                  <div key={payout._id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          $
                          {(payout.amountCents / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.requestedAt).toLocaleDateString()} •{" "}
                          {formatPaymentMethod(payout.paymentMethod)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payout.payoutNumber}
                        </p>
                      </div>
                      {getStatusBadge(payout.status)}
                    </div>
                    {payout.rejectionReason && (
                      <p className="text-xs text-destructive mt-2">
                        Reason: {payout.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Payout #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {payouts.map((payout) => (
                      <tr key={payout._id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                          {payout.payoutNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(payout.requestedAt).toLocaleDateString()}
                          {payout.completedAt && (
                            <span className="block text-xs text-muted-foreground">
                              Completed:{" "}
                              {new Date(payout.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          $
                          {(payout.amountCents / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatPaymentMethod(payout.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {getStatusBadge(payout.status)}
                            {payout.rejectionReason && (
                              <p className="text-xs text-destructive mt-1">
                                {payout.rejectionReason}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                No payouts yet
              </h3>
              <p className="text-muted-foreground mb-6">
                {payoutEligibility?.canRequest
                  ? "You can request your first payout now!"
                  : payoutEligibility?.reason ||
                    "Start earning revenue to request payouts."}
              </p>
              {payoutEligibility?.canRequest && (
                <button
                  onClick={handleRequestPayout}
                  disabled={isRequesting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isRequesting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Request Payout
                </button>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
