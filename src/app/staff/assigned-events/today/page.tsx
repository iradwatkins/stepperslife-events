"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, QrCode, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TodayEventsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);

  // Filter for today's events
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const events = (staffEvents || []).filter((event) => {
    return (event.eventDate ?? 0) >= todayStart && (event.eventDate ?? 0) < todayEnd;
  });

  // Loading state
  if (staffEvents === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
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
          <span>Today</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Today's Events</h1>
        <p className="text-muted-foreground mt-2">
          Events you're staffing today
        </p>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No events today</p>
            <p className="text-sm text-muted-foreground mt-2">
              Enjoy your day off!
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
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold">{event.eventName}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-success/20 text-success text-sm font-medium rounded-full">
                              Active
                            </span>
                            <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                              {event.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(event.eventDate ?? 0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.allocatedTickets} tickets allocated</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span>{event.ticketsSold} sold</span>
                        </div>
                        {event.commissionEarned > 0 && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <span>${event.commissionEarned.toFixed(2)} earned</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button asChild>
                          <Link href="/staff/scan-tickets">
                            <QrCode className="h-4 w-4 mr-2" />
                            Start Scanning
                          </Link>
                        </Button>
                        <Button variant="outline">View Details</Button>
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
