"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, CheckCircle, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PastEventsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter for past events (before today)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const events = (staffEvents || []).filter((event) => {
    return (event.eventDate ?? 0) < todayStart;
  });

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      month: "short",
      day: "numeric",
      year: "numeric",
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
          <span>Past Events</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        <p className="text-muted-foreground mt-2">
          Events you've staffed
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search past events..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? "No events found" : "No past events"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm
                ? "Try adjusting your search"
                : "Your completed event assignments will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.eventDate ?? 0);
            return (
              <Card key={event.staffId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex flex-col items-center justify-center">
                      <div className="text-xl font-bold">
                        {eventDate.getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {eventDate.toLocaleString("en-US", {
                          month: "short",
                        })}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{event.eventName}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.eventDate ?? 0)}
                        </div>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                          {event.role}
                        </span>
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="h-3 w-3" />
                          <span>{event.ticketsSold} / {event.allocatedTickets} sold</span>
                        </div>
                        {event.commissionEarned > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <span>${event.commissionEarned.toFixed(2)} earned</span>
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
