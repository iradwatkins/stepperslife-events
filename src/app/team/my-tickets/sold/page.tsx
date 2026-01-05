"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, DollarSign, Ticket } from "lucide-react";
import Link from "next/link";

export default function SoldTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Calculate totals
  const totalSold = staffDashboard?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;
  const eventCount = staffDashboard?.filter(s => s.event && s.ticketsSold > 0).length || 0;
  const avgPerEvent = eventCount > 0 ? Math.round(totalSold / eventCount) : 0;

  const isLoading = staffDashboard === undefined;

  // Filter to events with sales
  const eventsWithSales = staffDashboard?.filter(
    (position) => position.event && position.ticketsSold > 0
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Sold Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sold Tickets</h1>
        <p className="text-muted-foreground mt-2">Complete sales history across all events</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sold</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : totalSold}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Event</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : avgPerEvent}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sales history...</p>
          </CardContent>
        </Card>
      ) : eventsWithSales.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No sales yet</p>
            <p className="text-sm text-muted-foreground mt-2">Sold tickets will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventsWithSales.map((position) => position.event && (
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
                          {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {position.allocatedTickets} allocated
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{position.ticketsSold} sold</p>
                    <p className="text-sm text-muted-foreground">${(position.commissionEarned / 100).toFixed(2)} earned</p>
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
