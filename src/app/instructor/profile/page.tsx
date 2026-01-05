"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  DollarSign,
  Edit,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function InstructorProfilePage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const classes = useQuery(
    api.events.queries.getOrganizerClasses,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  if (currentUser === undefined || classes === undefined) {
    return <LoadingSpinner fullPage text="Loading profile..." />;
  }

  // Calculate stats
  const totalClasses = classes?.length || 0;
  const publishedClasses = classes?.filter((c) => c.status === "PUBLISHED").length || 0;
  const totalStudents = classes?.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0) || 0;
  const totalRevenue = classes?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

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
              <span className="font-medium text-foreground text-sm">Instructor Profile</span>
              <span className="text-warning text-xs ml-2">Your public instructor profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-warning to-primary">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
              {currentUser?.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name || "Instructor"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-white">
                  {currentUser?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{currentUser?.name || "Instructor"}</h1>
              <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 mb-4">
                <GraduationCap className="w-5 h-5" />
                Dance Instructor
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {currentUser?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(currentUser?._creationTime || Date.now()).getFullYear()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="md:ml-auto flex gap-3">
              <Link
                href="/instructor/settings"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/instructor/settings"
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{totalClasses}</p>
            <p className="text-sm text-muted-foreground">Total Classes</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Calendar className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{publishedClasses}</p>
            <p className="text-sm text-muted-foreground">Active Classes</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Users className="w-8 h-8 text-info mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <DollarSign className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">${(totalRevenue / 100).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
            <p className="text-muted-foreground">
              Dance instructor with a passion for teaching and helping students discover the joy of movement.
              Specializing in various dance styles and creating a welcoming environment for all skill levels.
            </p>
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-foreground mb-3">Teaching Philosophy</h3>
              <p className="text-muted-foreground">
                I believe everyone can dance! My classes focus on building confidence, learning proper technique,
                and most importantly, having fun while doing it.
              </p>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link
                href="/instructor/dashboard"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Dashboard</p>
                  <p className="text-sm text-muted-foreground">Overview of your classes</p>
                </div>
              </Link>
              <Link
                href="/instructor/classes"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">My Classes</p>
                  <p className="text-sm text-muted-foreground">Manage your class listings</p>
                </div>
              </Link>
              <Link
                href="/instructor/earnings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Earnings</p>
                  <p className="text-sm text-muted-foreground">View your revenue</p>
                </div>
              </Link>
              <Link
                href="/instructor/analytics"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Analytics</p>
                  <p className="text-sm text-muted-foreground">Detailed performance data</p>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white rounded-lg shadow-md"
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent Classes</h2>
              <Link
                href="/instructor/classes"
                className="text-primary hover:underline text-sm"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y">
            {classes && classes.length > 0 ? (
              classes.slice(0, 5).map((classItem) => (
                <Link
                  key={classItem._id}
                  href={`/instructor/classes/${classItem._id}/edit`}
                  className="flex items-center gap-4 p-4 hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{classItem.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classItem.enrollmentCount || 0} students · {classItem.danceStyle?.replace("_", " ")}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    classItem.status === "PUBLISHED"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                    {classItem.status === "PUBLISHED" ? "Live" : "Draft"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No classes yet</p>
                <Link
                  href="/instructor/classes/create"
                  className="mt-4 inline-block text-primary hover:underline"
                >
                  Create your first class
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
