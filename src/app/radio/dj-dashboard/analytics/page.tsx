"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  HelpCircle,
  Activity,
} from "lucide-react";

// Helper to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Simple bar chart component
function SimpleBarChart({
  data,
  maxValue,
  height = 200,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  height?: number;
}) {
  return (
    <div className="flex items-end gap-1 h-full" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end"
          >
            <div
              className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
              style={{ height: `${barHeight}%`, minHeight: item.value > 0 ? 4 : 0 }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-[10px] text-muted-foreground mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Get analytics data
  const analytics = useQuery(
    api.radioStreaming.getStationAnalytics,
    station?._id
      ? { stationId: station._id, days: parseInt(timeRange) }
      : "skip"
  );

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or no station
  if (!user || !station) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need an active radio station to view analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/radio/dj-dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const sessionsByDayData = analytics?.sessionsByDay
    ? Object.entries(analytics.sessionsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14) // Last 14 days
        .map(([date, count]) => ({
          label: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: count as number,
        }))
    : [];

  const peakHoursData = analytics?.peakHours
    ? analytics.peakHours.map((count, hour) => ({
        label: `${hour}:00`,
        value: count,
      }))
    : [];

  const maxSessions = Math.max(...sessionsByDayData.map((d) => d.value), 1);
  const maxPeakHour = Math.max(...peakHoursData.map((d) => d.value), 1);

  // Device breakdown
  const deviceData = analytics?.deviceBreakdown || {};
  const totalDevices = Object.values(deviceData).reduce((a, b) => a + (b as number), 0) || 1;
  const deviceIcons: Record<string, React.ReactNode> = {
    DESKTOP: <Monitor className="w-4 h-4" />,
    MOBILE: <Smartphone className="w-4 h-4" />,
    TABLET: <Tablet className="w-4 h-4" />,
    OTHER: <HelpCircle className="w-4 h-4" />,
  };

  // Region breakdown
  const regionData = analytics?.regionBreakdown || {};
  const totalRegions = Object.values(regionData).reduce((a, b) => a + (b as number), 0) || 1;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/radio/dj-dashboard"
          className="text-sm text-muted-foreground hover:text-primary mb-2 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your station&apos;s performance
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.uniqueListeners || station.totalUniqueListeners || 0}
                </p>
                <p className="text-sm text-muted-foreground">Unique Listeners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.totalListenHours || station.totalListenHours || 0}
                </p>
                <p className="text-sm text-muted-foreground">Listen Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {analytics?.totalSessions || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatDuration(analytics?.avgSessionDuration || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Listeners */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listening Now</p>
                <p className="text-3xl font-bold">{station.currentListeners || 0}</p>
              </div>
            </div>
            {station.isLive && (
              <Badge className="bg-red-500 text-white animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sessions Over Time
            </CardTitle>
            <CardDescription>
              Daily session count for the past {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsByDayData.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No session data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data will appear when listeners tune in
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48">
                <SimpleBarChart
                  data={sessionsByDayData}
                  maxValue={maxSessions}
                  height={180}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Peak Hours
            </CardTitle>
            <CardDescription>
              When your listeners tune in most (24-hour)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {peakHoursData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No peak hours data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start streaming to collect data
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48">
                <SimpleBarChart
                  data={peakHoursData}
                  maxValue={maxPeakHour}
                  height={180}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Breakdown
            </CardTitle>
            <CardDescription>
              What devices your listeners use
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(deviceData).length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No device data yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(deviceData)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([device, count]) => {
                    const percentage = Math.round(((count as number) / totalDevices) * 100);
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {deviceIcons[device] || <HelpCircle className="w-4 h-4" />}
                            <span className="text-sm font-medium capitalize">
                              {device.toLowerCase()}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>
              Where your listeners are located
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(regionData).length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No geographic data yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(regionData)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 8) // Top 8 regions
                  .map(([region, count]) => {
                    const percentage = Math.round(((count as number) / totalRegions) * 100);
                    return (
                      <div key={region}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{region}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
