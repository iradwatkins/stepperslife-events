"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ShoppingCart,
  Gift,
  ArrowLeft,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";

export default function PurchaseTicketsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const credits = useQuery(api.credits.queries.getMyCredits);
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const purchaseTickets = useMutation(api.credits.mutations.purchaseTicketsForEvent);

  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [ticketQuantity, setTicketQuantity] = useState<number>(100);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isLoading =
    currentUser === undefined || credits === undefined || events === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Insufficient credits");
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await purchaseTickets({
        eventId: selectedEvent as Id<"events">,
        quantity: ticketQuantity,
      });

      if (result.success) {
        toast.success(
          `Successfully added ${result.ticketsPurchased.toLocaleString()} tickets to your event! New capacity: ${result.newCapacity.toLocaleString()}`
        );
        // Reset form
        setSelectedEvent("");
        setTicketQuantity(100);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to purchase tickets";
      toast.error(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const creditCost = ticketQuantity; // 1 credit = 1 ticket
  const hasEnoughCredits = credits && credits.creditsRemaining >= creditCost;

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/organizer/tickets"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Purchase Tickets</h1>
              <p className="text-muted-foreground mt-1">Use your credits to create tickets for your events</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Purchase Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Select Event & Quantity</h2>

              {/* Event Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Event
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-4 py-2 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Choose an event...</option>
                  {events?.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Number of Tickets
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 10))}
                    className="p-2 bg-muted hover:bg-muted rounded-lg transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-4 py-2 border border rounded-lg text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => setTicketQuantity(ticketQuantity + 10)}
                    className="p-2 bg-muted hover:bg-muted rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Quick adjust: ±10 tickets per click
                </p>
              </div>

              {/* Quick Quantity Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTicketQuantity(qty)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        ticketQuantity === qty
                          ? "bg-primary text-white"
                          : "bg-muted hover:bg-muted text-foreground"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Button */}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={!selectedEvent || !hasEnoughCredits || isPurchasing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Purchase {ticketQuantity.toLocaleString()} Tickets
                  </>
                )}
              </button>

              {!hasEnoughCredits && (
                <p className="text-destructive text-sm mt-2 text-center">
                  Insufficient credits. You need {creditCost - (credits?.creditsRemaining || 0)} more credits.
                </p>
              )}
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-4"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Purchase Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tickets</span>
                  <span className="font-medium">{ticketQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Cost</span>
                  <span className="font-medium">{creditCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost</span>
                    <span className="text-primary">{creditCost.toLocaleString()} credits</span>
                  </div>
                </div>
              </div>

              {/* Available Credits */}
              {credits && (
                <div className="bg-primary/10 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h4 className="font-medium text-foreground">Available Credits</h4>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {credits.creditsRemaining.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {credits.creditsRemaining >= creditCost ? (
                      <span className="flex items-center gap-1 text-success">
                        <Check className="w-4 h-4" />
                        Sufficient credits
                      </span>
                    ) : (
                      <span className="text-destructive">
                        Need {(creditCost - credits.creditsRemaining).toLocaleString()} more
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Need More Credits */}
              <Link
                href="/organizer/credits"
                className="block w-full text-center px-4 py-2 bg-muted hover:bg-muted text-foreground rounded-lg transition-colors"
              >
                Purchase More Credits
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 bg-info/10 border border-info/30 rounded-lg p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-2">How Ticket Purchase Works</h3>
          <ul className="space-y-2 text-foreground">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>1 credit = 1 ticket - Simple and transparent pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Tickets are instantly added to your selected event</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>You can distribute or sell tickets immediately after purchase</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Unused credits never expire and can be used for any event</span>
            </li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
