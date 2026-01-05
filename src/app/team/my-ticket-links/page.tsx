"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Copy, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MyTicketLinksPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  const isLoading = staffDashboard === undefined;

  const copyLink = (referralCode: string, eventName: string) => {
    const link = `https://stepperslife.com/events?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link copied for ${eventName}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Ticket Links</h1>
        <p className="text-muted-foreground mt-2">Share your unique links to earn commission on ticket sales</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-ticket-links/generate">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Generate Links</CardTitle>
                    <CardDescription className="mt-1">Create shareable links</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-ticket-links/performance">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Link Performance</CardTitle>
                    <CardDescription className="mt-1">Track link analytics</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Links</CardTitle>
          <CardDescription>Share these links to earn commission when customers buy tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading links...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-4">
              {staffDashboard.map((position) => position.event && position.referralCode && (
                <div key={position._id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {position.event.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{position.event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(position.event.startDate ?? 0).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{position.ticketsSold} sold</p>
                      <p className="text-sm text-success">${(position.commissionEarned / 100).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono overflow-hidden">
                      <span className="text-muted-foreground">stepperslife.com/events?ref=</span>
                      <span className="text-primary">{position.referralCode}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(position.referralCode!, position.event!.name)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referral links yet</p>
              <p className="text-sm mt-2">Get assigned to events to receive referral links</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
