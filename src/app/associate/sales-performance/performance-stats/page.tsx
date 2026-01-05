"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Zap, Award, Loader2 } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function PerformanceStatsPage() {
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

  // Calculate metrics
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const totalEarningsCents = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
  const totalEvents = associatePositions.length;
  const eventsWithSales = associatePositions.filter(p => (p.ticketsSold || 0) > 0).length;

  // Average commission per ticket (if any sales)
  const avgCommissionPerTicket = totalTicketsSold > 0
    ? Math.round(totalEarningsCents / totalTicketsSold)
    : 0;

  // Sales velocity - average tickets per event with sales
  const salesVelocity = eventsWithSales > 0
    ? (totalTicketsSold / eventsWithSales).toFixed(1)
    : "0";

  // Sell-through rate (tickets sold / tickets allocated)
  const totalAllocated = associatePositions.reduce((sum, p) => sum + (p.allocatedTickets || 0), 0);
  const sellThroughRate = totalAllocated > 0
    ? Math.round((totalTicketsSold / totalAllocated) * 100)
    : 0;

  // Milestones
  const milestones = [
    { name: "First Sale", description: "Make your first ticket sale", target: 1 },
    { name: "10 Ticket Milestone", description: "Sell 10 tickets", target: 10 },
    { name: "50 Ticket Achiever", description: "Sell 50 tickets", target: 50 },
    { name: "100 Ticket Champion", description: "Sell 100 tickets", target: 100 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/sales-performance" className="hover:text-foreground">Sales Performance</Link>
          <span>/</span>
          <span>Performance Stats</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Statistics</h1>
        <p className="text-muted-foreground mt-2">Detailed metrics and analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sell-Through Rate
            </CardTitle>
            <CardDescription>Tickets sold vs allocated</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{sellThroughRate}%</p>
            <p className="text-sm text-muted-foreground mt-2">
              {totalTicketsSold} of {totalAllocated} tickets sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sales Velocity
            </CardTitle>
            <CardDescription>Average sales per active event</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{salesVelocity}</p>
            <p className="text-sm text-muted-foreground mt-2">
              tickets/event
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>Detailed performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Total Tickets Sold</p>
                <p className="text-sm text-muted-foreground">All time sales</p>
              </div>
              <p className="text-2xl font-bold">{totalTicketsSold}</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Total Commission Earned</p>
                <p className="text-sm text-muted-foreground">All time earnings</p>
              </div>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalEarningsCents)}</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Avg Commission per Ticket</p>
                <p className="text-sm text-muted-foreground">Per ticket average</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(avgCommissionPerTicket)}</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Events Assigned</p>
                <p className="text-sm text-muted-foreground">Total events</p>
              </div>
              <p className="text-2xl font-bold">{totalEvents}</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Events with Sales</p>
                <p className="text-sm text-muted-foreground">Active selling events</p>
              </div>
              <p className="text-2xl font-bold">{eventsWithSales}</p>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Tickets Available</p>
                <p className="text-sm text-muted-foreground">Remaining inventory</p>
              </div>
              <p className="text-2xl font-bold">{totalAllocated - totalTicketsSold}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            Performance Milestones
          </CardTitle>
          <CardDescription>Your achievements and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const isAchieved = totalTicketsSold >= milestone.target;
              const progress = Math.min(totalTicketsSold, milestone.target);

              return (
                <div
                  key={milestone.name}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    isAchieved ? "bg-success/10 border-success/30" : "opacity-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isAchieved ? "bg-success/20" : "bg-muted"
                  }`}>
                    <Award className={`h-5 w-5 ${isAchieved ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                  <span className={`text-sm font-medium ${isAchieved ? "text-success" : "text-muted-foreground"}`}>
                    {progress}/{milestone.target}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
