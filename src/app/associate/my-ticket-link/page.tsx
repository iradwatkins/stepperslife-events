"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Copy, Share2, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AssociateMyTicketLinkPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

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

  // Calculate aggregate metrics from real data
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const totalEarningsCents = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
  const activeEvents = associatePositions.filter(p => {
    if (!p.event?.startDate) return false;
    return new Date(p.event.startDate) > new Date();
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Ticket Link</h1>
        <p className="text-muted-foreground mt-2">Your unique links for selling tickets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents.length}</div>
            <p className="text-xs text-muted-foreground">Event links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalTicketsSold}</div>
            <p className="text-xs text-muted-foreground">Tickets sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{associatePositions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalEarningsCents)}</div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/my-ticket-link/copy-link">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Copy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Copy Link</CardTitle>
                    <CardDescription className="mt-1">Get your link</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/my-ticket-link/share-link">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Share2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Share Link</CardTitle>
                    <CardDescription className="mt-1">Share easily</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/associate/my-ticket-link/link-stats">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg">
                    <BarChart3 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Link Stats</CardTitle>
                    <CardDescription className="mt-1">View analytics</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">About Your Ticket Link</h3>
              <p className="text-sm text-foreground mt-1">
                Your unique ticket link tracks all sales back to you. Share it with potential buyers via text, email, or social media to earn commission on every ticket sold.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
