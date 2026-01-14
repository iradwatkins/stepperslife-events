"use client";

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Users,
  X,
  XCircle,
  AlertCircle,
  Save,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PageProps {
  params: Promise<{ classId: string }>;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface AttendanceRecord {
  userId: string;
  status: AttendanceStatus;
  notes?: string;
}

// Type for history data from Convex query
interface HistoryRecord {
  sessionDate: number;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatus;
  notes?: string;
}

// Type for per-student stats from Convex query
interface StudentStatRecord {
  studentId: string;
  studentName: string;
  studentEmail: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

export default function ClassAttendancePage({ params }: PageProps) {
  const { classId: classIdStr } = use(params);
  const classId = classIdStr as Id<"events">;
  const router = useRouter();

  // State
  const [selectedDate, setSelectedDate] = useState<number>(() => {
    // Default to today at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  });
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceRecord>>(
    new Map()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notesMap, setNotesMap] = useState<Map<string, string>>(new Map());

  // Queries
  const classData = useQuery(api.events.queries.getEventById, { eventId: classId });
  const sessionData = useQuery(api.classAttendance.queries.getSessionAttendance, {
    classId,
    sessionDate: selectedDate,
  });
  const statsData = useQuery(api.classAttendance.queries.getAttendanceStats, {
    classId,
  });
  const historyData = useQuery(api.classAttendance.queries.getClassAttendance, {
    classId,
  });

  // Mutations
  const bulkMarkAttendance = useMutation(
    api.classAttendance.mutations.bulkMarkAttendance
  );
  const markAllPresent = useMutation(
    api.classAttendance.mutations.markAllPresent
  );

  // Initialize attendance map from session data
  useMemo(() => {
    if (sessionData?.attendance) {
      const newMap = new Map<string, AttendanceRecord>();
      const newNotesMap = new Map<string, string>();
      for (const record of sessionData.attendance) {
        newMap.set(record.userId, {
          userId: record.userId,
          status: record.status as AttendanceStatus,
          notes: record.notes,
        });
        if (record.notes) {
          newNotesMap.set(record.userId, record.notes);
        }
      }
      setAttendanceMap(newMap);
      setNotesMap(newNotesMap);
    }
  }, [sessionData?.attendance]);

  const isLoading = classData === undefined || sessionData === undefined;

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading attendance..." />;
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-destructive">Class not found</div>
      </div>
    );
  }

  const students = sessionData?.students || [];

  // Handle status change for a student
  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    const newMap = new Map(attendanceMap);
    const existing = newMap.get(userId);
    newMap.set(userId, {
      userId,
      status,
      notes: existing?.notes || notesMap.get(userId),
    });
    setAttendanceMap(newMap);
  };

  // Handle notes change for a student
  const handleNotesChange = (userId: string, notes: string) => {
    const newNotesMap = new Map(notesMap);
    newNotesMap.set(userId, notes);
    setNotesMap(newNotesMap);

    // Also update attendance map if exists
    const existing = attendanceMap.get(userId);
    if (existing) {
      const newMap = new Map(attendanceMap);
      newMap.set(userId, { ...existing, notes });
      setAttendanceMap(newMap);
    }
  };

  // Save attendance
  const handleSave = async () => {
    if (attendanceMap.size === 0) {
      toast.error("No attendance records to save");
      return;
    }

    setIsSaving(true);
    try {
      const records = Array.from(attendanceMap.values()).map((record) => ({
        userId: record.userId as Id<"users">,
        status: record.status,
        notes: record.notes || notesMap.get(record.userId),
      }));

      await bulkMarkAttendance({
        classId,
        sessionDate: selectedDate,
        records,
      });

      toast.success("Attendance saved successfully!");
    } catch (error) {
      console.error("Save attendance error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  // Mark all present
  const handleMarkAllPresent = async () => {
    setIsSaving(true);
    try {
      await markAllPresent({
        classId,
        sessionDate: selectedDate,
      });

      // Update local state
      const newMap = new Map<string, AttendanceRecord>();
      for (const student of students) {
        newMap.set(student._id, {
          userId: student._id,
          status: "present",
          notes: notesMap.get(student._id),
        });
      }
      setAttendanceMap(newMap);

      toast.success("All students marked as present!");
    } catch (error) {
      console.error("Mark all present error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark all present");
    } finally {
      setIsSaving(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!historyData || historyData.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    // Build CSV content
    const headers = ["Date", "Student Name", "Email", "Status", "Notes"];
    const rows = (historyData as HistoryRecord[]).map((record) => [
      new Date(record.sessionDate).toLocaleDateString(),
      record.studentName,
      record.studentEmail,
      record.status.charAt(0).toUpperCase() + record.status.slice(1),
      record.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${classData.name.replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Attendance exported to CSV!");
  };

  // Get status icon
  const StatusIcon = ({ status }: { status: AttendanceStatus }) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "absent":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "late":
        return <Clock className="w-5 h-5 text-warning" />;
      case "excused":
        return <AlertCircle className="w-5 h-5 text-primary" />;
    }
  };

  // Format date for input
  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0];
  };

  // Parse date from input
  const parseDateFromInput = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

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
              <span className="font-medium text-foreground text-sm">
                Instructor View
              </span>
              <span className="text-warning text-xs ml-2">
                Track student attendance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/instructor/classes/${classId}/enrollments`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Enrollments
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Attendance Tracking
              </h1>
              <p className="text-muted-foreground mt-1">{classData.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showHistory
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                {showHistory ? "Hide History" : "View History"}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        {statsData && statsData.totalSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Sessions
              </div>
              <p className="text-2xl font-bold text-foreground">
                {statsData.totalSessions}
              </p>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 text-sm text-success mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Present
              </div>
              <p className="text-2xl font-bold text-success">
                {statsData.presentCount}
              </p>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 text-sm text-destructive mb-1">
                <XCircle className="w-4 h-4" />
                Absent
              </div>
              <p className="text-2xl font-bold text-destructive">
                {statsData.absentCount}
              </p>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 text-sm text-warning mb-1">
                <Clock className="w-4 h-4" />
                Late
              </div>
              <p className="text-2xl font-bold text-warning">
                {statsData.lateCount}
              </p>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Rate
              </div>
              <p className="text-2xl font-bold text-foreground">
                {statsData.attendanceRate}%
              </p>
            </div>
          </div>
        )}

        {/* History View */}
        {showHistory && historyData && (
          <div className="bg-card rounded-lg shadow-md border mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                Attendance History
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                All attendance records for this class
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No attendance records yet
                      </td>
                    </tr>
                  ) : (
                    (historyData as HistoryRecord[]).map((record, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(record.sessionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {record.studentName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.studentEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              record.status === "present"
                                ? "bg-success/10 text-success"
                                : record.status === "absent"
                                  ? "bg-destructive/10 text-destructive"
                                  : record.status === "late"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-primary/10 text-primary"
                            }`}
                          >
                            <StatusIcon status={record.status} />
                            {record.status.charAt(0).toUpperCase() +
                              record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {record.notes || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="bg-card rounded-lg shadow-md border p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(selectedDate)}
                  onChange={(e) =>
                    setSelectedDate(parseDateFromInput(e.target.value))
                  }
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="text-sm text-muted-foreground mt-6">
                {students.length} enrolled student{students.length !== 1 && "s"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllPresent}
                disabled={isSaving || students.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Mark All Present
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || attendanceMap.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        {students.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No enrolled students
            </h3>
            <p className="text-muted-foreground mb-6">
              Students will appear here once they enroll in your class
            </p>
            <Link
              href={`/instructor/classes/${classId}/enrollments`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Manage Enrollments
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-md border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                Mark Attendance
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Select attendance status for each student
              </p>
            </div>
            <div className="divide-y divide-border">
              {students.map((student) => {
                const record = attendanceMap.get(student._id);
                const currentStatus = record?.status;
                const currentNotes = notesMap.get(student._id) || "";

                return (
                  <div
                    key={student._id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-medium text-foreground">
                          {student.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.email}
                        </div>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(student._id, "present")
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentStatus === "present"
                              ? "bg-success text-white"
                              : "bg-success/10 text-success hover:bg-success/20"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Present
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(student._id, "absent")
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentStatus === "absent"
                              ? "bg-destructive text-white"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Absent
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(student._id, "late")
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentStatus === "late"
                              ? "bg-warning text-white"
                              : "bg-warning/10 text-warning hover:bg-warning/20"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          Late
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(student._id, "excused")
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentStatus === "excused"
                              ? "bg-primary text-white"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                          Excused
                        </button>
                      </div>
                    </div>

                    {/* Notes input - show if any status is selected */}
                    {currentStatus && (
                      <div className="mt-3 pl-0 md:pl-[200px]">
                        <input
                          type="text"
                          placeholder="Add notes (optional)"
                          value={currentNotes}
                          onChange={(e) =>
                            handleNotesChange(student._id, e.target.value)
                          }
                          className="w-full max-w-md px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-Student Stats */}
        {statsData && statsData.perStudentStats.length > 0 && (
          <div className="bg-card rounded-lg shadow-md border mt-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                Student Attendance Rates
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Individual attendance statistics (sorted by rate, lowest first)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Excused
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(statsData.perStudentStats as StudentStatRecord[]).map((stat) => (
                    <tr key={stat.studentId} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {stat.studentName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stat.studentEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-success font-medium">
                        {stat.present}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-warning font-medium">
                        {stat.late}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-destructive font-medium">
                        {stat.absent}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-primary font-medium">
                        {stat.excused}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            stat.attendanceRate >= 80
                              ? "bg-success/10 text-success"
                              : stat.attendanceRate >= 60
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {stat.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
