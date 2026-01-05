"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, CheckCircle, Clock, Loader2, Info } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function PayoutHistoryPage() {
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

  // Calculate totals
  const totalEarnings = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
  const cashCollected = associatePositions.reduce((sum, p) => sum + (p.cashCollected || 0), 0);
  const pendingPayout = totalEarnings - cashCollected;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>Payout History</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payout History</h1>
        <p className="text-muted-foreground mt-2">Your payment history and status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totalEarnings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Payout</p>
                <p className={`text-2xl font-bold mt-1 ${pendingPayout >= 0 ? "text-success" : "text-warning"}`}>
                  {formatCurrency(Math.abs(pendingPayout))}
                </p>
              </div>
              {pendingPayout >= 0 ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <Clock className="h-8 w-8 text-warning" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pendingPayout >= 0 ? "Owed to you" : "You owe (from cash sales)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events</p>
                <p className="text-2xl font-bold mt-1">{associatePositions.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Earnings by Event</h3>
          {associatePositions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payout history</p>
              <p className="text-sm mt-1">Your earnings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {associatePositions.map((position) => {
                const commission = position.commissionEarned || 0;
                const cash = position.cashCollected || 0;
                const net = commission - cash;

                return (
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
                          {position.ticketsSold || 0} tickets sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(commission)}
                      </p>
                      <p className="text-xs text-muted-foreground">Commission earned</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">About Payouts</h3>
              <p className="text-sm text-foreground mt-1">
                Commission is calculated based on your sales. If you collect cash for ticket sales,
                you&apos;ll need to submit that to your team member. Your net payout is your
                commission earned minus any cash you&apos;ve collected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
