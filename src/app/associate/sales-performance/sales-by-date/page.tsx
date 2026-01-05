"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Ticket, Loader2, DollarSign } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function SalesByDatePage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");

  // Group sales by event date for timeline view
  const salesByEventDate = associatePositions
    .filter(p => p.event?.startDate && (p.ticketsSold || 0) > 0)
    .sort((a, b) => {
      const dateA = new Date(a.event?.startDate || 0).getTime();
      const dateB = new Date(b.event?.startDate || 0).getTime();
      return dateB - dateA; // Most recent first
    });

  // Calculate metrics
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const eventsWithSales = salesByEventDate.length;
  const bestEventSales = associatePositions.reduce((max, p) => Math.max(max, p.ticketsSold || 0), 0);
  const avgPerEvent = eventsWithSales > 0 ? Math.round(totalTicketsSold / eventsWithSales) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/sales-performance" className="hover:text-foreground">Sales Performance</Link>
          <span>/</span>
          <span>Sales by Date</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sales by Date</h1>
        <p className="text-muted-foreground mt-2">Track your sales performance by event</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Event</p>
                <p className="text-2xl font-bold mt-1 text-success">{bestEventSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Peak sales for one event</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Event</p>
                <p className="text-2xl font-bold mt-1">{avgPerEvent}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average tickets per event</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events with Sales</p>
                <p className="text-2xl font-bold mt-1">{eventsWithSales}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active events</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Timeline</CardTitle>
          <CardDescription>Your sales activity by event date</CardDescription>
        </CardHeader>
        <CardContent>
          {salesByEventDate.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sales data yet</p>
              <p className="text-sm mt-1">Your sales timeline will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesByEventDate.map((position) => (
                <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {position.event?.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{position.event?.name || "Event"}</p>
                      <p className="text-sm text-muted-foreground">
                        {position.event?.startDate
                          ? new Date(position.event.startDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : "Date TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success">{position.ticketsSold || 0}</p>
                    <p className="text-xs text-muted-foreground">tickets sold</p>
                    <p className="text-sm font-medium text-success mt-1">
                      {formatCurrency(position.commissionEarned || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Sales Insights</h3>
              <p className="text-sm text-foreground mt-1">
                Consistent sales activity helps build momentum. Share your referral links early and often for each event to maximize your ticket sales and commissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
