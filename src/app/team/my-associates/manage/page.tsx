"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Ticket } from "lucide-react";
import Link from "next/link";

export default function ManageAssociatesPage() {
  const globalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);

  const isLoading = globalSubSellers === undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/team/my-associates" className="hover:text-foreground">My Associates</Link>
          <span>/</span>
          <span>Manage</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Associates</h1>
        <p className="text-muted-foreground mt-2">View and manage your team members</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading associates...</p>
          </CardContent>
        </Card>
      ) : globalSubSellers && globalSubSellers.length > 0 ? (
        <div className="space-y-4">
          {globalSubSellers.map((associate) => (
            <Card key={associate._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{associate.name}</h3>
                      <p className="text-sm text-muted-foreground">{associate.email}</p>
                      {associate.phone && (
                        <p className="text-sm text-muted-foreground">{associate.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      associate.isActive
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {associate.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Allocated</p>
                    <p className="font-semibold">{associate.allocatedTickets || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sold</p>
                    <p className="font-semibold">{associate.ticketsSold || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-semibold">${((associate.commissionEarned || 0) / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Ticket className="h-4 w-4 mr-2" />
                    Allocate Tickets
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No associates to manage</p>
            <p className="text-sm text-muted-foreground mt-2">Add associates first to manage them here</p>
            <Button asChild className="mt-4">
              <Link href="/team/my-associates/add">Add Associate</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
