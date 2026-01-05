"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Users, ChevronDown, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SeatingAssignmentsPage() {
  const params = useParams();
  const eventId = params.eventId as Id<"events">;

  // Seating assignments feature is currently disabled
  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <Users className="w-16 h-16 text-muted-foreground mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Seating Assignments Coming Soon</h1>
        <p className="text-muted-foreground mb-6">
          The seating assignments feature is currently being enhanced and will be available soon.
        </p>
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event Dashboard
        </Link>
      </div>
    </div>
  );
}
