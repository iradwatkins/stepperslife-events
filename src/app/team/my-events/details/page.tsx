"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function EventDetailsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Details</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Event Details</h1>
        <p className="text-muted-foreground mt-2">View detailed event information</p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Select an event to view details</p>
          <p className="text-sm text-muted-foreground mt-2">
            <Link href="/team/my-events" className="text-primary hover:underline">Go to My Events</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
