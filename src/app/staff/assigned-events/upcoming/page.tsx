"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UpcomingEventsPage() {
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);

  // Filter for upcoming events (after today)
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

  const events = (staffEvents || []).filter((event) => {
    return (event.eventDate ?? 0) >= todayEnd;
  });

  // Loading state
  if (staffEvents === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDaysUntil = (timestamp: number) => {
    const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/assigned-events" className="hover:text-foreground">
            My Assigned Events
          </Link>
          <span>/</span>
          <span>Upcoming</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
        <p className="text-muted-foreground mt-2">
          Future events you're assigned to staff
        </p>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No upcoming events</p>
            <p className="text-sm text-muted-foreground mt-2">
              New event assignments will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventDate = new Date(event.eventDate ?? 0);
            return (
              <Card key={event.staffId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-20 h-20 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold">
                        {eventDate.getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {eventDate.toLocaleString("en-US", {
                          month: "short",
                        })}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold">{event.eventName}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-block px-2 py-1 bg-info/20 text-foreground text-xs font-medium rounded">
                              {getDaysUntil(event.eventDate ?? 0)}
                            </span>
                            <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                              {event.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.eventDate ?? 0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatTime(event.eventDate ?? 0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {event.allocatedTickets} tickets allocated
                        </div>
                        {event.ticketsSold > 0 && (
                          <div className="flex items-center gap-2">
                            <span>{event.ticketsSold} sold</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
