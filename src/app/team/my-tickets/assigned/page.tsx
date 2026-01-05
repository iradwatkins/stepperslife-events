"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, Calendar } from "lucide-react";
import Link from "next/link";

export default function AssignedTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  // For each event position, we could show sub-sellers if we had that data
  // For now, we show ticket distribution per event
  const eventsWithAssignments = staffDashboard?.filter(
    (position) => position.event && position.allocatedTickets > 0
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Assigned to Associates</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Assigned to Associates</h1>
        <p className="text-muted-foreground mt-2">Tickets distributed to your associates</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assignments...</p>
          </CardContent>
        </Card>
      ) : eventsWithAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets assigned yet</p>
            <p className="text-sm text-muted-foreground mt-2">Distributed tickets will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventsWithAssignments.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{position.event.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{position.allocatedTickets} total</p>
                    <p className="text-sm text-muted-foreground">
                      {position.ticketsRemaining} remaining • {position.ticketsSold} sold
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Allocation Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {position.ticketsSold} sold • {position.ticketsRemaining} available
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
