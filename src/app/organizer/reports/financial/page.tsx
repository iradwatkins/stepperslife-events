"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { DollarSign, ArrowLeft, TrendingUp, Calendar, PieChart } from "lucide-react";
import { motion } from "framer-motion";

export default function FinancialReportsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const revenueStats = useQuery(
    api.analytics.queries.getOrganizerRevenueStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const eventPerformance = useQuery(
    api.analytics.queries.getEventPerformanceBreakdown,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const isLoading = currentUser === undefined || events === undefined || revenueStats === undefined;

  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading financial reports...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (revenueStats?.totalRevenue || 0) / 100; // Convert cents to dollars
  const totalEvents = events?.length || 0;
  const avgRevenuePerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;

  return (
    <div className="min-h-screen bg-card">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/organizer/reports"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
              <p className="text-muted-foreground mt-1">Detailed financial breakdowns and summaries</p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-success/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-info/20 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <p className="text-sm text-muted-foreground">Events</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalEvents}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/20 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Revenue/Event</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${Math.round(avgRevenuePerEvent).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Event Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <PieChart className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Revenue by Event</h2>
            </div>
          </div>
          {eventPerformance && eventPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Event</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Tickets Sold</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-muted-foreground">Attendees</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eventPerformance.map((event) => (
                    <tr key={event.eventId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{event.eventName}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : "No date"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        ${event.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {event.ticketsSold}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {event.attendees}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.status === "PUBLISHED"
                            ? "bg-success/20 text-success"
                            : event.status === "DRAFT"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No events with revenue data yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create and publish events to start tracking revenue
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
