"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Ticket, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function PastEventsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions with past events
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");
  const now = new Date();
  const pastEvents = associatePositions.filter(p => {
    if (!p.event?.startDate) return false;
    return new Date(p.event.startDate) <= now;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Past Events</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        <p className="text-muted-foreground mt-2">Your completed events and sales history</p>
      </div>

      {pastEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No past events</p>
            <p className="text-sm text-muted-foreground mt-1">Your completed events will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pastEvents.map((position) => (
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
                        <span className="px-2 py-1 text-xs rounded-full bg-muted text-foreground">
                          Completed
                        </span>
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
                        <span>
                          {position.ticketsSold || 0} of {position.allocatedTickets || 0} tickets sold
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tickets Sold</p>
                      <p className="text-xl font-bold text-success">{position.ticketsSold || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Earnings</p>
                      <p className="text-lg font-semibold text-success">
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
