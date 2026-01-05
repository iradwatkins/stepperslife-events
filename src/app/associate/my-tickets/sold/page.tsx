"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Ticket, Calendar, DollarSign, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Format cents to dollars
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function SoldTicketsPage() {
  const staffDashboard = useQuery(api.staff.queries.getStaffDashboard);
  const [searchTerm, setSearchTerm] = useState("");

  // Loading state
  if (staffDashboard === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter to only ASSOCIATES role positions with sales
  const associatePositions = staffDashboard.filter(p => p.role === "ASSOCIATES");
  const positionsWithSales = associatePositions.filter(p => (p.ticketsSold || 0) > 0);

  // Filter by search term
  const filteredPositions = positionsWithSales.filter((position) =>
    position.event?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalTicketsSold = associatePositions.reduce((sum, p) => sum + (p.ticketsSold || 0), 0);
  const totalCommission = associatePositions.reduce((sum, p) => sum + (p.commissionEarned || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/associate/my-tickets" className="hover:text-foreground">My Tickets</Link>
          <span>/</span>
          <span>Sold Tickets</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sold Tickets</h1>
        <p className="text-muted-foreground mt-2">Your complete sales history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sold</p>
                <p className="text-2xl font-bold mt-1 text-success">{totalTicketsSold}</p>
              </div>
              <Ticket className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totalCommission)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPositions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? "No tickets found" : "No sold tickets yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Try a different search term" : "Your sold tickets will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPositions.map((position) => (
            <Card key={position._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {position.event?.imageUrl && (
                        <img
                          src={position.event.imageUrl}
                          alt={position.event.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{position.event?.name || "Event"}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                          {position.ticketsSold} Sold
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {position.event?.startDate
                          ? new Date(position.event.startDate).toLocaleDateString()
                          : "Date TBD"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Commission Earned</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(position.commissionEarned || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
