"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Ticket, DollarSign, TrendingUp, Loader2, Percent } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function EventDetailsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find the position for this event
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");
  const position = eventId
    ? associatePositions.find(p => p.event?._id === eventId)
    : associatePositions[0]; // Default to first position if no ID

  if (!position) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/associate/my-events" className="hover:text-foreground">My Events</Link>
            <span>/</span>
            <span>Event Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Event Details</h1>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Event not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              <Link href="/associate/my-events" className="text-primary hover:underline">
                View all your events
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate sell-through rate
  const allocated = position.allocatedTickets || 0;
  const sold = position.ticketsSold || 0;
  const sellThroughRate = allocated > 0 ? Math.round((sold / allocated) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-events" className="hover:text-foreground">My Events</Link>
          <span>/</span>
          <span>Event Details</span>
        </div>
        <div className="flex items-center gap-4">
          {position.event?.imageUrl && (
            <img
              src={position.event.imageUrl}
              alt={position.event.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{position.event?.name || "Event"}</h1>
            <p className="text-muted-foreground mt-1">View event details and your performance</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{position.ticketsRemaining || 0}</div>
            <p className="text-xs text-muted-foreground">To sell</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{position.ticketsSold || 0}</div>
            <p className="text-xs text-muted-foreground">By you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(position.commissionEarned || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sell-Through</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellThroughRate}%</div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>Details about this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {position.event?.startDate
                  ? new Date(position.event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : "Date TBD"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Time</p>
              <p className="text-sm text-muted-foreground">
                {position.event?.startDate
                  ? new Date(position.event.startDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "Time TBD"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Commission Rate</p>
              <p className="text-sm text-muted-foreground">
                {position.commissionType === "PERCENTAGE"
                  ? `${position.commissionValue}% per ticket`
                  : position.commissionType === "FIXED"
                  ? `${formatCurrency(position.commissionValue || 0)} per ticket`
                  : "TBD"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Sales Performance</CardTitle>
          <CardDescription>Track your progress for this event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tickets Allocated</span>
              <span className="font-semibold">{position.allocatedTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tickets Sold</span>
              <span className="font-semibold text-success">{position.ticketsSold || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tickets Remaining</span>
              <span className="font-semibold">{position.ticketsRemaining || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="font-semibold text-success">
                {formatCurrency(position.commissionEarned || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
