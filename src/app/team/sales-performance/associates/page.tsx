"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, DollarSign } from "lucide-react";
import Link from "next/link";

export default function AssociatePerformancePage() {
  const globalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);

  const isLoading = globalSubSellers === undefined;

  // Sort by tickets sold
  const sortedAssociates = globalSubSellers
    ?.slice()
    ?.sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0)) || [];

  const totalAssociateSales = sortedAssociates.reduce((sum, a) => sum + (a.ticketsSold || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/sales-performance" className="hover:text-foreground">Performance</Link>
          <span>/</span>
          <span>Associates</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Associate Performance</h1>
        <p className="text-muted-foreground mt-2">Track your team's sales performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Associates</p>
                <p className="text-3xl font-bold mt-1">{isLoading ? "..." : sortedAssociates.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Sales</p>
                <p className="text-3xl font-bold mt-1">{isLoading ? "..." : totalAssociateSales}</p>
              </div>
              <Ticket className="h-10 w-10 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading associates...</p>
          </CardContent>
        </Card>
      ) : sortedAssociates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No associates yet</p>
            <p className="text-sm text-muted-foreground mt-2">Add associates to track their performance</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Associate Rankings</h3>
            <div className="space-y-3">
              {sortedAssociates.map((associate, index) => (
                <div key={associate._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{associate.name}</p>
                      <p className="text-sm text-muted-foreground">{associate.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{associate.ticketsSold || 0} sold</p>
                    <p className="text-sm text-success">
                      ${((associate.commissionEarned || 0) / 100).toFixed(2)} earned
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
