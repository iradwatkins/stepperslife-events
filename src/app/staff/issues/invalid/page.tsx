"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface InvalidTicket {
  id: string;
  ticketNumber: string;
  eventName: string;
  reason: string;
  timestamp: number;
}

export default function InvalidTicketsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Mock data
  const invalidTickets: InvalidTicket[] = [];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/issues" className="hover:text-foreground">
            Issues
          </Link>
          <span>/</span>
          <span>Invalid Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Invalid Tickets</h1>
        <p className="text-muted-foreground mt-2">
          Tickets that failed validation
        </p>
      </div>

      {/* Issues List */}
      {invalidTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No invalid tickets</p>
            <p className="text-sm text-muted-foreground mt-2">
              Invalid ticket attempts will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invalidTickets.map((ticket) => (
            <Card key={ticket.id} className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{ticket.ticketNumber}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Event: {ticket.eventName}
                        </p>
                        <p className="text-sm text-destructive mt-1">
                          Reason: {ticket.reason}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatTime(ticket.timestamp)}</p>
                      </div>
                    </div>
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
