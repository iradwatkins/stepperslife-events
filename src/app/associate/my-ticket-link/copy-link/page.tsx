"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CopyLinkPage() {
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

  // Filter to only ASSOCIATES role positions
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");

  // Filter to active events only
  const now = new Date();
  const activePositions = associatePositions.filter(p => {
    if (!p.event?.startDate) return false;
    return new Date(p.event.startDate) > now;
  });

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate correct referral link format
  const getReferralLink = (eventId: string, referralCode: string) => {
    return `https://stepperslife.com/events/${eventId}/checkout?ref=${referralCode}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-ticket-link" className="hover:text-foreground">My Ticket Link</Link>
          <span>/</span>
          <span>Copy Link</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Copy Your Links</h1>
        <p className="text-muted-foreground mt-2">Get your unique ticket selling links for each event</p>
      </div>

      {activePositions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Events</CardTitle>
            <CardDescription>You're not assigned to any active events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active events assigned</p>
              <p className="text-sm mt-1">Contact your team member to get assigned to events</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activePositions.map((position) => {
            const referralLink = getReferralLink(position.event?._id || "", position.referralCode);
            const isCopied = copiedId === position._id;

            return (
              <Card key={position._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <CardTitle className="text-lg">{position.event?.name || "Event"}</CardTitle>
                        <CardDescription>
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{position.ticketsSold || 0} sold</p>
                      <p className="text-xs text-muted-foreground">{position.ticketsRemaining || 0} remaining</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => handleCopy(referralLink, position._id)}
                      className="flex items-center gap-2 min-w-[100px]"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Referral Code: <span className="font-mono font-medium">{position.referralCode}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">How to use your links</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Copy the link for the event you want to sell</li>
                <li>Share it with potential ticket buyers via text, email, or social media</li>
                <li>When they purchase using your link, you automatically earn commission</li>
                <li>Track your sales on the Dashboard</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
