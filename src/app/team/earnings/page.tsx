"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";

export default function TeamMemberEarningsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Calculate totals from all staff positions
  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;
  const totalCashCollected = staffDashboard?.reduce((sum, s) => sum + (s.cashCollected || 0), 0) || 0;
  const netPayout = totalEarnings - totalCashCollected;

  const isLoading = staffDashboard === undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground mt-2">Track your commission earnings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}</div>
            <p className="text-xs text-muted-foreground">All time commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `$${(totalCashCollected / 100).toFixed(2)}`}</div>
            <p className="text-xs text-muted-foreground">In-person payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
            <TrendingUp className={`h-4 w-4 ${netPayout >= 0 ? "text-success" : "text-warning"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netPayout >= 0 ? "text-success" : "text-warning"}`}>
              {isLoading ? "..." : `$${(netPayout / 100).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {netPayout >= 0 ? "Owed to you" : "You owe organizer"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/earnings/total">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Total Earnings</CardTitle>
                    <CardDescription className="mt-1">${(totalEarnings / 100).toFixed(2)}</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/earnings/by-event">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">By Event</CardTitle>
                    <CardDescription className="mt-1">View breakdown</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/earnings/payouts">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Payout History</CardTitle>
                    <CardDescription className="mt-1">View payments</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/earnings/pending">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Pending Payouts</CardTitle>
                    <CardDescription className="mt-1">${(Math.max(0, netPayout) / 100).toFixed(2)}</CardDescription>
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
          <CardDescription>Your commission earnings breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading earnings...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-3">
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
                        {position.ticketsSold} tickets sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {position.commissionType === "PERCENTAGE"
                        ? `${position.commissionValue || 0}% commission`
                        : `$${((position.commissionValue || 0) / 100).toFixed(2)} per ticket`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings yet</p>
              <p className="text-sm mt-2">Start selling tickets to earn commission</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
