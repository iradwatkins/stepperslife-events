"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, TrendingUp, Package, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
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

  // Calculate totals
  const totalAllocated = associatePositions.reduce((sum, p) => sum + (p.allocatedTickets || 0), 0);
  const totalAvailable = associatePositions.reduce((sum, p) => sum + (p.ticketsRemaining || 0), 0);
  const totalSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Inventory Overview</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground mt-2">Complete view of all your tickets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold mt-1">{totalAllocated}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold mt-1">{totalAvailable}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sold</p>
                <p className="text-2xl font-bold mt-1 text-success">{totalSold}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {associatePositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No inventory data</p>
            <p className="text-sm text-muted-foreground mt-1">Your ticket inventory will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {associatePositions.map((position) => {
            const allocated = position.allocatedTickets || 0;
            const sold = position.ticketsSold || 0;
            const sellRate = allocated > 0 ? Math.round((sold / allocated) * 100) : 0;

            return (
              <Card key={position._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
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

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Allocated</p>
                          <p className="text-xl font-bold">{allocated}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="text-xl font-bold text-primary">{position.ticketsRemaining || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sold</p>
                          <p className="text-xl font-bold text-success">{sold}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Sell Rate</p>
                      <p className="text-2xl font-bold">{sellRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
