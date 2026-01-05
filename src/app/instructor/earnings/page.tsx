"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Wallet,
  Download,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function InstructorEarningsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const classes = useQuery(
    api.events.queries.getOrganizerClasses,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const isLoading = currentUser === undefined || classes === undefined;

  // Show loading while Convex queries are loading
  if (isLoading || currentUser === null) {
    return <LoadingSpinner fullPage text="Loading earnings..." />;
  }

  // Calculate earnings from classes
  const totalRevenue = classes?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;
  const totalEnrollments = classes?.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0) || 0;

  // Placeholder for pending payout (would come from payment system)
  const pendingPayout = Math.floor(totalRevenue * 0.1); // 10% pending as example
  const totalPaidOut = totalRevenue - pendingPayout;

  // Calculate next payout date (next Monday)
  const getNextMonday = () => {
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };
  const nextPayoutDate = pendingPayout > 0 ? getNextMonday() : "No pending payout";

  const stats = [
    {
      title: "Total Revenue",
      value: `$${(totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-success",
      description: "All-time class enrollments",
    },
    {
      title: "Pending Payout",
      value: `$${(pendingPayout / 100).toLocaleString()}`,
      icon: Clock,
      color: "bg-warning",
      description: "Ready for payout",
    },
    {
      title: "Total Paid Out",
      value: `$${(totalPaidOut / 100).toLocaleString()}`,
      icon: Wallet,
      color: "bg-primary",
      description: "Successfully transferred",
    },
  ];

  const quickActions = [
    {
      title: "View Classes",
      description: "Manage your class offerings",
      icon: BookOpen,
      href: "/instructor/classes",
      color: "bg-primary",
    },
    {
      title: "Analytics",
      description: "See detailed performance data",
      icon: TrendingUp,
      href: "/instructor/analytics",
      color: "bg-success",
    },
    {
      title: "Payment Setup",
      description: "Configure your payout methods",
      icon: Wallet,
      href: "/instructor/settings",
      color: "bg-sky-500",
    },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Instructor Role Indicator */}
      <div className="bg-warning/10 border-b border-warning/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-warning/20 p-1.5 rounded-full">
              <GraduationCap className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="font-medium text-foreground text-sm">Instructor Earnings</span>
              <span className="text-warning text-xs ml-2">Track your class revenue</span>
            </div>
          </div>
        </div>
      </div>

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
              <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
              <p className="text-muted-foreground mt-1">Track your revenue from classes</p>
            </div>
            <Link
              href="/instructor/analytics"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              View Analytics
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Next Payout Info */}
        {pendingPayout > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-8 text-white mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Next Payout</h2>
                </div>
                <p className="text-white/90 mb-4">Scheduled for {nextPayoutDate}</p>
                <div className="text-4xl font-bold mb-2">${(pendingPayout / 100).toLocaleString()}</div>
                <p className="text-white/90">Will be transferred to your account</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/instructor/settings"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium text-center"
                >
                  Manage Payment Methods
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
                  View {action.title.toLowerCase()}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Revenue by Class</h2>
              <Link
                href="/instructor/analytics"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                View full analytics
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {classes && classes.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {classes.slice(0, 10).map((classItem) => {
                  const revenue = (classItem.revenue || 0) / 100;

                  return (
                    <div key={classItem._id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/instructor/classes/${classItem._id}/edit`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {classItem.name}
                        </Link>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          classItem.status === "PUBLISHED"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}>
                          {classItem.status === "PUBLISHED" ? "Live" : "Draft"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {classItem.enrollmentCount || 0} students
                        </span>
                        <span className="font-medium text-foreground">
                          ${revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {classes.slice(0, 10).map((classItem) => {
                      const revenue = (classItem.revenue || 0) / 100;

                      return (
                        <tr key={classItem._id} className="hover:bg-muted">
                          <td className="px-6 py-4">
                            <Link
                              href={`/instructor/classes/${classItem._id}/edit`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {classItem.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {classItem.enrollmentCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            ${revenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              classItem.status === "PUBLISHED"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}>
                              {classItem.status === "PUBLISHED" ? "Live" : "Draft"}
                            </span>
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
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No earnings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create classes and enroll students to track your earnings
              </p>
              <Link
                href="/instructor/classes/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Class
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
