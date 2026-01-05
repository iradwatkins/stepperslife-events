"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  showName?: string;
}

interface SlotModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  showName: string;
  originalSlot?: ScheduleSlot;
}

export default function SchedulePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [slotModal, setSlotModal] = useState<SlotModalState>({
    isOpen: false,
    mode: "add",
    dayOfWeek: 0,
    startTime: "20:00",
    endTime: "23:00",
    showName: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    slot?: ScheduleSlot;
  }>({ isOpen: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's schedule
  const scheduleData = useQuery(
    api.radioStreaming.getMySchedule,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Get all schedules to show other DJs
  const allSchedules = useQuery(api.radioStreaming.getAllSchedules);

  // Mutations
  const addSlot = useMutation(api.radioStreaming.addScheduleSlot);
  const updateSlot = useMutation(api.radioStreaming.updateScheduleSlot);
  const removeSlot = useMutation(api.radioStreaming.removeScheduleSlot);

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or no station
  if (!user || !scheduleData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need an active radio station to manage your schedule.
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

  const mySchedule = scheduleData.schedule || [];

  // Get other DJs' slots for a specific day
  const getOtherDJSlots = (dayOfWeek: number) => {
    if (!allSchedules) return [];
    const slots: Array<{
      djName: string;
      stationName: string;
      startTime: string;
      endTime: string;
      showName?: string;
    }> = [];

    for (const station of allSchedules) {
      if (station.stationId === scheduleData.stationId) continue;
      for (const slot of station.schedule) {
        if (slot.dayOfWeek === dayOfWeek) {
          slots.push({
            djName: station.djName || "Unknown DJ",
            stationName: station.stationName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            showName: slot.showName,
          });
        }
      }
    }

    return slots;
  };

  // Get my slots for a specific day
  const getMySlotsForDay = (dayOfWeek: number) => {
    return mySchedule.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Open modal to add slot
  const openAddModal = (dayOfWeek: number) => {
    setSlotModal({
      isOpen: true,
      mode: "add",
      dayOfWeek,
      startTime: "20:00",
      endTime: "23:00",
      showName: "",
    });
  };

  // Open modal to edit slot
  const openEditModal = (slot: ScheduleSlot) => {
    setSlotModal({
      isOpen: true,
      mode: "edit",
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      showName: slot.showName || "",
      originalSlot: slot,
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (slotModal.mode === "add") {
        await addSlot({
          userId: user._id as Id<"users">,
          dayOfWeek: slotModal.dayOfWeek,
          startTime: slotModal.startTime,
          endTime: slotModal.endTime,
          showName: slotModal.showName || undefined,
        });
        toast.success("Schedule slot added");
      } else if (slotModal.originalSlot) {
        await updateSlot({
          userId: user._id as Id<"users">,
          oldDayOfWeek: slotModal.originalSlot.dayOfWeek,
          oldStartTime: slotModal.originalSlot.startTime,
          newDayOfWeek: slotModal.dayOfWeek,
          newStartTime: slotModal.startTime,
          newEndTime: slotModal.endTime,
          showName: slotModal.showName || undefined,
        });
        toast.success("Schedule slot updated");
      }
      setSlotModal({ ...slotModal, isOpen: false });
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save schedule"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user || !deleteDialog.slot) return;

    setIsSubmitting(true);
    try {
      await removeSlot({
        userId: user._id as Id<"users">,
        dayOfWeek: deleteDialog.slot.dayOfWeek,
        startTime: deleteDialog.slot.startTime,
      });
      toast.success("Schedule slot removed");
      setDeleteDialog({ isOpen: false });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to remove schedule slot");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Calendar className="w-8 h-8 text-purple-600" />
              Schedule Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Set your weekly broadcast schedule for {scheduleData.stationName}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="grid gap-4">
        {DAYS.map((dayName, dayIndex) => {
          const mySlots = getMySlotsForDay(dayIndex);
          const otherSlots = getOtherDJSlots(dayIndex);

          return (
            <Card key={dayName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dayName}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAddModal(dayIndex)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mySlots.length === 0 && otherSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No scheduled broadcasts
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* My Slots */}
                    {mySlots.map((slot, idx) => (
                      <div
                        key={`my-${idx}`}
                        className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/20">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)}
                            </p>
                            {slot.showName && (
                              <p className="text-sm text-muted-foreground">
                                {slot.showName}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-primary text-primary-foreground">
                            Your Show
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(slot)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              setDeleteDialog({ isOpen: true, slot })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Other DJs' Slots */}
                    {otherSlots.map((slot, idx) => (
                      <div
                        key={`other-${idx}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {slot.djName}
                              {slot.showName && ` - ${slot.showName}`}
                            </p>
                          </div>
                          <Badge variant="secondary">Other DJ</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Slot Modal */}
      <Dialog
        open={slotModal.isOpen}
        onOpenChange={(open) => setSlotModal({ ...slotModal, isOpen: open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {slotModal.mode === "add"
                ? "Add Schedule Slot"
                : "Edit Schedule Slot"}
            </DialogTitle>
            <DialogDescription>
              Set when you&apos;ll be broadcasting on{" "}
              {DAYS[slotModal.dayOfWeek]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={slotModal.dayOfWeek.toString()}
                onValueChange={(v) =>
                  setSlotModal({ ...slotModal, dayOfWeek: parseInt(v) })
                }
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={day} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={slotModal.startTime}
                  onValueChange={(v) =>
                    setSlotModal({ ...slotModal, startTime: v })
                  }
                >
                  <SelectTrigger id="startTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {formatTime(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={slotModal.endTime}
                  onValueChange={(v) =>
                    setSlotModal({ ...slotModal, endTime: v })
                  }
                >
                  <SelectTrigger id="endTime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {formatTime(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show Name */}
            <div className="space-y-2">
              <Label htmlFor="showName">Show Name (optional)</Label>
              <Input
                id="showName"
                placeholder="e.g., Friday Night Steppers"
                value={slotModal.showName}
                onChange={(e) =>
                  setSlotModal({ ...slotModal, showName: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSlotModal({ ...slotModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : slotModal.mode === "add" ? (
                "Add Slot"
              ) : (
                "Update Slot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Schedule Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this schedule slot? Listeners who
              are expecting your show at this time won&apos;t see it on the
              schedule anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
