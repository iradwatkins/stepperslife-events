"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, TrendingUp, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function CommissionRatePage() {
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

  // Calculate average commission for percentage-based positions
  const percentagePositions = associatePositions.filter(p => p.commissionType === "PERCENTAGE");
  const avgCommissionPercent = percentagePositions.length > 0
    ? percentagePositions.reduce((sum, p) => sum + (p.commissionValue || 0), 0) / percentagePositions.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>Commission Rate</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Commission Rates</h1>
        <p className="text-muted-foreground mt-2">Your commission rates by event</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Average Commission Rate</CardTitle>
          <CardDescription>Your overall commission percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Percent className="h-12 w-12 text-primary" />
            <div>
              <p className="text-4xl font-bold">{avgCommissionPercent.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Across all events</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission by Event</CardTitle>
          <CardDescription>Your commission rate for each event</CardDescription>
        </CardHeader>
        <CardContent>
          {associatePositions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No commission rates</p>
              <p className="text-sm mt-1">Get assigned to events to see your rates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {associatePositions.map((position) => (
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {position.commissionType === "PERCENTAGE"
                        ? `${position.commissionValue}%`
                        : position.commissionType === "FIXED"
                        ? formatCurrency(position.commissionValue || 0)
                        : "TBD"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {position.commissionType === "PERCENTAGE" ? "per ticket" : "per ticket"}
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
              <h3 className="font-semibold text-foreground">About Commission Rates</h3>
              <p className="text-sm text-foreground mt-1">
                Your commission rate is set by your team member and may vary by event. Higher sales performance may lead to better commission rates in the future.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
