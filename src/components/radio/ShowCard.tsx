"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Music,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Edit,
  Calendar,
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ShowCardProps {
  show: {
    _id: Id<"radioShows">;
    title: string;
    description?: string;
    genre?: string;
    duration?: number;
    status: string;
    playCount?: number;
    scheduledAt?: number;
    isRecurring?: boolean;
    createdAt: number;
  };
  userId: Id<"users">;
  onEdit?: () => void;
}

export function ShowCard({ show, userId, onEdit }: ShowCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioUrl = useQuery(api.radioStreaming.getShowAudioUrl, { showId: show._id });
  const deleteShow = useMutation(api.radioStreaming.deleteShow);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPLOADING":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Uploading
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "PENDING_APPROVAL":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge className="bg-purple-500 text-white">
            <Calendar className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case "PLAYED":
        return (
          <Badge variant="secondary">
            <PlayCircle className="w-3 h-3 mr-1" />
            Played
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteShow({ showId: show._id, userId });
      toast.success("Show deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete show");
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePlay = () => {
    if (!audioUrl) {
      toast.error("Audio not available");
      return;
    }

    // For now, just toggle state - real audio playback would need an audio element
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.info("Audio preview coming soon");
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Play Button / Cover */}
            <div className="flex-shrink-0">
              <button
                onClick={togglePlay}
                disabled={show.status !== "APPROVED"}
                className={`w-16 h-16 rounded-lg flex items-center justify-center transition-colors ${
                  show.status === "APPROVED"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{show.title}</h3>
                  {show.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {show.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(show.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {show.genre && (
                  <div className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" />
                    <span>{show.genre}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(show.duration)}</span>
                </div>
                {show.playCount !== undefined && show.playCount > 0 && (
                  <div className="flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{show.playCount} plays</span>
                  </div>
                )}
                <span className="text-xs">
                  Uploaded {formatDate(show.createdAt)}
                </span>
              </div>

              {/* Scheduled Info */}
              {show.scheduledAt && (
                <div className="mt-2 text-sm text-purple-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Scheduled for {new Date(show.scheduledAt).toLocaleString()}
                    {show.isRecurring && " (Recurring)"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Show</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{show.title}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
