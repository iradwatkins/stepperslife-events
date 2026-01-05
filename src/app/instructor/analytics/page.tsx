"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Loader2,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InstructorAnalyticsPage() {
  const stats = useQuery(api.instructorAnalytics.getInstructorStats, { days: 30 });
  const trends = useQuery(api.instructorAnalytics.getEnrollmentTrends, { days: 14 });
  const classBreakdown = useQuery(api.instructorAnalytics.getClassBreakdown);
  const students = useQuery(api.instructorAnalytics.getStudentRoster, { limit: 10 });
  const monthlyRevenue = useQuery(api.instructorAnalytics.getRevenueByMonth, { months: 6 });

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Loading state
  if (!stats || !trends || !classBreakdown || !students || !monthlyRevenue) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate chart scales
  const maxDailyEnrollments = Math.max(...trends.map((d) => d.enrollments), 1);

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
              <span className="font-medium text-foreground text-sm">Instructor Analytics</span>
              <span className="text-warning text-xs ml-2">Performance data for your classes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-warning to-primary py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/instructor/classes"
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Class Analytics</h1>
                <p className="text-white/80 text-sm">Last 30 Days Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 dark:bg-primary/20 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/20 dark:bg-success/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.fillRate}%</p>
                  <p className="text-xs text-muted-foreground">Fill Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 dark:bg-warning/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                  <p className="text-xs text-muted-foreground">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Class Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {classBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No classes yet
                </p>
              ) : (
                <div className="space-y-4">
                  {classBreakdown.slice(0, 5).map((cls, index) => (
                    <div key={cls.classId} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cls.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{cls.enrollments} enrolled</span>
                          <span>·</span>
                          <span>{cls.fillRate}% full</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(cls.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Students</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students enrolled yet
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((student, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{student.enrolledClasses} class{student.enrolledClasses !== 1 && "es"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Trends Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Daily Enrollments (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-end gap-1">
              {trends.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/50 rounded-t transition-all hover:bg-primary"
                    style={{
                      height: `${(day.enrollments / maxDailyEnrollments) * 100}%`,
                      minHeight: day.enrollments > 0 ? "4px" : "0",
                    }}
                    title={`${day.date}: ${day.enrollments} enrollments, ${formatCurrency(day.revenue)}`}
                  />
                  <span className="text-[10px] text-muted-foreground rotate-45 origin-left">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No revenue data yet
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {monthlyRevenue.map((month) => {
                  const [year, monthNum] = month.month.split("-");
                  const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleDateString(
                    "en-US",
                    { month: "short" }
                  );

                  return (
                    <div key={month.month} className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {monthName} {year}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(month.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {month.enrollments} enrollment{month.enrollments !== 1 && "s"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/instructor/classes">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Classes
            </Button>
          </Link>
          <Link href="/instructor/classes/create">
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Create New Class
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
