"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MessageCircle, Calendar, Ticket, Loader2, Percent } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function MyTeamMemberPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions that have a parent (assignedByStaffId)
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");

  // Calculate aggregate stats
  const totalEventsAssigned = associatePositions.length;
  const totalTicketsAllocated = associatePositions.reduce((sum, p) => sum + (p.allocatedTickets || 0), 0);
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);

  // For now, we show a simplified view since getMyParentStaff requires an eventId
  // We'll show the first parent's info if available
  const hasParentAssignment = associatePositions.some(p => p.hierarchyLevel && p.hierarchyLevel > 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Team Member</h1>
        <p className="text-muted-foreground mt-2">Your assigned team member and event information</p>
      </div>

      {associatePositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No associate positions found</p>
            <p className="text-sm text-muted-foreground mt-1">Contact support to get connected with a team member</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Event Assignments</CardTitle>
              <CardDescription>Events where you're an associate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {associatePositions.map((position) => (
                  <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{position.event?.name || "Event"}</p>
                        <p className="text-sm text-muted-foreground">
                          {position.event?.startDate
                            ? new Date(position.event.startDate).toLocaleDateString()
                            : "Date TBD"}
                        </p>
                        {position.hierarchyLevel && position.hierarchyLevel > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Level {position.hierarchyLevel} sub-seller
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {position.commissionType === "PERCENTAGE"
                            ? `${position.commissionValue}% commission`
                            : position.commissionType === "FIXED"
                            ? `$${((position.commissionValue || 0) / 100).toFixed(2)}/ticket`
                            : "Commission TBD"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {position.ticketsSold || 0} of {position.allocatedTickets || 0} sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>Summary of your associate activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Events Assigned</span>
                  </div>
                  <span className="font-semibold">{totalEventsAssigned}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tickets Allocated</span>
                  </div>
                  <span className="font-semibold">{totalTicketsAllocated}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-success" />
                    <span className="text-sm text-muted-foreground">Tickets Sold</span>
                  </div>
                  <span className="font-semibold text-success">{totalTicketsSold}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">About Your Role</h3>
              <p className="text-sm text-foreground mt-1">
                As an associate, you can sell tickets for the events you're assigned to.
                Your team member or the event organizer is responsible for assigning events,
                distributing tickets, and helping you succeed. Reach out to them for support,
                questions, or to request more ticket inventory.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
