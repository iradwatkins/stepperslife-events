"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  MapPin,
  GraduationCap,
  BarChart3,
  Users,
  DollarSign,
  CheckCircle,
  X,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatEventDate } from "@/lib/date-format";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function InstructorClassesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const classes = useQuery(api.events.queries.getOrganizerClasses, {
    userId: currentUser?._id,
  });

  const publishEvent = useMutation(api.events.mutations.publishEvent);
  const unpublishEvent = useMutation(api.events.mutations.updateEvent);
  const deleteEvent = useMutation(api.events.mutations.deleteEvent);
  const deleteEntireSeries = useMutation(api.events.mutations.deleteEntireSeries);
  const deleteSeriesFuture = useMutation(api.events.mutations.deleteSeriesFuture);

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"events">;
    seriesId?: string;
    name: string;
  } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"single" | "series" | "future">("single");
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle success message from URL params
  useEffect(() => {
    const created = searchParams.get("created");
    const count = searchParams.get("count");
    const updated = searchParams.get("updated");

    if (created === "series" && count) {
      setSuccessMessage(`Series created! ${count} classes scheduled. Your classes are saved as drafts. Click "Publish" to make them visible to students.`);
      setShowSuccessBanner(true);
      // Clear the URL params without refreshing
      router.replace("/instructor/classes", { scroll: false });
    } else if (created === "single") {
      setSuccessMessage("Class created successfully! Your class is saved as a draft. Click \"Publish\" to make it visible to students.");
      setShowSuccessBanner(true);
      router.replace("/instructor/classes", { scroll: false });
    } else if (updated === "true") {
      setSuccessMessage("Class updated successfully!");
      setShowSuccessBanner(true);
      router.replace("/instructor/classes", { scroll: false });
    }
  }, [searchParams, router]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.seriesId) {
        switch (deleteMode) {
          case "single":
            await deleteEvent({ eventId: deleteTarget.id });
            toast.success("Class deleted");
            break;
          case "series":
            await deleteEntireSeries({ seriesId: deleteTarget.seriesId });
            toast.success("Entire series deleted");
            break;
          case "future":
            await deleteSeriesFuture({ eventId: deleteTarget.id });
            toast.success("This and future classes deleted");
            break;
        }
      } else {
        await deleteEvent({ eventId: deleteTarget.id });
        toast.success("Class deleted");
      }
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete class");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setDeleteMode("single");
    }
  };

  if (currentUser === undefined || classes === undefined) {
    return <LoadingSpinner fullPage text="Loading your classes..." />;
  }

  const handleTogglePublish = async (classId: Id<"events">, currentStatus: string) => {
    try {
      if (currentStatus === "PUBLISHED") {
        await unpublishEvent({
          eventId: classId,
          status: "DRAFT",
        });
        toast.success("Class unpublished");
      } else {
        await publishEvent({ eventId: classId });
        toast.success("Class published!");
      }
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update class status");
    }
  };

  return (
    <div className="min-h-screen bg-muted" data-testid="instructor-classes-page">
      {/* Instructor Role Indicator */}
      <div className="bg-warning/10 border-b border-warning/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="bg-warning/20 p-1.5 rounded-full">
              <GraduationCap className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="font-medium text-foreground text-sm">Instructor View</span>
              <span className="text-warning text-xs ml-2">Classes you teach and manage</span>
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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Classes</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Classes you created and manage as an instructor
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href="/instructor/analytics"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-colors w-full sm:w-auto"
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Link>
              <Link
                href="/instructor/classes/create"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                Create Class
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Classes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{classes?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {classes?.filter((c) => c.status === "PUBLISHED").length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="w-5 h-5 text-warning" />
              <span className="text-sm text-muted-foreground">Drafts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {classes?.filter((c) => c.status === "DRAFT").length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Upcoming</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {classes?.filter((c) => c.startDate && c.startDate > Date.now()).length || 0}
            </p>
          </div>
        </motion.div>

        {/* Success Banner */}
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                <p className="text-sm text-foreground">{successMessage}</p>
              </div>
              <Button
                onClick={() => setShowSuccessBanner(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Classes List */}
        {classes.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No classes yet</h3>
            <p className="text-muted-foreground mb-6">Create your first class to get started</p>
            <Link
              href="/instructor/classes/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Class
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {classes.map((classItem, index) => {
              const isUpcoming = classItem.startDate && classItem.startDate > Date.now();
              const location = classItem.location as { city?: string; state?: string } | undefined;

              return (
                <motion.div
                  key={classItem._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(0.1 * index, 0.5) }}
                  className="group relative bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  {/* Status Indicator */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      classItem.status === "PUBLISHED" ? "bg-success" : "bg-warning"
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row">
                    {/* Class Image */}
                    <div className="relative aspect-video sm:aspect-square sm:w-40 md:w-44 flex-shrink-0 overflow-hidden bg-muted">
                      <div
                        className={`absolute top-2 right-2 z-10 px-2 py-0.5 text-xs font-semibold rounded-md shadow-sm ${
                          classItem.status === "PUBLISHED"
                            ? "bg-success text-white"
                            : "bg-warning text-white"
                        }`}
                      >
                        {classItem.status === "PUBLISHED" ? "Live" : "Draft"}
                      </div>

                      {classItem.imageUrl && !failedImages.has(classItem._id) ? (
                        <img
                          src={classItem.imageUrl}
                          alt={classItem.name}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setFailedImages((prev) => new Set(prev).add(classItem._id));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary">
                          <BookOpen className="w-10 h-10 text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Class Details */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
                      <div className="mb-3">
                        <h3 className="font-serif text-lg md:text-xl font-bold text-foreground line-clamp-1 mb-1">
                          {classItem.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {classItem.startDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatEventDate(classItem.startDate, classItem.timezone)}
                            </span>
                          )}
                          {location?.city && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {location.city}
                              {location.state ? `, ${location.state}` : ""}
                            </span>
                          )}
                          {/* Series Badge */}
                          {classItem.seriesId && classItem.seriesPosition && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-info/10 text-info rounded-md">
                              Class {classItem.seriesPosition} of {classItem.totalInSeries || "?"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {classItem.danceStyle && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-md">
                            {classItem.danceStyle.replace("_", " ")}
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-info/10 text-info rounded-md">
                            Upcoming
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {classItem.enrollmentCount || 0}
                            {classItem.capacity && (
                              <span className="text-muted-foreground">/{classItem.capacity}</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">enrolled</span>
                        </div>

                        {(classItem.revenue || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-success" />
                            <span className="text-sm font-medium text-success">
                              ${((classItem.revenue || 0) / 100).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-auto flex-wrap">
                        <Link
                          href={`/instructor/classes/${classItem._id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>

                        <Link
                          href={`/instructor/classes/${classItem._id}/preview`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-colors"
                          data-testid={`preview-class-${classItem._id}`}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Link>

                        <Link
                          href={`/instructor/classes/${classItem._id}/enrollments`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-success/30 text-success rounded-lg hover:bg-success/5 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          Enrollments
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(classItem._id, classItem.status || "DRAFT")}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                            classItem.status === "PUBLISHED"
                              ? "border border-warning/30 text-warning hover:bg-warning/5"
                              : "border border-success/30 text-success hover:bg-success/5"
                          }`}
                        >
                          {classItem.status === "PUBLISHED" ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Publish
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setDeleteTarget({
                            id: classItem._id,
                            seriesId: classItem.seriesId,
                            name: classItem.name,
                          })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.seriesId && (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground">
                This class is part of a series. What would you like to delete?
              </p>
              <RadioGroup
                value={deleteMode}
                onValueChange={(v) => setDeleteMode(v as typeof deleteMode)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Just this class</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="future" id="future" />
                  <Label htmlFor="future">This and all future classes in series</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="series" id="series" />
                  <Label htmlFor="series">Entire series (all classes)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {!deleteTarget?.seriesId && (
            <p className="text-sm text-muted-foreground py-4">
              This action cannot be undone.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
