"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Users } from "lucide-react";
import Link from "next/link";

export default function AvailableTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Filter to events with available tickets
  const eventsWithTickets = staffDashboard?.filter(
    (position) => position.event && position.ticketsRemaining > 0
  ) || [];

  const isLoading = staffDashboard === undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Available Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Available Tickets</h1>
        <p className="text-muted-foreground mt-2">Tickets ready to distribute to associates or sell</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tickets...</p>
          </CardContent>
        </Card>
      ) : eventsWithTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No available tickets</p>
            <p className="text-sm text-muted-foreground mt-2">All tickets have been sold or distributed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {eventsWithTickets.map((position) => position.event && (
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
                      <h3 className="text-xl font-semibold">{position.event.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          <span className="font-semibold text-foreground">{position.ticketsRemaining}</span> available of {position.allocatedTickets}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/team/my-associates">
                      <Users className="h-4 w-4 mr-2" />
                      Distribute
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
