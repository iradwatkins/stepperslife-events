"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, DollarSign, TrendingUp, Calendar, Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TeamDashboardPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const staffEvents = useQuery(api.staff.queries.getStaffEvents);

  // Calculate totals from staff positions
  const totalTickets = staffDashboard?.reduce((sum, s) => sum + (s.allocatedTickets || 0), 0) || 0;
  const availableTickets = staffDashboard?.reduce((sum, s) => sum + (s.ticketsRemaining || 0), 0) || 0;
  const totalSold = staffDashboard?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const totalEarnings = staffDashboard?.reduce((sum, s) => sum + (s.commissionEarned || 0), 0) || 0;
  const activeEvents = staffDashboard?.filter(s => s.event)?.length || 0;

  const isLoading = staffDashboard === undefined || staffEvents === undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Team Member Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {currentUser?.name ? `Welcome back, ${currentUser.name}!` : "Manage your ticket inventory, associates, and track your sales performance"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : availableTickets}</div>
            <p className="text-xs text-muted-foreground">
              {totalTickets > 0 ? `${availableTickets} of ${totalTickets} available` : "Available tickets"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : activeEvents}</div>
            <p className="text-xs text-muted-foreground">Events you're selling for</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `$${(totalEarnings / 100).toFixed(2)}`}</div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalSold}</div>
            <p className="text-xs text-muted-foreground">Total sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/team/my-tickets">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">My Tickets</CardTitle>
                    <CardDescription className="mt-1">{availableTickets} available</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/team/my-associates">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">My Associates</CardTitle>
                    <CardDescription className="mt-1">Manage your team</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/team/earnings">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Earnings</CardTitle>
                    <CardDescription className="mt-1">${(totalEarnings / 100).toFixed(2)} total</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* My Events */}
      <Card>
        <CardHeader>
          <CardTitle>My Events</CardTitle>
          <CardDescription>Events you're assigned to sell tickets for</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading events...</p>
            </div>
          ) : staffDashboard && staffDashboard.length > 0 ? (
            <div className="space-y-3">
              {staffDashboard.map((position) => position.event && (
                <div key={position._id} className="flex items-center justify-between p-4 border rounded-lg">
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
                        {position.event.startDate ? new Date(position.event.startDate).toLocaleDateString() : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{position.ticketsRemaining} available</p>
                    <p className="text-sm text-muted-foreground">
                      {position.ticketsSold} sold • ${(position.commissionEarned / 100).toFixed(2)} earned
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events assigned</p>
              <p className="text-sm mt-2">Contact event organizers to get assigned to events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
