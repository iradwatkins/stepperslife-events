"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Wallet,
  Download,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EarningsPage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(api.events.queries.getOrganizerEvents, {
    userId: currentUser?._id,
  });
  const earnings = useQuery(api.orders.queries.getOrganizerEarnings);
  const eventRevenue = useQuery(api.orders.queries.getEventRevenueBreakdown);
  const payoutEligibility = useQuery(api.organizerPayouts.queries.canRequestPayout, {});
  const payoutStats = useQuery(api.organizerPayouts.queries.getPayoutStats, {});

  const requestPayoutMutation = useMutation(api.organizerPayouts.mutations.requestPayout);

  const isLoading = currentUser === undefined || events === undefined || earnings === undefined || eventRevenue === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return <LoadingSpinner fullPage text="Loading earnings..." />;
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

  // Calculate earnings from real data
  const totalRevenue = (earnings?.totalRevenueCents || 0) / 100;
  const pendingPayout = (payoutEligibility?.availableBalanceCents || 0) / 100;
  const totalPaidOut = (payoutStats?.totalPaidOut || 0) / 100;

  // Calculate next payout date (next Monday)
  const getNextMonday = () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };
  const nextPayoutDate = pendingPayout > 0 ? getNextMonday() : "No pending payout";

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-success",
      description: "All-time ticket sales",
    },
    {
      title: "Available for Payout",
      value: `$${pendingPayout.toLocaleString()}`,
      icon: Clock,
      color: "bg-warning",
      description: "Ready for payout",
    },
    {
      title: "Total Paid Out",
      value: `$${totalPaidOut.toLocaleString()}`,
      icon: Wallet,
      color: "bg-primary",
      description: "Successfully transferred",
    },
  ];

  const quickActions = [
    {
      title: "Payout History",
      description: "View all your past payouts",
      icon: Download,
      href: "/organizer/earnings/payouts",
      color: "bg-info/100",
    },
    {
      title: "Transactions",
      description: "See detailed transaction history",
      icon: TrendingUp,
      href: "/organizer/earnings/transactions",
      color: "bg-success",
    },
    {
      title: "Payment Setup",
      description: "Configure your payout methods",
      icon: Wallet,
      href: "/organizer/payment-methods",
      color: "bg-sky-500",
    },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
              <p className="text-muted-foreground mt-1">Track your revenue and payouts</p>
            </div>
            <div className="flex items-center gap-3">
              {payoutEligibility?.canRequest && (
                <button
                  onClick={handleRequestPayout}
                  disabled={isRequesting}
                  className="flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/90 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequesting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Request Payout
                </button>
              )}
              <Link
                href="/organizer/earnings/payouts"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                View Payouts
              </Link>
              <Link
                href="/organizer/earnings/reports"
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <BarChart3 className="w-5 h-5" />
                Revenue Reports
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
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

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Next Payout Info */}
        {pendingPayout > 0 && payoutEligibility?.canRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-8 text-white mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Ready for Payout</h2>
                </div>
                <p className="text-white/90 mb-4">Minimum payout: ${((payoutEligibility?.minimumPayoutCents || 2500) / 100).toFixed(2)}</p>
                <div className="text-4xl font-bold mb-2">${pendingPayout.toLocaleString()}</div>
                <p className="text-white/90">Available to request now</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRequestPayout}
                  disabled={isRequesting}
                  className="px-6 py-3 bg-white text-success rounded-lg hover:bg-muted transition-colors font-medium text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Request Payout Now
                </button>
                <Link
                  href="/organizer/payment-methods"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium text-center"
                >
                  Manage Payment Methods
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Payout Message (when has pending request) */}
        {payoutStats && (payoutStats.pendingCount > 0 || payoutStats.approvedCount > 0 || payoutStats.processingCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg p-8 text-white mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Payout In Progress</h2>
                </div>
                <p className="text-white/90 mb-2">
                  {payoutStats.pendingCount > 0 && `${payoutStats.pendingCount} pending review`}
                  {payoutStats.pendingCount > 0 && payoutStats.approvedCount > 0 && " • "}
                  {payoutStats.approvedCount > 0 && `${payoutStats.approvedCount} approved`}
                  {(payoutStats.pendingCount > 0 || payoutStats.approvedCount > 0) && payoutStats.processingCount > 0 && " • "}
                  {payoutStats.processingCount > 0 && `${payoutStats.processingCount} processing`}
                </p>
                <div className="text-4xl font-bold mb-2">
                  ${(((payoutStats.pendingAmount || 0) + (payoutStats.approvedAmount || 0) + (payoutStats.processingAmount || 0)) / 100).toLocaleString()}
                </div>
                <p className="text-white/90">Will be transferred to your account soon</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/organizer/earnings/payouts"
                  className="px-6 py-3 bg-white text-amber-600 rounded-lg hover:bg-muted transition-colors font-medium text-center"
                >
                  View Payout Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`${action.color} p-3 rounded-lg text-white w-fit mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{action.title}</h3>
                <p className="text-muted-foreground mb-4">{action.description}</p>
                <div className="flex items-center text-primary font-medium">
                  View {action.title.toLowerCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Revenue by Event</h2>
              <Link
                href="/organizer/earnings/transactions"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                View all transactions
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {eventRevenue && eventRevenue.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {eventRevenue.slice(0, 10).map((event) => {
                  const revenue = event.revenueCents / 100;

                  return (
                    <div key={event.eventId} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/organizer/events/${event.eventId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {event.eventName}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {event.status === "pending" ? "Pending" : "No Sales"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {event.ticketsSold.toLocaleString()} tickets sold
                        </span>
                        <span className="font-medium text-foreground">
                          ${revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tickets Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {eventRevenue.slice(0, 10).map((event) => {
                      const revenue = event.revenueCents / 100;

                      return (
                        <tr key={event.eventId} className="hover:bg-muted">
                          <td className="px-6 py-4">
                            <Link
                              href={`/organizer/events/${event.eventId}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {event.eventName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {event.ticketsSold.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            ${revenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              event.status === "pending"
                                ? "bg-warning/10 text-warning"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {event.status === "pending" ? "Pending" : "No Sales"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No earnings yet</h3>
              <p className="text-muted-foreground mb-6">
                Start selling tickets to track your earnings
              </p>
              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Event
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
