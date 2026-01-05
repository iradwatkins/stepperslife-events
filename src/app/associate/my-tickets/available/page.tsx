"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Copy, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AvailableTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions with available tickets
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");
  const positionsWithTickets = associatePositions.filter(p => (p.ticketsRemaining || 0) > 0);

  // Generate correct referral link format
  const getReferralLink = (eventId: string, referralCode: string) => {
    return `https://stepperslife.com/events/${eventId}/checkout?ref=${referralCode}`;
  };

  const handleCopyLink = (eventId: string, referralCode: string, positionId: string) => {
    const link = getReferralLink(eventId, referralCode);
    navigator.clipboard.writeText(link);
    setCopiedId(positionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Available Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Available Tickets</h1>
        <p className="text-muted-foreground mt-2">Tickets ready to sell</p>
      </div>

      {positionsWithTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No available tickets</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {positionsWithTickets.map((position) => (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{position.event?.name || "Event"}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {position.event?.startDate
                              ? new Date(position.event.startDate).toLocaleDateString()
                              : "Date TBD"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Commission: {position.commissionType === "PERCENTAGE"
                        ? `${position.commissionValue}%`
                        : position.commissionType === "FIXED"
                        ? `${formatCurrency(position.commissionValue || 0)} per ticket`
                        : "TBD"}
                    </p>
                  </div>

                  <div className="text-right space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold">{position.ticketsRemaining || 0}</p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleCopyLink(position.event?._id || "", position.referralCode, position._id)}
                    >
                      {copiedId === position._id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Get Link
                        </>
                      )}
                    </Button>
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
