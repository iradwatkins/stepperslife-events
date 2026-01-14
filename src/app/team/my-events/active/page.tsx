"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ActiveEventsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  // Filter to upcoming events
  const [now] = useState(() => Date.now());
  const activeEvents = useMemo(() => staffDashboard?.filter(
    (position) => position.event && (position.event.startDate ?? 0) >= now
  ) || [], [staffDashboard, now]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Active Events</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Active Events</h1>
        <p className="text-muted-foreground mt-2">Upcoming events you can sell tickets for</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </CardContent>
        </Card>
      ) : activeEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No active events</p>
            <p className="text-sm text-muted-foreground mt-2">Contact organizers to get assigned to events</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeEvents.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <Image
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{position.event.name}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(position.event.startDate ?? 0).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Allocated</p>
                    <p className="text-xl font-semibold">{position.allocatedTickets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-xl font-semibold text-primary">{position.ticketsRemaining}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sold</p>
                    <p className="text-xl font-semibold text-success">{position.ticketsSold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Earned</p>
                    <p className="text-xl font-semibold text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
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
