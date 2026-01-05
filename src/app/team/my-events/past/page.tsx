"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PastEventsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  // Filter to past events
  const now = Date.now();
  const pastEvents = staffDashboard?.filter(
    (position) => position.event && (position.event.startDate ?? 0) < now
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Past Events</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        <p className="text-muted-foreground mt-2">Completed events and their results</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </CardContent>
        </Card>
      ) : pastEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No past events</p>
            <p className="text-sm text-muted-foreground mt-2">Completed events will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pastEvents.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-16 h-16 rounded-lg object-cover opacity-75"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{position.event.name}</h3>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{position.ticketsSold} sold</p>
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
