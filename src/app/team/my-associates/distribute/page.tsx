"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DistributeTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const globalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);

  const isLoading = staffDashboard === undefined || globalSubSellers === undefined;

  // Events with available tickets
  const eventsWithTickets = staffDashboard?.filter(
    (position) => position.event && position.ticketsRemaining > 0
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-associates" className="hover:text-foreground">My Associates</Link>
          <span>/</span>
          <span>Distribute Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Distribute Tickets</h1>
        <p className="text-muted-foreground mt-2">Assign tickets to your associates</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : eventsWithTickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets available to distribute</p>
            <p className="text-sm text-muted-foreground mt-2">
              You need tickets allocated to you before you can distribute them
            </p>
          </CardContent>
        </Card>
      ) : globalSubSellers && globalSubSellers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No associates to distribute to</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Add associates first before distributing tickets
            </p>
            <Button asChild>
              <Link href="/team/my-associates/add">Add Associate</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Tickets</CardTitle>
              <CardDescription>Select an event to distribute tickets from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventsWithTickets.map((position) => position.event && (
                  <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-4">
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
                          {position.ticketsRemaining} tickets available
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Associates</CardTitle>
              <CardDescription>Select associates to receive tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {globalSubSellers?.map((associate) => (
                  <div key={associate._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{associate.name}</p>
                        <p className="text-sm text-muted-foreground">{associate.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{associate.allocatedTickets || 0} allocated</p>
                      <p className="text-sm text-muted-foreground">{associate.ticketsSold || 0} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
