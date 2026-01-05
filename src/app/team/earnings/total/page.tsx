"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, Ticket, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function TotalEarningsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;
  const totalTicketsSold = staffDashboard?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const eventCount = staffDashboard?.filter(s => s.event).length || 0;
  const avgPerEvent = eventCount > 0 ? totalEarnings / eventCount : 0;

  const isLoading = staffDashboard === undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>Total Earnings</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Total Earnings</h1>
        <p className="text-muted-foreground mt-2">Your complete earnings summary</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold mt-1 text-success">
                  {isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}
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
                <p className="text-sm font-medium text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : totalTicketsSold}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Events</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : eventCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Event</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `$${(avgPerEvent / 100).toFixed(2)}`}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading earnings breakdown...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Earnings by Event</h3>
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
                        {position.event.startDate ? new Date(position.event.startDate).toLocaleDateString() : "TBD"} • {position.ticketsSold} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
