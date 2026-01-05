"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Copy, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function GenerateLinksPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  const copyLink = (referralCode: string, eventName: string) => {
    const link = `https://stepperslife.com/events?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link copied for ${eventName}`);
  };

  // Filter to events with available tickets
  const eventsWithTickets = staffDashboard?.filter(
    (position) => position.event && position.ticketsRemaining > 0 && position.referralCode
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-ticket-links" className="hover:text-foreground">My Links</Link>
          <span>/</span>
          <span>Generate</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Links</h1>
        <p className="text-muted-foreground mt-2">Create shareable links for events with available tickets</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </CardContent>
        </Card>
      ) : eventsWithTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No events with available tickets</p>
            <p className="text-sm text-muted-foreground mt-2">
              Links are generated when you have tickets to sell
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventsWithTickets.map((position) => position.event && (
            <Card key={position._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {position.event.imageUrl && (
                      <img
                        src={position.event.imageUrl}
                        alt={position.event.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{position.event.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-primary mt-1">
                        {position.ticketsRemaining} tickets available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Your referral link:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background rounded-lg px-3 py-2 text-sm font-mono border">
                      https://stepperslife.com/events?ref={position.referralCode}
                    </div>
                    <Button
                      onClick={() => copyLink(position.referralCode!, position.event!.name)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
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
