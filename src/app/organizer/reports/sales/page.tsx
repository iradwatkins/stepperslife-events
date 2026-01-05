"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { BarChart3, ArrowLeft, TrendingUp, Download, Calendar, DollarSign, Ticket, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState<number>(30);
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const revenueStats = useQuery(
    api.analytics.queries.getOrganizerRevenueStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const ticketStats = useQuery(
    api.analytics.queries.getOrganizerTicketStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const revenueOverTime = useQuery(
    api.analytics.queries.getRevenueOverTime,
    currentUser?._id ? { organizerId: currentUser._id, days: dateRange } : "skip"
  );

  const ticketSalesOverTime = useQuery(
    api.analytics.queries.getTicketSalesOverTime,
    currentUser?._id ? { organizerId: currentUser._id, days: dateRange } : "skip"
  );

  const eventPerformance = useQuery(
    api.analytics.queries.getEventPerformanceBreakdown,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const isLoading = currentUser === undefined || revenueStats === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sales reports...</p>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view sales reports.</p>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!eventPerformance) return;

    const headers = ["Event Name", "Status", "Revenue", "Tickets Sold", "Attendees", "Date"];
    const rows = eventPerformance.map((e) => [
      e.eventName,
      e.status,
      `$${e.revenue.toFixed(2)}`,
      e.ticketsSold.toString(),
      e.attendees.toString(),
      e.startDate ? new Date(e.startDate).toLocaleDateString() : "N/A",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-card">
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
                href="/organizer/reports"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
                <p className="text-muted-foreground mt-1">Analyze your ticket sales performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
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
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {revenueStats?.totalRevenueFormatted || "$0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold text-foreground">
                  {ticketStats?.totalTicketsSold?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {eventPerformance?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Event</p>
                <p className="text-2xl font-bold text-foreground">
                  ${eventPerformance && eventPerformance.length > 0
                    ? (eventPerformance.reduce((sum, e) => sum + e.revenue, 0) / eventPerformance.length).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Revenue Over Time
          </h3>
          {revenueOverTime && revenueOverTime.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {revenueOverTime.map((point, i) => {
                const maxRevenue = Math.max(...revenueOverTime.map((p) => p.revenue));
                const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center group"
                    title={`${point.date}: $${point.revenue.toFixed(2)}`}
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {i % Math.ceil(revenueOverTime.length / 7) === 0 && (
                      <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                        {point.date.slice(5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No revenue data for this period
            </div>
          )}
        </motion.div>

        {/* Event Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Event Performance</h3>
          </div>
          {eventPerformance && eventPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Event Name</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Revenue</th>
                    <th className="text-right p-4 font-medium">Tickets Sold</th>
                    <th className="text-right p-4 font-medium">Check-ins</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {eventPerformance.map((event) => (
                    <tr key={event.eventId} className="border-t hover:bg-muted/30">
                      <td className="p-4 font-medium">{event.eventName}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            event.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : event.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium">${event.revenue.toFixed(2)}</td>
                      <td className="p-4 text-right">{event.ticketsSold}</td>
                      <td className="p-4 text-right">{event.attendees}</td>
                      <td className="p-4 text-muted-foreground">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No events found. Create an event to start tracking sales.
            </div>
          )}
        </motion.div>

        {/* Revenue by Event Breakdown */}
        {revenueStats?.revenueByEvent && Object.keys(revenueStats.revenueByEvent).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Revenue by Event</h3>
            <div className="space-y-3">
              {Object.entries(revenueStats.revenueByEvent)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([eventName, revenue]) => {
                  const percentage = revenueStats.totalRevenue > 0
                    ? ((revenue as number) / revenueStats.totalRevenue) * 100
                    : 0;
                  return (
                    <div key={eventName}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{eventName}</span>
                        <span>${((revenue as number) / 100).toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
