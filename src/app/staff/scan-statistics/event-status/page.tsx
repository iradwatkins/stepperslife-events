"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  location: string | {
    venueName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  scannedCount: number;
  soldCount: number;
  capacity: number;
  waitingCount: number;
  scanRate: number;
}

export default function EventStatusPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Mock data
  const events: Event[] = [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scan-statistics" className="hover:text-foreground">
            Scan Statistics
          </Link>
          <span>/</span>
          <span>Event Status</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Event Status Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time progress for all active events
        </p>
      </div>

      {/* Active Events */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No active events</p>
            <p className="text-sm text-muted-foreground mt-2">
              Event status will appear during active events
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{event.name}</CardTitle>
                  <span className="px-3 py-1 bg-success/20 text-success text-sm font-medium rounded-full">
                    In Progress
                  </span>
                </div>
                <CardDescription>
                  {typeof event.location === 'string'
                    ? event.location
                    : event.location && [event.location.venueName, event.location.city, event.location.state].filter(Boolean).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Check-in Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {event.scannedCount}/{event.soldCount} ({((event.scannedCount / event.soldCount) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${(event.scannedCount / event.soldCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold">{event.capacity}</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
                    <p className="text-2xl font-bold text-success">{event.scannedCount}</p>
                    <p className="text-xs text-muted-foreground">Checked In</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold">{event.waitingCount}</p>
                    <p className="text-xs text-muted-foreground">Waiting</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold text-primary">{event.scanRate}/min</p>
                    <p className="text-xs text-muted-foreground">Entry Rate</p>
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
