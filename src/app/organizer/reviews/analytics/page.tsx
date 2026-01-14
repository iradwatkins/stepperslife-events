"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Star,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Flag,
  Clock,
  BarChart3,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ReviewAnalyticsPage() {
  const [days, setDays] = useState<number>(90);

  const analytics = useQuery(api.classReviews.queries.getReviewAnalytics, {
    days,
  });

  if (analytics === undefined) {
    return <LoadingSpinner fullPage text="Loading analytics..." />;
  }

  if (analytics === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Analytics Available</h2>
          <p className="text-muted-foreground mb-4">Create some classes to start collecting reviews.</p>
          <Link href="/instructor/classes/create">
            <Button>Create a Class</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate trend from recent weeks
  const trend = analytics.recentTrend;
  const avgFirst2Weeks = trend.slice(0, 2).reduce((sum, w) => sum + w.avg, 0) / 2;
  const avgLast2Weeks = trend.slice(2).reduce((sum, w) => sum + w.avg, 0) / 2;
  const trendDirection = avgLast2Weeks > avgFirst2Weeks ? "up" : avgLast2Weeks < avgFirst2Weeks ? "down" : "stable";
  const trendPercent = avgFirst2Weeks > 0 ? Math.abs(((avgLast2Weeks - avgFirst2Weeks) / avgFirst2Weeks) * 100).toFixed(1) : "0";

  // Max for rating distribution bar
  const maxDistribution = Math.max(...Object.values(analytics.ratingDistribution), 1);

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
              <span className="text-warning text-xs ml-2">Review analytics for your classes</span>
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
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/organizer/reviews">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Review Analytics</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Insights from your class reviews
                </p>
              </div>
            </div>
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{analytics.totalReviews}</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{analytics.averageRating.toFixed(1)}</p>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            {trendDirection !== "stable" && (
              <div className={cn(
                "flex items-center gap-1 text-sm mt-2",
                trendDirection === "up" ? "text-success" : "text-destructive"
              )}>
                {trendDirection === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {trendPercent}% vs previous period
              </div>
            )}
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Response Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-foreground">{analytics.responseRate}</p>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">of reviews responded to</p>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Needs Attention</span>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-3xl font-bold text-foreground">{analytics.pendingCount}</p>
                <p className="text-xs text-muted-foreground">pending</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-destructive">{analytics.flaggedCount}</p>
                <p className="text-xs text-muted-foreground">flagged</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Rating Distribution
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = analytics.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5];
                const percentage = (count / maxDistribution) * 100;

                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="font-medium">{stars}</span>
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.1 * (5 - stars) }}
                        className="h-full bg-yellow-400 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Weekly Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Trend (Last 4 Weeks)
            </h3>
            <div className="flex items-end justify-between gap-4 h-48">
              {analytics.recentTrend.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-36">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(week.avg / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.1 * i }}
                      className="w-full max-w-16 bg-primary/80 rounded-t-lg relative"
                    >
                      {week.avg > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold">
                          {week.avg.toFixed(1)}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Week {week.week}</p>
                    <p className="text-xs text-muted-foreground">{week.count} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border p-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Tips to Improve Your Reviews</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-success mb-2" />
              <h4 className="font-medium text-foreground mb-1">Respond to Reviews</h4>
              <p className="text-sm text-muted-foreground">
                Thank students for feedback and address concerns promptly.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mb-2" />
              <h4 className="font-medium text-foreground mb-1">Ask for Reviews</h4>
              <p className="text-sm text-muted-foreground">
                Encourage satisfied students to share their experience after class.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <Flag className="w-6 h-6 text-destructive mb-2" />
              <h4 className="font-medium text-foreground mb-1">Address Issues</h4>
              <p className="text-sm text-muted-foreground">
                Use negative feedback to improve your teaching and class quality.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
