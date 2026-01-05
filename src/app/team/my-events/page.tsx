"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Ticket, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MyEventsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  // Separate active (upcoming) and past events
  const now = Date.now();
  const activeEvents = staffDashboard?.filter(
    (position) => position.event && (position.event.startDate ?? 0) >= now
  ) || [];
  const pastEvents = staffDashboard?.filter(
    (position) => position.event && (position.event.startDate ?? 0) < now
  ) || [];

  const totalEvents = (activeEvents?.length || 0) + (pastEvents?.length || 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground mt-2">Events you're assigned to sell tickets for</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-events/active">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Active Events</CardTitle>
                    <CardDescription className="mt-1">{activeEvents.length} upcoming</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-events/past">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Past Events</CardTitle>
                    <CardDescription className="mt-1">{pastEvents.length} completed</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalEvents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events you can currently sell tickets for</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : activeEvents.length > 0 ? (
            <div className="space-y-3">
              {activeEvents.map((position) => position.event && (
                <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{position.event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Ticket className="h-4 w-4" />
                          <span className="font-semibold">{position.ticketsRemaining}</span> available
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-success">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">${(position.commissionEarned / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {position.ticketsSold} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active events</p>
              <p className="text-sm mt-2">Contact event organizers to get assigned to events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
