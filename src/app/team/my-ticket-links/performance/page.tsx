"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Link as LinkIcon, Ticket, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function LinkPerformancePage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  const totalClicks = 0; // Would need analytics tracking
  const totalConversions = staffDashboard?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const totalRevenue = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-ticket-links" className="hover:text-foreground">My Links</Link>
          <span>/</span>
          <span>Performance</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Link Performance</h1>
        <p className="text-muted-foreground mt-2">Track how your referral links are performing</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : totalConversions}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {isLoading ? "..." : `$${(totalRevenue / 100).toFixed(2)}`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Links</p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? "..." : staffDashboard?.filter(s => s.referralCode).length || 0}
                </p>
              </div>
              <LinkIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading performance data...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Performance by Event</h3>
              {staffDashboard.map((position) => position.event && position.referralCode && (
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
                      <p className="text-sm text-muted-foreground font-mono">
                        ref={position.referralCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{position.ticketsSold} sales</p>
                    <p className="text-sm text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance data yet</p>
              <p className="text-sm mt-2">Sales through your links will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
