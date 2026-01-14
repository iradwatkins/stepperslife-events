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
  Radio,
  Users,
  Clock,
  DollarSign,
  PlayCircle,
  Upload,
  Calendar,
  BarChart3,
  Settings,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Music2,
  Mic2,
} from "lucide-react";

export default function DJDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Get DJ's application status
  const application = useQuery(
    api.radioStreaming.getMyDjApplication,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Login Required
            </CardTitle>
            <CardDescription>
              Please log in to access your DJ dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No station yet
  if (!station) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-6 h-6 text-primary" />
                DJ Dashboard
              </CardTitle>
              <CardDescription>
                You don&apos;t have a radio station yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Your Application Status</p>
                    <Badge
                      variant={
                        application.status === "APPROVED"
                          ? "default"
                          : application.status === "PENDING" ||
                            application.status === "UNDER_REVIEW"
                          ? "outline"
                          : "destructive"
                      }
                      className={
                        application.status === "APPROVED"
                          ? "bg-green-500"
                          : application.status === "PENDING"
                          ? "border-yellow-500 text-yellow-600"
                          : application.status === "UNDER_REVIEW"
                          ? "border-blue-500 text-blue-600"
                          : ""
                      }
                    >
                      {application.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Station Name:</strong>{" "}
                      {application.proposedStationName}
                    </p>
                    <p>
                      <strong>DJ Name:</strong> {application.djName}
                    </p>
                    <p>
                      <strong>Genre:</strong> {application.genre}
                    </p>
                  </div>
                  {application.status === "PENDING" && (
                    <p className="text-sm text-muted-foreground">
                      Your application is being reviewed. We&apos;ll notify you
                      once it&apos;s approved.
                    </p>
                  )}
                  {application.status === "REJECTED" && application.reviewNotes && (
                    <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                      <strong>Feedback:</strong> {application.reviewNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <Music2 className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Ready to Broadcast?</p>
                    <p className="text-muted-foreground">
                      Apply to become a DJ and get your own radio station.
                    </p>
                  </div>
                  <Link href="/radio/become-a-dj">
                    <Button size="lg">
                      <Mic2 className="w-4 h-4 mr-2" />
                      Apply to Become a DJ
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Has a station - show dashboard
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="w-8 h-8 text-primary" />
              {station.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {station.djName}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={station.isLive ? "default" : "outline"}
              className={
                station.isLive
                  ? "bg-green-500 text-white animate-pulse"
                  : "border-gray-400 text-gray-600"
              }
            >
              {station.isLive ? "● LIVE" : "Offline"}
            </Badge>
            <Link href={`/radio/stations/${station.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Station
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {station.currentListeners || 0}
                </p>
                <p className="text-sm text-muted-foreground">Listeners Now</p>
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
                  {station.totalListenHours || 0}
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
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">$0.00</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {station.peakListeners || 0}
                </p>
                <p className="text-sm text-muted-foreground">Peak Listeners</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/radio/dj-dashboard/go-live">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-green-500/10 mb-3">
                <PlayCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">Go Live</CardTitle>
              <CardDescription className="mt-1">
                Start broadcasting now
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/radio/dj-dashboard/uploads">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-blue-500/10 mb-3">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Upload Shows</CardTitle>
              <CardDescription className="mt-1">
                Upload pre-recorded mixes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/radio/dj-dashboard/schedule">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-purple-500/10 mb-3">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Schedule</CardTitle>
              <CardDescription className="mt-1">
                Manage your broadcast times
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/radio/dj-dashboard/analytics">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-orange-500/10 mb-3">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription className="mt-1">
                View your performance
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Station Info & Now Playing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Station Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">DJ Name</p>
                <p className="font-medium">{station.djName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="font-medium">{station.genre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Station URL</p>
                <p className="font-medium text-sm truncate">
                  stepperslife.com/radio/stations/{station.slug}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {station.status === "ACTIVE" ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    station.status
                  )}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Link href="/radio/dj-dashboard/settings">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Station Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Now Playing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5" />
              Now Playing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {station.isLive ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    {station.nowPlaying?.artUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={station.nowPlaying.artUrl}
                        alt="Album art"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {station.nowPlaying?.title || "Unknown Track"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {station.nowPlaying?.artist || "Unknown Artist"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{station.currentListeners || 0} listeners</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Your station is offline</p>
                <p className="text-sm mt-1">Go live to start broadcasting</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
