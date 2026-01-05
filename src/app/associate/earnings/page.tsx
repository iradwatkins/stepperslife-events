"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Percent, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AssociateEarningsPage() {
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

  // Calculate aggregate metrics from real data
  const totalEarningsCents = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);

  // Calculate average commission percentage (if using percentage-based commission)
  const percentagePositions = associatePositions.filter(p => p.commissionType === "PERCENTAGE");
  const avgCommissionPercent = percentagePositions.length > 0
    ? percentagePositions.reduce((sum, p) => sum + (p.commissionValue || 0), 0) / percentagePositions.length
    : 0;

  // Calculate net payout (commission earned minus cash collected that needs to be turned in)
  const cashCollected = associatePositions.reduce((sum, p) => sum + (p.cashCollected || 0), 0);
  const pendingPayout = totalEarningsCents - cashCollected;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground mt-2">Track your commission and payouts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalEarningsCents)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTicketsSold}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingPayout >= 0 ? "text-success" : "text-warning"}`}>
              {formatCurrency(Math.abs(pendingPayout))}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayout >= 0 ? "Owed to you" : "You owe"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Commission</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCommissionPercent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Per ticket</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/earnings/total">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Total Earnings</CardTitle>
                    <CardDescription className="mt-1">Lifetime stats</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/earnings/by-event">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">By Event</CardTitle>
                    <CardDescription className="mt-1">Event breakdown</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/earnings/commission-rate">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Commission Rate</CardTitle>
                    <CardDescription className="mt-1">Your rates</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/earnings/payout-history">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Payout History</CardTitle>
                    <CardDescription className="mt-1">Past payouts</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings by Event</CardTitle>
          <CardDescription>Your commission breakdown by event</CardDescription>
        </CardHeader>
        <CardContent>
          {associatePositions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings yet</p>
              <p className="text-sm mt-1">Start selling tickets to earn commission</p>
            </div>
          ) : (
            <div className="space-y-4">
              {associatePositions.map((position) => (
                <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {position.event?.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{position.event?.name || "Event"}</p>
                      <p className="text-sm text-muted-foreground">
                        {position.ticketsSold || 0} tickets sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(position.commissionEarned || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {position.commissionType === "PERCENTAGE"
                        ? `${position.commissionValue}% commission`
                        : position.commissionType === "FIXED"
                        ? `${formatCurrency(position.commissionValue || 0)} per ticket`
                        : "Commission"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
