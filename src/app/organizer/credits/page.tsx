"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Gift,
  CreditCard,
  TrendingUp,
  Calendar,
  Ticket,
  DollarSign,
  ShoppingCart,
  History,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PurchaseCreditsModal } from "@/components/credits/PurchaseCreditsModal";

export default function CreditsPage() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const credits = useQuery(api.credits.queries.getMyCredits);

  if (!currentUser || !events || !credits) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const percentageUsed =
    credits.creditsTotal > 0 ? (credits.creditsUsed / credits.creditsTotal) * 100 : 0;

  // Calculate total tickets allocated across all events
  const totalTicketsAllocated =
    events?.reduce((sum, event) => {
      return sum + (event.totalTickets || 0);
    }, 0) || 0;

  const totalTicketsSold =
    events?.reduce((sum, event) => {
      return sum + (event.ticketsSold || 0);
    }, 0) || 0;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ticket Credits</h1>
              <p className="text-muted-foreground mt-1">Manage your ticket allocation and purchases</p>
            </div>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Buy More Credits
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-primary rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Available Credits</h2>
                  </div>
                  <p className="text-white/90">Ready to use for ticket creation</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm font-medium">$0.30 per ticket</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-6xl font-bold mb-2">
                  {credits.creditsRemaining.toLocaleString()}
                </div>
                <p className="text-xl text-white/90">tickets available</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Usage: {credits.creditsUsed.toLocaleString()} /{" "}
                    {credits.creditsTotal.toLocaleString()}
                  </span>
                  <span>{percentageUsed.toFixed(1)}% used</span>
                </div>
                <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3">
                  <div
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Free Credits Badge */}
              {credits.creditsTotal === 1000 && credits.creditsUsed === 0 && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Welcome Bonus Active!</span>
                  </div>
                  <p className="text-sm text-white/90 mt-1">
                    You have 1,000 free tickets to get started. No payment required until you use them
                    all!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Allocated</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalTicketsAllocated.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tickets created across all events</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalTicketsSold.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Successful ticket sales</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold text-foreground">{events?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Events with ticket tiers</p>
            </div>
          </motion.div>
        </div>

        {/* Credit Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">Credit Breakdown</h2>
              <p className="text-muted-foreground mt-1">Detailed view of your credit usage</p>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-accent rounded-lg">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {credits.creditsTotal.toLocaleString()}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Total Credits</p>
                  <p className="text-xs text-muted-foreground">Lifetime allocation</p>
                </div>

                <div className="text-center p-6 bg-destructive/10 rounded-lg">
                  <div className="text-4xl font-bold text-destructive mb-2">
                    {credits.creditsUsed.toLocaleString()}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Credits Used</p>
                  <p className="text-xs text-muted-foreground">Allocated to ticket tiers</p>
                </div>

                <div className="text-center p-6 bg-success/10 rounded-lg">
                  <div className="text-4xl font-bold text-success mb-2">
                    {credits.creditsRemaining.toLocaleString()}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Credits Remaining</p>
                  <p className="text-xs text-muted-foreground">Available for new tiers</p>
                </div>
              </div>

              {/* Cost Information */}
              <div className="mt-6 p-4 bg-accent border border-border rounded-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Pricing Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Cost per ticket credit:</p>
                        <p className="font-semibold text-foreground">$0.30 USD</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Value of remaining credits:</p>
                        <p className="font-semibold text-foreground">
                          ${(credits.creditsRemaining * 0.3).toFixed(2)} USD
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Total invested:</p>
                        <p className="font-semibold text-foreground">
                          ${(credits.creditsUsed * 0.3).toFixed(2)} USD
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Lifetime value:</p>
                        <p className="font-semibold text-foreground">
                          ${(credits.creditsTotal * 0.3).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Events Using Credits */}
        {events && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-foreground">Credit Usage by Event</h2>
                <p className="text-muted-foreground mt-1">See how your credits are allocated</p>
              </div>

              <div className="divide-y">
                {events.map((event) => (
                  <Link
                    key={event._id}
                    href={`/organizer/events/${event._id}/tickets`}
                    className="block p-6 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{event.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ticket className="w-4 h-4" />
                            {event.totalTickets || 0} tickets allocated
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {event.ticketsSold || 0} sold
                          </span>
                          {event.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(event.startDate), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{event.totalTickets || 0}</p>
                        <p className="text-xs text-muted-foreground">credits used</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Need More Credits CTA */}
        {credits.creditsRemaining < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-warning rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Running Low on Credits</h3>
                  <p className="text-white/90 mb-4">
                    You have less than 100 credits remaining. Purchase more now to continue creating
                    ticket tiers without interruption.
                  </p>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-6 py-3 bg-white text-warning rounded-lg font-semibold hover:bg-muted transition-colors"
                  >
                    Buy Credits Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseCreditsModal
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            // Refresh credits data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
