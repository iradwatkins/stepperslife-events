"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const revenueStats = useQuery(
    api.analytics.queries.getOrganizerRevenueStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );
  const ticketStats = useQuery(
    api.analytics.queries.getOrganizerTicketStats,
    currentUser?._id ? { organizerId: currentUser._id } : "skip"
  );

  const isLoading = currentUser === undefined || events === undefined || revenueStats === undefined;

  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (revenueStats?.totalRevenue || 0) / 100; // Convert cents to dollars
  const totalTicketsSold = ticketStats?.totalTicketsSold || events?.reduce((sum, e) => sum + (e.ticketsSold || 0), 0) || 0;
  const totalEvents = events?.length || 0;

  const reportTypes = [
    {
      title: "Sales Reports",
      description: "Analyze ticket sales and revenue trends",
      icon: BarChart3,
      href: "/organizer/reports/sales",
      color: "bg-info/100",
      stats: `$${totalRevenue.toLocaleString()} total revenue`,
    },
    {
      title: "Attendee Reports",
      description: "View attendee demographics and participation",
      icon: Users,
      href: "/organizer/reports/attendees",
      color: "bg-sky-500",
      stats: `${totalTicketsSold.toLocaleString()} total attendees`,
    },
    {
      title: "Financial Reports",
      description: "Detailed financial breakdowns and summaries",
      icon: DollarSign,
      href: "/organizer/reports/financial",
      color: "bg-success",
      stats: `${totalEvents} events tracked`,
    },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card shadow-sm border-b border-border"
      >
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Comprehensive insights into your events performance</p>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {reportTypes.map((report, index) => (
            <Link
              key={index}
              href={report.href}
              className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`${report.color} p-3 rounded-lg text-white w-fit mb-4`}>
                <report.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{report.title}</h3>
              <p className="text-muted-foreground mb-4">{report.description}</p>
              <p className="text-sm text-muted-foreground mb-4">{report.stats}</p>
              <div className="flex items-center text-primary font-medium">
                View report
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
