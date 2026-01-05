"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Calendar,
  Mail,
  GraduationCap,
  ArrowLeft,
  Download,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function InstructorEnrollmentsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const classes = useQuery(
    api.events.queries.getOrganizerClasses,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  if (currentUser === undefined || classes === undefined) {
    return <LoadingSpinner fullPage text="Loading enrollments..." />;
  }

  // Calculate total enrollments
  const totalEnrollments = classes?.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0) || 0;

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
              <span className="font-medium text-foreground text-sm">Instructor View</span>
              <span className="text-warning text-xs ml-2">View all student enrollments</span>
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
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/instructor/dashboard"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Enrollments</h1>
              <p className="text-muted-foreground mt-1">
                {totalEnrollments} total students across {classes?.length || 0} classes
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="all">All Classes</option>
              {classes?.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Students</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalEnrollments}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Active Classes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {classes?.filter((c) => c.status === "PUBLISHED").length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-warning" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-info" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
        </motion.div>

        {/* Enrollments by Class */}
        {classes && classes.length > 0 ? (
          <div className="space-y-6">
            {classes
              .filter((c) => selectedClass === "all" || c._id === selectedClass)
              .map((classItem) => (
                <motion.div
                  key={classItem._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{classItem.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {classItem.enrollmentCount || 0} students enrolled
                            {classItem.capacity && ` of ${classItem.capacity}`}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/instructor/classes/${classItem._id}/enrollments`}
                        className="text-primary hover:underline text-sm"
                      >
                        Manage Tiers
                      </Link>
                    </div>
                  </div>

                  {(classItem.enrollmentCount || 0) > 0 ? (
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">
                        View detailed student list in the class enrollment management page.
                      </p>
                      <Link
                        href={`/instructor/classes/${classItem._id}/enrollments`}
                        className="mt-3 inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Users className="w-4 h-4" />
                        View Students
                      </Link>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No students enrolled yet</p>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No enrollments yet</h3>
            <p className="text-muted-foreground mb-6">
              Create classes and students will appear here once they enroll
            </p>
            <Link
              href="/instructor/classes/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your First Class
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
