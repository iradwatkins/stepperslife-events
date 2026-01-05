"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Users, ArrowLeft, Download, Calendar, Percent, UserCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendeeReportsPage() {
  const [dateRange, setDateRange] = useState<number>(30);
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const attendeeStats = useQuery(
    api.analytics.queries.getOrganizerAttendeeStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const ticketStats = useQuery(
    api.analytics.queries.getOrganizerTicketStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const eventPerformance = useQuery(
    api.analytics.queries.getEventPerformanceBreakdown,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const ticketSalesOverTime = useQuery(
    api.analytics.queries.getTicketSalesOverTime,
    currentUser?._id ? { organizerId: currentUser._id, days: dateRange } : "skip"
  );

  const isLoading = currentUser === undefined || attendeeStats === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading attendee reports...</p>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view attendee reports.</p>
        </div>
      </div>
    );
  }

  const totalTicketsSold = ticketStats?.totalTicketsSold || 0;
  const totalAttendees = attendeeStats?.totalAttendees || 0;
  const checkInRate = totalTicketsSold > 0 ? ((totalAttendees / totalTicketsSold) * 100).toFixed(1) : "0.0";

  const handleExportCSV = () => {
    if (!eventPerformance) return;

    const headers = ["Event Name", "Status", "Tickets Sold", "Check-ins", "Check-in Rate", "Date"];
    const rows = eventPerformance.map((e) => {
      const rate = e.ticketsSold > 0 ? ((e.attendees / e.ticketsSold) * 100).toFixed(1) : "0.0";
      return [
        e.eventName,
        e.status,
        e.ticketsSold.toString(),
        e.attendees.toString(),
        `${rate}%`,
        e.startDate ? new Date(e.startDate).toLocaleDateString() : "N/A",
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendee-report-${new Date().toISOString().split("T")[0]}.csv`;
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
                <h1 className="text-3xl font-bold text-foreground">Attendee Reports</h1>
                <p className="text-muted-foreground mt-1">Track attendance and check-in rates</p>
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalTicketsSold.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalAttendees.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in Rate</p>
                <p className="text-2xl font-bold text-foreground">{checkInRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {eventPerformance?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ticket Sales Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ticket Sales Over Time
          </h3>
          {ticketSalesOverTime && ticketSalesOverTime.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {ticketSalesOverTime.map((point, i) => {
                const maxTickets = Math.max(...ticketSalesOverTime.map((p) => p.tickets));
                const height = maxTickets > 0 ? (point.tickets / maxTickets) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center group"
                    title={`${point.date}: ${point.tickets} tickets`}
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {i % Math.ceil(ticketSalesOverTime.length / 7) === 0 && (
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
              No ticket sales data for this period
            </div>
          )}
        </motion.div>

        {/* Event Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Event Attendance</h3>
          </div>
          {eventPerformance && eventPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Event Name</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Tickets Sold</th>
                    <th className="text-right p-4 font-medium">Check-ins</th>
                    <th className="text-right p-4 font-medium">Check-in Rate</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {eventPerformance.map((event) => {
                    const rate =
                      event.ticketsSold > 0
                        ? ((event.attendees / event.ticketsSold) * 100).toFixed(1)
                        : "0.0";
                    return (
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
                        <td className="p-4 text-right">{event.ticketsSold}</td>
                        <td className="p-4 text-right">{event.attendees}</td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-medium ${
                              parseFloat(rate) >= 80
                                ? "text-green-600"
                                : parseFloat(rate) >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No events found. Create an event to start tracking attendance.
            </div>
          )}
        </motion.div>

        {/* Attendance by Event Breakdown */}
        {attendeeStats?.attendeesByEvent &&
          Object.keys(attendeeStats.attendeesByEvent).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Check-ins by Event</h3>
              <div className="space-y-3">
                {Object.entries(attendeeStats.attendeesByEvent)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([eventName, attendees]) => {
                    const percentage =
                      totalAttendees > 0 ? ((attendees as number) / totalAttendees) * 100 : 0;
                    return (
                      <div key={eventName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{eventName}</span>
                          <span>{(attendees as number).toLocaleString()} check-ins</span>
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
