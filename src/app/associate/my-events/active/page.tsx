"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ActiveEventsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions with future events
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");
  const now = new Date();
  const activeEvents = associatePositions.filter(p => {
    if (!p.event?.startDate) return false;
    return new Date(p.event.startDate) > now;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Active Events</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Active Events</h1>
        <p className="text-muted-foreground mt-2">Events you&apos;re currently selling tickets for</p>
      </div>

      {activeEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No active events</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeEvents.map((position) => (
            <Card key={position._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{position.event?.name || "Event"}</h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">
                            Active
                          </span>
                        </div>
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
                        <Clock className="h-4 w-4" />
                        <span>
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "Time TBD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-xl font-bold">{position.ticketsRemaining || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sold by You</p>
                      <p className="text-xl font-bold text-success">{position.ticketsSold || 0}</p>
                    </div>
                  </div>

                  <Link
                    href={`/associate/my-ticket-link/copy-link`}
                    className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Get Ticket Link
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
