"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Ticket, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function LinkStatsPage() {
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

  // Calculate aggregate stats
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const totalRevenue = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);
  const totalAllocated = associatePositions.reduce((sum, p) => sum + (p.allocatedTickets || 0), 0);
  const conversionRate = totalAllocated > 0 ? Math.round((totalTicketsSold / totalAllocated) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-ticket-link" className="hover:text-foreground">My Ticket Link</Link>
          <span>/</span>
          <span>Link Stats</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Link Statistics</h1>
        <p className="text-muted-foreground mt-2">Track your link performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Allocated</p>
                <p className="text-2xl font-bold mt-1">{totalAllocated}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold mt-1 text-success">{totalTicketsSold}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sell-Through Rate</p>
                <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Event</CardTitle>
          <CardDescription>See how each event link is performing</CardDescription>
        </CardHeader>
        <CardContent>
          {associatePositions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No event data</p>
              <p className="text-sm mt-1">Performance breakdown by event will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {associatePositions.map((position) => {
                const allocated = position.allocatedTickets || 0;
                const sold = position.ticketsSold || 0;
                const sellThrough = allocated > 0 ? Math.round((sold / allocated) * 100) : 0;
                const commission = position.commissionEarned || 0;

                return (
                  <div key={position._id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {position.event?.imageUrl && (
                          <img
                            src={position.event.imageUrl}
                            alt={position.event.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{position.event?.name || "Event"}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {position.event?.startDate
                                ? new Date(position.event.startDate).toLocaleDateString()
                                : "Date TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-success">{formatCurrency(commission)}</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold">{allocated}</p>
                        <p className="text-xs text-muted-foreground">Allocated</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-success">{sold}</p>
                        <p className="text-xs text-muted-foreground">Sold</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{sellThrough}%</p>
                        <p className="text-xs text-muted-foreground">Sell-Through</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${sellThrough}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Understanding Your Stats</h3>
              <ul className="text-sm text-foreground mt-2 space-y-1 list-disc list-inside">
                <li><strong>Tickets Allocated:</strong> Total tickets assigned to you for sale</li>
                <li><strong>Tickets Sold:</strong> Tickets purchased through your referral links</li>
                <li><strong>Commission Earned:</strong> Your earnings from ticket sales</li>
                <li><strong>Sell-Through Rate:</strong> Percentage of allocated tickets sold</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
