"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar, DollarSign, Loader2, Percent } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function TicketsSoldPage() {
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

  // Calculate aggregate metrics
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const totalEarningsCents = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);

  // Calculate this month's sales
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPositions = associatePositions.filter(p => {
    if (!p.event?.startDate) return false;
    return new Date(p.event.startDate) >= thisMonthStart;
  });
  const thisMonthSales = thisMonthPositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);

  // Positions with sales for detailed view
  const positionsWithData = associatePositions.filter(p => (p.allocatedTickets || 0) > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/sales-performance" className="hover:text-foreground">Sales Performance</Link>
          <span>/</span>
          <span>Tickets Sold</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets Sold</h1>
        <p className="text-muted-foreground mt-2">Detailed breakdown of your ticket sales</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sold</p>
                <p className="text-2xl font-bold mt-1 text-success">{totalTicketsSold}</p>
              </div>
              <Ticket className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold mt-1">{thisMonthSales}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totalEarningsCents)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {positionsWithData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your sales will appear here once you're assigned tickets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {positionsWithData.map((position) => (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{position.event?.name || "Event"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        <span>{position.ticketsSold || 0} of {position.allocatedTickets || 0} tickets sold</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <span>
                          {position.commissionType === "PERCENTAGE"
                            ? `${position.commissionValue}% commission`
                            : position.commissionType === "FIXED"
                            ? `${formatCurrency(position.commissionValue || 0)} per ticket`
                            : "Commission TBD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tickets Sold</p>
                      <p className="text-xl font-bold">{position.ticketsSold || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commission Earned</p>
                      <p className="text-lg font-semibold text-success">{formatCurrency(position.commissionEarned || 0)}</p>
                    </div>
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
