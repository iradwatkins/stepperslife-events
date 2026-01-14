"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  Music,
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileAudio,
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  PlayCircle,
} from "lucide-react";
import { ShowUploadModal } from "@/components/radio/ShowUploadModal";
import { ShowCard } from "@/components/radio/ShowCard";

export default function UploadsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Get DJ's shows
  const shows = useQuery(
    api.radioStreaming.getMyShows,
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
              You need an active radio station to upload shows.
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

  // Filter shows by status
  const pendingShows = shows?.filter(
    (s) => s.status === "PENDING_APPROVAL" || s.status === "UPLOADING" || s.status === "PROCESSING"
  ) || [];
  const approvedShows = shows?.filter((s) => s.status === "APPROVED") || [];
  const scheduledShows = shows?.filter((s) => s.status === "SCHEDULED") || [];
  const playedShows = shows?.filter((s) => s.status === "PLAYED") || [];
  const allShows = shows || [];

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
              <Upload className="w-8 h-8 text-blue-600" />
              Upload Shows
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload pre-recorded mixes to play on your station
            </p>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload New Show
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allShows.length}</p>
                <p className="text-sm text-muted-foreground">Total Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedShows.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledShows.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <PlayCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playedShows.length}</p>
                <p className="text-sm text-muted-foreground">Played</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shows List */}
      {allShows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors hover:border-primary"
            >
              <FileAudio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No Shows Uploaded Yet</p>
              <p className="text-muted-foreground mb-4">
                Click here or use the button above to upload your first show
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: MP3, WAV, OGG, FLAC (max 500MB)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              All ({allShows.length})
            </TabsTrigger>
            {pendingShows.length > 0 && (
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingShows.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Approved ({approvedShows.length})
            </TabsTrigger>
            {scheduledShows.length > 0 && (
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Scheduled ({scheduledShows.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allShows.map((show) => (
              <ShowCard
                key={show._id}
                show={show}
                userId={user._id as Id<"users">}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingShows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending shows</p>
                </CardContent>
              </Card>
            ) : (
              pendingShows.map((show) => (
                <ShowCard
                  key={show._id}
                  show={show}
                  userId={user._id as Id<"users">}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedShows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved shows yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedShows.map((show) => (
                <ShowCard
                  key={show._id}
                  show={show}
                  userId={user._id as Id<"users">}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledShows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scheduled shows</p>
                </CardContent>
              </Card>
            ) : (
              scheduledShows.map((show) => (
                <ShowCard
                  key={show._id}
                  show={show}
                  userId={user._id as Id<"users">}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Upload Modal */}
      <ShowUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={user._id as Id<"users">}
      />
    </div>
  );
}
