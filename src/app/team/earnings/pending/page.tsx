"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";

export default function PendingPayoutsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;
  const totalCashCollected = staffDashboard?.reduce((sum, s) => sum + (s.cashCollected || 0), 0) || 0;
  const netPayout = totalEarnings - totalCashCollected;

  const isLoading = staffDashboard === undefined;

  // Events with pending payouts (positive net)
  const pendingEvents = staffDashboard?.filter(
    (position) => position.event && (position.commissionEarned - (position.cashCollected || 0)) > 0
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>Pending Payouts</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Payouts</h1>
        <p className="text-muted-foreground mt-2">Commission awaiting payout from organizers</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
              <p className="text-3xl font-bold mt-1 text-warning">
                {isLoading ? "..." : `$${(Math.max(0, netPayout) / 100).toFixed(2)}`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Awaiting settlement</p>
            </div>
            <Clock className="h-12 w-12 text-warning" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending payouts...</p>
          </CardContent>
        </Card>
      ) : pendingEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No pending payouts</p>
            <p className="text-sm text-muted-foreground mt-2">All earnings have been settled</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingEvents.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {position.event.startDate ? new Date(position.event.startDate).toLocaleDateString() : "TBD"}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${(position.commissionEarned / 100).toFixed(2)} earned
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning">
                      ${((position.commissionEarned - (position.cashCollected || 0)) / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
