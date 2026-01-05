"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Users,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "thisMonth" | "lastMonth" | "all";

export default function RevenueReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Get days from date range
  const getDays = () => {
    switch (dateRange) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      default:
        return 365; // For thisMonth, lastMonth, all - get more data
    }
  };

  // Get organizerId as Convex Id type
  const organizerId = user?._id as Id<"users"> | undefined;

  // Queries
  const revenueStats = useQuery(
    api.analytics.queries.getOrganizerRevenueStats,
    organizerId ? { organizerId } : "skip"
  );
  const ticketStats = useQuery(
    api.analytics.queries.getOrganizerTicketStats,
    organizerId ? { organizerId } : "skip"
  );
  const attendeeStats = useQuery(
    api.analytics.queries.getOrganizerAttendeeStats,
    organizerId ? { organizerId } : "skip"
  );
  const revenueOverTime = useQuery(
    api.analytics.queries.getRevenueOverTime,
    organizerId ? { organizerId, days: getDays() } : "skip"
  );
  const ticketSalesOverTime = useQuery(
    api.analytics.queries.getTicketSalesOverTime,
    organizerId ? { organizerId, days: getDays() } : "skip"
  );
  const eventPerformance = useQuery(
    api.analytics.queries.getEventPerformanceBreakdown,
    organizerId ? { organizerId } : "skip"
  );

  const isLoading =
    !revenueStats ||
    !ticketStats ||
    !attendeeStats ||
    !revenueOverTime ||
    !ticketSalesOverTime ||
    !eventPerformance;

  // Calculate period comparison (previous period vs current)
  const calculateGrowth = () => {
    if (!revenueOverTime || revenueOverTime.length < 2) return 0;
    const midpoint = Math.floor(revenueOverTime.length / 2);
    const firstHalf = revenueOverTime.slice(0, midpoint);
    const secondHalf = revenueOverTime.slice(midpoint);

    const firstHalfTotal = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfTotal = secondHalf.reduce((sum, d) => sum + d.revenue, 0);

    if (firstHalfTotal === 0) return secondHalfTotal > 0 ? 100 : 0;
    return Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100);
  };

  const revenueGrowth = calculateGrowth();

  // Export to CSV
  const exportToCSV = () => {
    if (!eventPerformance) return;

    const headers = ["Event Name", "Status", "Revenue", "Tickets Sold", "Attendees", "Date"];
    const rows = eventPerformance.map((e) => [
      e.eventName,
      e.status,
      `$${e.revenue.toFixed(2)}`,
      e.ticketsSold,
      e.attendees,
      e.startDate ? format(e.startDate, "yyyy-MM-dd") : "N/A",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple bar chart using divs
  const maxRevenue = Math.max(...(revenueOverTime?.map((d) => d.revenue) || [1]));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/organizer/earnings"
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Earnings
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              Analyze your event performance and revenue trends
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="mt-1 text-2xl font-bold">
                      {revenueStats?.totalRevenueFormatted || "$0.00"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      "bg-green-100"
                    )}
                  >
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  {revenueGrowth >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                      <span className="text-green-600">+{revenueGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                      <span className="text-red-600">{revenueGrowth}%</span>
                    </>
                  )}
                  <span className="ml-1 text-gray-500">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                    <p className="mt-1 text-2xl font-bold">
                      {ticketStats?.totalTicketsSold?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Across {Object.keys(ticketStats?.ticketsByEvent || {}).length} events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendees</p>
                    <p className="mt-1 text-2xl font-bold">
                      {attendeeStats?.totalAttendees?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {ticketStats?.totalTicketsSold
                    ? Math.round(
                        ((attendeeStats?.totalAttendees || 0) / ticketStats.totalTicketsSold) * 100
                      )
                    : 0}
                  % attendance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Revenue/Event</p>
                    <p className="mt-1 text-2xl font-bold">
                      $
                      {eventPerformance && eventPerformance.length > 0
                        ? (
                            eventPerformance.reduce((sum, e) => sum + e.revenue, 0) /
                            eventPerformance.length
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {eventPerformance?.length || 0} total events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="revenue" className="mb-8">
            <TabsList>
              <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
              <TabsTrigger value="tickets">Ticket Sales</TabsTrigger>
              <TabsTrigger value="breakdown">Event Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueOverTime && revenueOverTime.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex h-64 items-end gap-1">
                        {revenueOverTime.slice(-30).map((dataPoint, i) => (
                          <div
                            key={i}
                            className="flex-1 group relative"
                            title={`${dataPoint.date}: $${dataPoint.revenue.toFixed(2)}`}
                          >
                            <div
                              className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                              style={{
                                height: `${(dataPoint.revenue / maxRevenue) * 100}%`,
                                minHeight: dataPoint.revenue > 0 ? "4px" : "0",
                              }}
                            />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              ${dataPoint.revenue.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {revenueOverTime.length > 0
                            ? format(new Date(revenueOverTime[0].date), "MMM d")
                            : ""}
                        </span>
                        <span>
                          {revenueOverTime.length > 0
                            ? format(
                                new Date(revenueOverTime[revenueOverTime.length - 1].date),
                                "MMM d"
                              )
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-500">
                      <p>No revenue data for selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Ticket Sales Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketSalesOverTime && ticketSalesOverTime.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex h-64 items-end gap-1">
                        {(() => {
                          const maxTickets = Math.max(
                            ...ticketSalesOverTime.map((d) => d.tickets)
                          );
                          return ticketSalesOverTime.slice(-30).map((dataPoint, i) => (
                            <div
                              key={i}
                              className="flex-1 group relative"
                              title={`${dataPoint.date}: ${dataPoint.tickets} tickets`}
                            >
                              <div
                                className="w-full bg-purple-500 hover:bg-purple-600 transition-colors rounded-t"
                                style={{
                                  height: `${(dataPoint.tickets / maxTickets) * 100}%`,
                                  minHeight: dataPoint.tickets > 0 ? "4px" : "0",
                                }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {dataPoint.tickets} tickets
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {ticketSalesOverTime.length > 0
                            ? format(new Date(ticketSalesOverTime[0].date), "MMM d")
                            : ""}
                        </span>
                        <span>
                          {ticketSalesOverTime.length > 0
                            ? format(
                                new Date(
                                  ticketSalesOverTime[ticketSalesOverTime.length - 1].date
                                ),
                                "MMM d"
                              )
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-500">
                      <p>No ticket sales data for selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Revenue by Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueStats &&
                  Object.keys(revenueStats.revenueByEvent).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(revenueStats.revenueByEvent)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([eventName, revenue], i) => {
                          const percentage =
                            (revenue / revenueStats.totalRevenue) * 100;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="truncate max-w-[200px]">{eventName}</span>
                                <span className="font-medium">
                                  ${(revenue / 100).toFixed(2)} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-blue-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-500">
                      <p>No event revenue data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Event Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Event</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                      <th className="pb-3 font-medium text-right">Tickets</th>
                      <th className="pb-3 font-medium text-right">Attendees</th>
                      <th className="pb-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {eventPerformance && eventPerformance.length > 0 ? (
                      eventPerformance.map((event, i) => (
                        <tr key={i} className="text-sm">
                          <td className="py-3">
                            <Link
                              href={`/organizer/events/${event.eventId}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {event.eventName}
                            </Link>
                          </td>
                          <td className="py-3">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                event.status === "PUBLISHED"
                                  ? "bg-green-100 text-green-700"
                                  : event.status === "DRAFT"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium">
                            ${event.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 text-right">{event.ticketsSold}</td>
                          <td className="py-3 text-right">{event.attendees}</td>
                          <td className="py-3 text-right text-gray-500">
                            {event.startDate
                              ? format(event.startDate, "MMM d, yyyy")
                              : "N/A"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No events found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
