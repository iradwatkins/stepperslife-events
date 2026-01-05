"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Calendar,
  Ticket,
  TrendingUp,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function TicketInventoryPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = currentUser === undefined || events === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Filter events by search query
  const filteredEvents =
    events?.filter((event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Calculate totals
  const totalTickets =
    filteredEvents.reduce((sum, event) => sum + (event.totalTickets || 0), 0) || 0;
  const totalSold =
    filteredEvents.reduce((sum, event) => sum + (event.ticketsSold || 0), 0) || 0;
  const totalAvailable = totalTickets - totalSold;

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/organizer/tickets"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ticket Inventory</h1>
              <p className="text-muted-foreground mt-1">View and manage all your event tickets</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-info/100 p-3 rounded-lg text-white">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Tickets</h3>
            <p className="text-3xl font-bold text-foreground">{totalTickets.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success p-3 rounded-lg text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Tickets Sold</h3>
            <p className="text-3xl font-bold text-foreground">{totalSold.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-500 p-3 rounded-lg text-white">
                <Ticket className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Available</h3>
            <p className="text-3xl font-bold text-foreground">{totalAvailable.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {filteredEvents && filteredEvents.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {filteredEvents.map((event) => {
                  const totalTickets = event.totalTickets || 0;
                  const ticketsSold = event.ticketsSold || 0;
                  const available = totalTickets - ticketsSold;
                  const percentSold = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;

                  return (
                    <div key={event._id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/organizer/events/${event._id}`}
                            className="text-sm font-medium text-primary hover:underline block truncate"
                          >
                            {event.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {event.startDate
                              ? new Date(event.startDate).toLocaleDateString()
                              : "Date TBD"}
                          </p>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-foreground mt-1">
                            {event.eventType || "Event"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium">{totalTickets.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sold</p>
                          <p className="font-medium">{ticketsSold.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="font-medium">{available.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentSold >= 90
                                ? "bg-destructive/100"
                                : percentSold >= 70
                                ? "bg-warning/100"
                                : "bg-success"
                            }`}
                            style={{ width: `${Math.min(percentSold, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {Math.round(percentSold)}% sold
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total Tickets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {filteredEvents.map((event) => {
                      const totalTickets = event.totalTickets || 0;
                      const ticketsSold = event.ticketsSold || 0;
                      const available = totalTickets - ticketsSold;
                      const percentSold = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;

                      return (
                        <tr key={event._id} className="hover:bg-card">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Calendar className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                              <div>
                                <Link
                                  href={`/organizer/events/${event._id}`}
                                  className="text-sm font-medium text-primary hover:underline"
                                >
                                  {event.name}
                                </Link>
                                <div className="text-sm text-muted-foreground">
                                  {event.startDate
                                    ? new Date(event.startDate).toLocaleDateString()
                                    : "Date TBD"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-foreground">
                              {event.eventType || "Event"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                            {totalTickets.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {ticketsSold.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {available.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                <div
                                  className={`h-2 rounded-full ${
                                    percentSold >= 90
                                      ? "bg-destructive/100"
                                      : percentSold >= 70
                                      ? "bg-warning/100"
                                      : "bg-success"
                                  }`}
                                  style={{ width: `${Math.min(percentSold, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {Math.round(percentSold)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                {searchQuery ? "No events found" : "No tickets yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Purchase tickets to see them in your inventory"}
              </p>
              {!searchQuery && (
                <Link
                  href="/organizer/tickets/purchase"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Purchase Tickets
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
