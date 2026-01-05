"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Ticket, Loader2, Percent } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function EarningsByEventPage() {
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>By Event</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings by Event</h1>
        <p className="text-muted-foreground mt-2">Commission breakdown per event</p>
      </div>

      {associatePositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No earnings data</p>
            <p className="text-sm text-muted-foreground mt-1">Your event earnings will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {associatePositions.map((position) => (
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
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        <span>{position.ticketsSold || 0} tickets sold</span>
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
                      <p className="text-xs text-muted-foreground">Commission Earned</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(position.commissionEarned || 0)}
                      </p>
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
