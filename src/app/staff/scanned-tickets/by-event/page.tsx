"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ScansByEventPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);
  const scanData = useQuery(api.scanning.queries.getMyScannedTickets, { limit: 500 });

  // Loading state
  if (staffEvents === undefined || scanData === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate scans per event from the staff's scan history
  const scansByEvent = new Map<string, number>();
  for (const scan of scanData.recentScans) {
    const current = scansByEvent.get(scan.eventId) || 0;
    scansByEvent.set(scan.eventId, current + 1);
  }

  // Enrich events with scan counts
  const events = staffEvents.map((event) => ({
    id: event.eventId,
    name: event.eventName,
    scansCount: scansByEvent.get(event.eventId) || 0,
    allocatedTickets: event.allocatedTickets,
    ticketsSold: event.ticketsSold,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scanned-tickets" className="hover:text-foreground">
            Scanned Tickets
          </Link>
          <span>/</span>
          <span>By Event</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Scans By Event</h1>
        <p className="text-muted-foreground mt-2">
          View scan statistics organized by event
        </p>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No events assigned</p>
            <p className="text-sm text-muted-foreground mt-2">
              Events you're assigned to will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{event.name}</CardTitle>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{event.scansCount}</p>
                    <p className="text-sm text-muted-foreground">scans by you</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allocated Tickets</p>
                    <p className="font-semibold">{event.allocatedTickets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tickets Sold</p>
                    <p className="font-semibold">{event.ticketsSold}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Your Scans</p>
                    <p className="font-semibold text-success">{event.scansCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Your Scan Rate</p>
                    <p className="font-semibold">
                      {event.ticketsSold > 0
                        ? ((event.scansCount / event.ticketsSold) * 100).toFixed(1)
                        : "0.0"}%
                    </p>
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
