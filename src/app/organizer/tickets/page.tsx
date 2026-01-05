"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Ticket,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowRight,
  Plus,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";

// Extended event type with computed fields
interface EventWithStats extends Doc<"events"> {
  imageUrl?: string;
  totalRevenue?: number;
  ticketsSold?: number;
  totalTickets?: number;
}

export default function TicketsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const rawEvents = useQuery(api.events.queries.getOrganizerEvents, {
    userId: currentUser?._id,
  });

  // Type cast to include computed fields that may be present
  const events = rawEvents as EventWithStats[] | undefined;

  const isLoading = currentUser === undefined || events === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  // Calculate ticket statistics
  const totalTicketsAllocated =
    events?.reduce((sum, event) => sum + (event.totalTickets || 0), 0) || 0;
  const totalTicketsSold =
    events?.reduce((sum, event) => sum + (event.ticketsSold || 0), 0) || 0;
  const totalTicketsAvailable = totalTicketsAllocated - totalTicketsSold;
  const ticketRevenue =
    events?.reduce((sum, event) => sum + (event.totalRevenue || 0), 0) || 0;

  const stats = [
    {
      title: "Total Tickets Created",
      value: totalTicketsAllocated.toLocaleString(),
      icon: Package,
      color: "bg-primary",
      href: "/organizer/tickets/inventory",
    },
    {
      title: "Tickets Sold",
      value: totalTicketsSold.toLocaleString(),
      icon: ShoppingCart,
      color: "bg-success",
      href: "/organizer/tickets/sales",
    },
    {
      title: "Available Tickets",
      value: totalTicketsAvailable.toLocaleString(),
      icon: Ticket,
      color: "bg-sky-500",
      href: "/organizer/tickets/inventory",
    },
    {
      title: "Ticket Revenue",
      value: `$${ticketRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-success",
      href: "/organizer/tickets/sales",
    },
  ];

  const quickActions = [
    {
      title: "Purchase Tickets",
      description: "Buy tickets using your credits",
      icon: ShoppingCart,
      href: "/organizer/tickets/purchase",
      color: "bg-primary",
    },
    {
      title: "View Inventory",
      description: "Manage your ticket inventory",
      icon: Package,
      href: "/organizer/tickets/inventory",
      color: "bg-primary",
    },
    {
      title: "Sales Overview",
      description: "Track ticket sales and revenue",
      icon: TrendingUp,
      href: "/organizer/tickets/sales",
      color: "bg-success",
    },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tickets</h1>
              <p className="text-muted-foreground mt-1">Manage your ticket inventory and sales</p>
            </div>
            <Link
              href="/organizer/tickets/purchase"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Purchase Tickets
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </Link>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`${action.color} p-3 rounded-lg text-white w-fit mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{action.title}</h3>
                <p className="text-muted-foreground mb-4">{action.description}</p>
                <div className="flex items-center text-primary font-medium">
                  Go to {action.title.toLowerCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Events with Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Events with Tickets</h2>
            <Link
              href="/organizer/events"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View all events
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {events && events.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {events.slice(0, 10).map((event) => {
                  const available = (event.totalTickets || 0) - (event.ticketsSold || 0);
                  return (
                    <div key={event._id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">{event.name}</p>
                          <p className="text-sm text-muted-foreground">{event.eventType || "Event"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium">{(event.totalTickets || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sold</p>
                          <p className="font-medium">{(event.ticketsSold || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="font-medium">{available.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-medium">${(event.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-card">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Event
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
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                      {events.slice(0, 10).map((event) => {
                        const available = (event.totalTickets || 0) - (event.ticketsSold || 0);
                        return (
                          <tr key={event._id} className="hover:bg-card">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-muted-foreground mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-foreground">
                                    {event.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {event.eventType || "Event"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {(event.totalTickets || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {(event.ticketsSold || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {available.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              ${(event.totalRevenue || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to start selling tickets
              </p>
              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
