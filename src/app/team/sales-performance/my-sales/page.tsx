"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

export default function MySalesPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  const totalSold = staffDashboard?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/sales-performance" className="hover:text-foreground">Performance</Link>
          <span>/</span>
          <span>My Sales</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">My Sales</h1>
        <p className="text-muted-foreground mt-2">Your personal sales breakdown</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets Sold</p>
                <p className="text-3xl font-bold mt-1">{isLoading ? "..." : totalSold}</p>
              </div>
              <Ticket className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-3xl font-bold text-success mt-1">
                  {isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sales...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Sales by Event</h3>
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
                        {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{position.ticketsSold} sold</p>
                    <p className="text-sm text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sales yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
