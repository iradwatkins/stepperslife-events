"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AssignedEventsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);

  // Categorize events by date
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const todayEvents = (staffEvents || []).filter((event) => {
    const eventDate = event.eventDate ?? 0;
    return eventDate >= todayStart && eventDate < todayEnd;
  });

  const upcomingEvents = (staffEvents || []).filter((event) => {
    return (event.eventDate ?? 0) >= todayEnd;
  });

  const pastEvents = (staffEvents || []).filter((event) => {
    return (event.eventDate ?? 0) < todayStart;
  });

  // Loading state
  if (staffEvents === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assigned Events</h1>
        <p className="text-muted-foreground mt-2">
          Events you're assigned to staff
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Future events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastEvents.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links to Subpages */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/assigned-events/today">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Today</CardTitle>
                    <CardDescription className="mt-1">
                      {todayEvents.length} events
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/assigned-events/upcoming">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Upcoming</CardTitle>
                    <CardDescription className="mt-1">
                      {upcomingEvents.length} events
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/staff/assigned-events/past">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Past Events</CardTitle>
                    <CardDescription className="mt-1">
                      {pastEvents.length} events
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* All Events */}
      <Card>
        <CardHeader>
          <CardTitle>All Assigned Events</CardTitle>
          <CardDescription>Complete list of your event assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {staffEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events assigned</p>
              <p className="text-sm mt-2">Check back later for event assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffEvents.map((event) => {
                const eventDate = new Date(event.eventDate ?? 0);
                const isPast = (event.eventDate ?? 0) < todayStart;
                const isToday = (event.eventDate ?? 0) >= todayStart && (event.eventDate ?? 0) < todayEnd;

                return (
                  <div
                    key={event.staffId}
                    className={`p-4 rounded-lg border ${isPast ? "bg-muted/50" : isToday ? "bg-primary/5 border-primary/20" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{event.eventName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {eventDate.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {event.role}
                          </span>
                          {isToday && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                              Today
                            </span>
                          )}
                          {isPast && (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Tickets</div>
                        <div className="font-medium">
                          {event.ticketsSold} / {event.allocatedTickets}
                        </div>
                        {event.commissionEarned > 0 && (
                          <div className="text-green-600 text-xs mt-1">
                            ${event.commissionEarned.toFixed(2)} earned
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
