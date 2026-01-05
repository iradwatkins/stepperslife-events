"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, DollarSign } from "lucide-react";
import Link from "next/link";

export default function PayoutHistoryPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const totalCashCollected = staffDashboard?.reduce((sum, s) => sum + (s.cashCollected || 0), 0) || 0;
  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;

  const isLoading = staffDashboard === undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>Payout History</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payout History</h1>
        <p className="text-muted-foreground mt-2">Your cash collection and settlement history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash Collected</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `$${(totalCashCollected / 100).toFixed(2)}`}</p>
                <p className="text-sm text-muted-foreground mt-1">In-person payments received</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}</p>
                <p className="text-sm text-muted-foreground mt-1">All-time earnings</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Settlement Summary by Event</h3>
              {staffDashboard.map((position) => position.event && (
                <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{position.event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Commission: ${(position.commissionEarned / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Cash: ${((position.cashCollected || 0) / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Net: ${((position.commissionEarned - (position.cashCollected || 0)) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payout history yet</p>
              <p className="text-sm mt-2">Settlement history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
