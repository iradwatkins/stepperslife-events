"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp, ArrowRight, Clock, CheckCircle, PauseCircle } from "lucide-react";
import Link from "next/link";

export default function MyAssociatesPage() {
  // Legacy staff-based associates (global sub-sellers)
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const globalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);

  // New associates table
  const associates = useQuery(api.associates.queries.getMyAssociates, {});
  const associateStats = useQuery(api.associates.queries.getAssociateStats);

  const isLoading = staffDashboard === undefined || globalSubSellers === undefined || associates === undefined;

  // Combined counts from both sources
  const legacyAssociateCount = globalSubSellers?.length || 0;
  const newAssociateCount = associates?.length || 0;
  const totalAssociateCount = legacyAssociateCount + newAssociateCount;

  // Calculate aggregate stats from global sub-sellers (legacy)
  const totalAssociateSales = globalSubSellers?.reduce((sum, s) => sum + (s.ticketsSold || 0), 0) || 0;
  const activeLegacyAssociates = globalSubSellers?.filter(s => s.isActive).length || 0;

  // New associates stats
  const activeNewAssociates = associateStats?.active || 0;
  const pendingAssociates = associateStats?.pending || 0;

  const totalActiveAssociates = activeLegacyAssociates + activeNewAssociates;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Associates</h1>
          <p className="text-muted-foreground mt-2">Manage your sales team</p>
        </div>
        <Button asChild>
          <Link href="/team/my-associates/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Associate
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Associates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalAssociateCount}</div>
            <p className="text-xs text-muted-foreground">On your team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{isLoading ? "..." : totalActiveAssociates}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{isLoading ? "..." : pendingAssociates}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalAssociateSales}</div>
            <p className="text-xs text-muted-foreground">Tickets sold by associates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-associates/add">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Add Associate</CardTitle>
                    <CardDescription className="mt-1">Invite new member</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-associates/manage">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Manage Associates</CardTitle>
                    <CardDescription className="mt-1">{totalAssociateCount} associates</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/team/my-associates/distribute">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Distribute Tickets</CardTitle>
                    <CardDescription className="mt-1">Assign inventory</CardDescription>
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
          <CardTitle>My Associates</CardTitle>
          <CardDescription>Your sales team members</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading associates...</p>
            </div>
          ) : (totalAssociateCount > 0) ? (
            <div className="space-y-3">
              {/* New associates from associates table */}
              {associates && associates.map((associate) => (
                <div key={associate._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{associate.name}</p>
                        <Badge
                          variant={
                            associate.status === "ACTIVE" ? "default" :
                            associate.status === "PENDING" ? "secondary" :
                            "outline"
                          }
                          className="text-xs"
                        >
                          {associate.status === "ACTIVE" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {associate.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                          {associate.status === "SUSPENDED" && <PauseCircle className="h-3 w-3 mr-1" />}
                          {associate.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{associate.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {associate.status === "PENDING" ? "Invitation pending" : "Ready to sell"}
                    </p>
                  </div>
                </div>
              ))}
              {/* Legacy associates from eventStaff table */}
              {globalSubSellers && globalSubSellers.map((associate) => (
                <div key={associate._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{associate.name}</p>
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ACTIVE
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{associate.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{associate.ticketsSold || 0} sold</p>
                    <p className="text-sm text-muted-foreground">
                      ${((associate.commissionEarned || 0) / 100).toFixed(2)} earned
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No associates yet</p>
              <p className="text-sm mt-2 mb-4">Add associates to start building your sales team</p>
              <Button asChild>
                <Link href="/team/my-associates/add">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Associate
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
