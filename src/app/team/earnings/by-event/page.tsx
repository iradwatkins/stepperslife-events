"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Ticket } from "lucide-react";
import Link from "next/link";

export default function EarningsByEventPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  // Sort by commission earned (highest first)
  const sortedPositions = staffDashboard
    ?.filter((position) => position.event)
    ?.sort((a, b) => b.commissionEarned - a.commissionEarned) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/earnings" className="hover:text-foreground">Earnings</Link>
          <span>/</span>
          <span>By Event</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings by Event</h1>
        <p className="text-muted-foreground mt-2">Detailed breakdown of earnings per event</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading earnings...</p>
          </CardContent>
        </Card>
      ) : sortedPositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No event earnings yet</p>
            <p className="text-sm text-muted-foreground mt-2">Event earnings will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedPositions.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{position.event.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {position.event.startDate ? new Date(position.event.startDate).toLocaleDateString() : "TBD"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {position.ticketsSold} tickets sold
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success">
                      ${(position.commissionEarned / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {position.commissionType === "PERCENTAGE"
                        ? `${position.commissionValue || 0}% commission`
                        : `$${((position.commissionValue || 0) / 100).toFixed(2)} per ticket`
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Allocated</p>
                    <p className="font-semibold">{position.allocatedTickets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="font-semibold">{position.ticketsRemaining}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Collected</p>
                    <p className="font-semibold">${((position.cashCollected || 0) / 100).toFixed(2)}</p>
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
