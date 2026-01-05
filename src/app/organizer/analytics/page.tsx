"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DollarSign, Ticket, Calendar, TrendingUp, Users, BarChart3, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const [chartDays, setChartDays] = useState(30);

  // Fetch analytics data from Convex
  const eventStats = useQuery(
    api.analytics.queries.getOrganizerEventStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const revenueStats = useQuery(
    api.analytics.queries.getOrganizerRevenueStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const ticketStats = useQuery(
    api.analytics.queries.getOrganizerTicketStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const attendeeStats = useQuery(
    api.analytics.queries.getOrganizerAttendeeStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const eventPerformance = useQuery(
    api.analytics.queries.getEventPerformanceBreakdown,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  // Time-series data for charts
  const revenueOverTime = useQuery(
    api.analytics.queries.getRevenueOverTime,
    currentUser?._id ? { organizerId: currentUser._id, days: chartDays } : "skip"
  );
  const ticketSalesOverTime = useQuery(
    api.analytics.queries.getTicketSalesOverTime,
    currentUser?._id ? { organizerId: currentUser._id, days: chartDays } : "skip"
  );

  // Check if still loading
  const isLoading = eventStats === undefined || revenueStats === undefined || ticketStats === undefined;

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading analytics..." />;
  }

  // Use real data from analytics queries
  const totalEvents = eventStats?.totalEvents ?? 0;
  const publishedEvents = eventStats?.publishedEvents ?? 0;
  const draftEvents = eventStats?.draftEvents ?? 0;

  // Get totals from real statistics
  const totalRevenue = revenueStats?.totalRevenue ?? 0;
  const totalTicketsSold = ticketStats?.totalTicketsSold ?? 0;
  const totalAttendees = attendeeStats?.totalAttendees ?? 0;
  const totalOrders = totalTicketsSold; // Approximation

  // Get event-specific data from performance breakdown
  const eventsWithStats = eventPerformance ?? [];

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your event performance and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Events</p>
          <p className="text-3xl font-bold text-foreground">{totalEvents}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {publishedEvents} published • {draftEvents} draft
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground">${(totalRevenue / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all events</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Tickets Sold</p>
          <p className="text-3xl font-bold text-foreground">{totalTicketsSold}</p>
          <p className="text-xs text-muted-foreground mt-1">Total tickets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Attendees</p>
          <p className="text-3xl font-bold text-foreground">{totalAttendees}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all events</p>
        </motion.div>
      </div>

      {/* Event Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Event Performance
          </h2>
        </div>

        {eventsWithStats.length > 0 ? (
          <div className="space-y-4">
            {eventsWithStats.map((event) => (
              <Link
                key={event.eventId}
                href={`/organizer/events/${event.eventId}`}
                className="block p-4 border border rounded-lg hover:bg-card transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{event.eventName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.status === "PUBLISHED" ? "Published" : event.status === "DRAFT" ? "Draft" : event.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-foreground">{event.ticketsSold}</p>
                      <p className="text-muted-foreground">Tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">${event.revenue.toFixed(2)}</p>
                      <p className="text-muted-foreground">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{event.attendees}</p>
                      <p className="text-muted-foreground">Attended</p>
                    </div>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No Published Events Yet</h3>
            <p className="text-muted-foreground mb-6">Publish your first event to start seeing analytics</p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Create Event
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Average Ticket Price</h3>
          <p className="text-3xl font-bold">
            ${totalTicketsSold > 0 ? (totalRevenue / totalTicketsSold / 100).toFixed(2) : "0.00"}
          </p>
          <p className="text-white/80 text-sm mt-2">Per ticket sold</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold">
            {totalOrders > 0 ? ((totalOrders / totalAttendees) * 100).toFixed(1) : "0"}%
          </p>
          <p className="text-white/80 text-sm mt-2">Orders to attendees</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-primary rounded-lg shadow-md p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Average Event Size</h3>
          <p className="text-3xl font-bold">
            {publishedEvents > 0 ? Math.round(totalAttendees / publishedEvents) : 0}
          </p>
          <p className="text-white/80 text-sm mt-2">Attendees per event</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              Revenue Over Time
            </h2>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setChartDays(days)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    chartDays === days
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          {revenueOverTime === undefined ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : revenueOverTime.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value as number)?.toFixed(2) ?? '0.00'}`, "Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No revenue data for this period</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Ticket Sales Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Ticket Sales Over Time
            </h2>
          </div>
          {ticketSalesOverTime === undefined ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : ticketSalesOverTime.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketSalesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [value ?? 0, "Tickets"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar dataKey="tickets" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No ticket sales for this period</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
