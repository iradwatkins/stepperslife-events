"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  TrendingUp,
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  Ticket,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Extended event type with computed fields
interface EventWithStats extends Doc<"events"> {
  imageUrl?: string;
  totalRevenue?: number;
  ticketsSold?: number;
}

export default function TicketSalesPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const rawEvents = useQuery(api.events.queries.getOrganizerEvents, {
    userId: currentUser?._id,
  });

  // Type assertion to include extended fields
  const events = rawEvents as EventWithStats[] | undefined;

  const isLoading = currentUser === undefined || events === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  // Calculate sales statistics
  const totalTicketsSold =
    events?.reduce((sum, event) => sum + (event.ticketsSold || 0), 0) || 0;
  const totalRevenue =
    events?.reduce((sum, event) => sum + (event.totalRevenue || 0), 0) || 0;
  const totalEvents = events?.length || 0;
  const avgRevenuePerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;

  // Sort events by revenue (highest first)
  const eventsByRevenue = [...(events || [])].sort(
    (a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)
  );

  // Sort events by tickets sold (highest first)
  const eventsByTickets = [...(events || [])].sort(
    (a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0)
  );

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
              <h1 className="text-3xl font-bold text-foreground">Sales Overview</h1>
              <p className="text-muted-foreground mt-1">Track your ticket sales and revenue performance</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success p-3 rounded-lg text-white">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-info/100 p-3 rounded-lg text-white">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Tickets Sold</h3>
            <p className="text-3xl font-bold text-foreground">{totalTicketsSold.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-500 p-3 rounded-lg text-white">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Events</h3>
            <p className="text-3xl font-bold text-foreground">{totalEvents.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success500 p-3 rounded-lg text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Avg Revenue/Event</h3>
            <p className="text-3xl font-bold text-foreground">
              ${Math.round(avgRevenuePerEvent).toLocaleString()}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Revenue Generators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Top Revenue Generators
              </h2>
            </div>
            {eventsByRevenue && eventsByRevenue.length > 0 ? (
              <div className="divide-y divide-border">
                {eventsByRevenue.slice(0, 10).map((event, index) => {
                  const revenue = event.totalRevenue || 0;
                  const maxRevenue = eventsByRevenue[0]?.totalRevenue || 1;
                  const percentage = (revenue / maxRevenue) * 100;

                  return (
                    <div key={event._id} className="px-6 py-4 hover:bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/organizer/events/${event._id}`}
                              className="text-sm font-medium text-primary hover:underline truncate block"
                            >
                              {event.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {(event.ticketsSold || 0).toLocaleString()} tickets sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-foreground">
                            ${revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </motion.div>

          {/* Top Selling Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Top Selling Events
              </h2>
            </div>
            {eventsByTickets && eventsByTickets.length > 0 ? (
              <div className="divide-y divide-border">
                {eventsByTickets.slice(0, 10).map((event, index) => {
                  const ticketsSold = event.ticketsSold || 0;
                  const maxTickets = eventsByTickets[0]?.ticketsSold || 1;
                  const percentage = (ticketsSold / maxTickets) * 100;

                  return (
                    <div key={event._id} className="px-6 py-4 hover:bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex-shrink-0 w-6 h-6 bg-info/100/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/organizer/events/${event._id}`}
                              className="text-sm font-medium text-primary hover:underline truncate block"
                            >
                              {event.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              ${(event.totalRevenue || 0).toLocaleString()} revenue
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-foreground">
                            {ticketsSold.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">tickets</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-info/100 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Call to Action */}
        {events && events.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-info/10 border border-info/30 rounded-lg p-8 text-center"
          >
            <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Start Selling Tickets</h3>
            <p className="text-info mb-6 max-w-2xl mx-auto">
              Create your first event and start tracking sales. Our analytics will help you
              understand your audience and optimize your revenue.
            </p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your First Event
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
