"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatEventDate } from "@/lib/date-format";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function InstructorDashboardPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const classes = useQuery(
    api.events.queries.getOrganizerClasses,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const isLoading = classes === undefined;

  // Calculate dashboard statistics
  const totalClasses = classes?.length || 0;
  const publishedClasses = classes?.filter((c) => c.status === "PUBLISHED").length || 0;
  const totalEnrollments = classes?.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0) || 0;
  const totalRevenue = classes?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

  // Get upcoming classes
  const upcomingClasses =
    classes?.filter((classItem) => classItem.startDate && classItem.startDate > Date.now()).slice(0, 3) || [];

  // Get recent classes
  const recentClasses = classes?.slice(0, 5) || [];

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Instructor Role Banner */}
      <div className="bg-warning/10 border-b border-warning/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-warning/20 p-1.5 rounded-full">
              <GraduationCap className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="font-medium text-foreground text-sm">Instructor Dashboard</span>
              <span className="text-warning text-xs ml-2">Manage your classes and students</span>
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
              <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of your classes and enrollments</p>
            </div>
            <Link
              href="/instructor/classes/create"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Class
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-foreground">{totalClasses}</p>
              </div>
            </div>
            <Link
              href="/instructor/classes"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-3xl font-bold text-foreground">{publishedClasses}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Classes available for enrollment</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">{totalEnrollments}</p>
              </div>
            </div>
            <Link
              href="/instructor/enrollments"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View enrollments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">
                  ${(totalRevenue / 100).toFixed(2)}
                </p>
              </div>
            </div>
            <Link
              href="/instructor/earnings"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View earnings <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Classes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Upcoming Classes</h2>
                <Link href="/instructor/classes" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {upcomingClasses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming classes</p>
              ) : (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <Link
                      key={classItem._id}
                      href={`/instructor/classes/${classItem._id}/edit`}
                      className="flex items-center gap-4 p-4 hover:bg-muted rounded-lg transition-colors border"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {classItem.imageUrl ? (
                          <Image
                            src={classItem.imageUrl}
                            alt={classItem.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 truncate">{classItem.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {classItem.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatEventDate(classItem.startDate, classItem.timezone)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {classItem.enrollmentCount || 0} enrolled
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Classes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Recent Classes</h2>
                <Link href="/instructor/classes" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No classes yet</p>
                  <Link
                    href="/instructor/classes/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Class
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClasses.map((classItem) => (
                    <Link
                      key={classItem._id}
                      href={`/instructor/classes/${classItem._id}/edit`}
                      className="flex items-center gap-4 p-4 hover:bg-muted rounded-lg transition-colors border"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {classItem.imageUrl ? (
                          <Image
                            src={classItem.imageUrl}
                            alt={classItem.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground mb-1 truncate">{classItem.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                            classItem.status === "PUBLISHED"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}>
                            {classItem.status === "PUBLISHED" ? "Live" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {classItem.danceStyle && (
                            <span>{classItem.danceStyle.replace("_", " ")}</span>
                          )}
                          <span>{classItem.enrollmentCount || 0} students</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/instructor/classes/create"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create Class</h3>
                <p className="text-sm text-muted-foreground">Start a new class</p>
              </div>
            </Link>

            <Link
              href="/instructor/classes"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manage Classes</h3>
                <p className="text-sm text-muted-foreground">View all your classes</p>
              </div>
            </Link>

            <Link
              href="/instructor/analytics"
              className="flex items-center gap-3 p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">View Analytics</h3>
                <p className="text-sm text-muted-foreground">Check your stats</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
