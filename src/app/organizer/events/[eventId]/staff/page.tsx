"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  MoreVertical,
  UserPlus,
  DollarSign,
  Percent,
  Mail,
  Phone,
  Trash2,
  Edit,
  Ticket,
  PackageCheck,
  TrendingDown,
  Copy,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

type StaffRole = "STAFF" | "TEAM_MEMBERS" | "ASSOCIATES" | "MANAGER" | "SELLER";

// Recursive component for hierarchy tree visualization
function HierarchyNode({
  staff,
  handleRemoveStaff,
  handleEditStaff,
  level = 0,
}: {
  staff: any;
  handleRemoveStaff: (id: Id<"eventStaff">) => void;
  handleEditStaff: (staff: any) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubSellers = staff.subSellers && staff.subSellers.length > 0;

  return (
    <div className={`${level > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="bg-card border border-border rounded-lg p-4 mb-2 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {hasSubSellers && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-muted-foreground hover:text-muted-foreground"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{staff.name}</h4>
                <span className="px-2 py-0.5 text-xs font-semibold bg-accent text-primary rounded-full">
                  {staff.role}
                </span>
                {staff.hierarchyLevel > 1 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                    Level {staff.hierarchyLevel}
                  </span>
                )}
                {staff.canAssignSubSellers && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-success/10 text-success rounded-full">
                    Can Assign
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="w-3 h-3" />
                {staff.email}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {/* Allocated Tickets */}
                <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                  <PackageCheck className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{staff.allocatedTickets || 0}</span>
                    <span className="text-xs text-primary">allocated</span>
                  </div>
                </div>

                {/* Tickets Sold */}
                <div className="flex items-center gap-2 text-sm bg-success/10 px-3 py-2 rounded-lg">
                  <Ticket className="w-4 h-4 text-success" />
                  <div className="flex flex-col">
                    <span className="font-bold text-success">{staff.ticketsSold || 0}</span>
                    <span className="text-xs text-success">sold</span>
                  </div>
                </div>

                {/* Tickets Remaining */}
                <div className="flex items-center gap-2 text-sm bg-warning/10 px-3 py-2 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-warning" />
                  <div className="flex flex-col">
                    <span className="font-bold text-warning">{staff.ticketsRemaining || 0}</span>
                    <span className="text-xs text-warning">remaining</span>
                  </div>
                </div>

                {/* Commission Earned */}
                <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">
                      ${(staff.commissionEarned / 100).toFixed(2)}
                    </span>
                    <span className="text-xs text-primary">earned</span>
                  </div>
                </div>

                {/* Sub-sellers count if applicable */}
                {hasSubSellers && (
                  <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{staff.subSellers.length}</span>
                      <span className="text-xs text-primary">sub-sellers</span>
                    </div>
                  </div>
                )}
              </div>
              {staff.parentCommissionPercent !== undefined &&
                staff.subSellerCommissionPercent !== undefined && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Commission split: Parent {staff.parentCommissionPercent}% | Sub-seller{" "}
                    {staff.subSellerCommissionPercent}%
                  </div>
                )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditStaff(staff)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
              title="Edit staff member"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRemoveStaff(staff._id)}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Remove staff member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Render sub-sellers recursively */}
      {isExpanded && hasSubSellers && (
        <div className="mt-2">
          {staff.subSellers.map((subSeller: any) => (
            <HierarchyNode
              key={subSeller._id}
              staff={subSeller}
              handleRemoveStaff={handleRemoveStaff}
              handleEditStaff={handleEditStaff}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaffManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showCopyRoster, setShowCopyRoster] = useState(false);
  const [selectedSourceEvent, setSelectedSourceEvent] = useState<string>("");
  const [copyAllocations, setCopyAllocations] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<"allocations" | "commission" | "deactivate" | null>(
    null
  );
  const [bulkAllocationValue, setBulkAllocationValue] = useState("");
  const [bulkCommissionType, setBulkCommissionType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [bulkCommissionValue, setBulkCommissionValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<StaffRole>("MANAGER");
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // Form state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [commissionValue, setCommissionValue] = useState("");
  const [canScan, setCanScan] = useState(false);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const eventStaff = useQuery(api.staff.queries.getEventStaff, { eventId });
  const organizerEvents = useQuery(api.staff.queries.getOrganizerEventsForCopy);

  const addStaffMember = useMutation(api.staff.mutations.addStaffMember);
  const removeStaffMember = useMutation(api.staff.mutations.removeStaffMember);
  const updateStaffMember = useMutation(api.staff.mutations.updateStaffMember);
  const updateStaffPermissions = useMutation(api.staff.mutations.updateStaffPermissions);
  const copyRosterFromEvent = useMutation(api.staff.mutations.copyRosterFromEvent);
  const hierarchyTree = useQuery(api.staff.queries.getHierarchyTree, { eventId });

  // Redirect if event not found
  useEffect(() => {
    if (event === null) {
      router.push("/organizer/events");
    }
  }, [event, router]);

  const isLoading = event === undefined || currentUser === null || eventStaff === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Event not found
  if (event === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="bg-card rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground mb-4">Event not found or has been deleted.</p>
          <Link href="/organizer/events" className="text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // Debug logging

  // Check if user is the organizer (removed for now to allow access)
  // TEMPORARY: Commenting out permission check to debug
  /*
  if (event.organizerId !== currentUser._id && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
  */

  const handleAddStaff = async () => {
    if (!staffEmail || !staffName) {
      toast.error("Please enter staff email and name");
      return;
    }

    const commissionAmount =
      commissionType === "PERCENTAGE"
        ? parseFloat(commissionValue)
        : parseFloat(commissionValue) * 100; // Convert dollars to cents

    try {
      await addStaffMember({
        eventId,
        email: staffEmail,
        name: staffName,
        phone: staffPhone || undefined,
        role: selectedRole,
        canScan: canScan,
        commissionType,
        commissionValue: commissionAmount,
      });

      // Reset form
      setStaffEmail("");
      setStaffName("");
      setStaffPhone("");
      setCommissionValue("");
      setCanScan(false);
      setShowAddStaff(false);
      toast.success("Staff member added successfully!");
    } catch (error: any) {
      console.error("Add staff error:", error);
      toast.error(error.message || "Failed to add staff member");
    }
  };

  const handleRemoveStaff = async (staffId: Id<"eventStaff">) => {
    if (!confirm("Are you sure you want to remove this staff member?")) {
      return;
    }

    try {
      await removeStaffMember({ staffId });
      toast.success("Staff member removed successfully!");
    } catch (error: any) {
      console.error("Remove staff error:", error);
      toast.error(error.message || "Failed to remove staff member");
    }
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffPhone(staff.phone || "");
    setCanScan(staff.canScan || false);
    setCommissionType(staff.commissionType || "PERCENTAGE");
    setCommissionValue(
      staff.commissionType === "FIXED"
        ? (staff.commissionValue / 100).toString()
        : staff.commissionValue?.toString() || ""
    );
    setShowEditStaff(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !staffName) {
      toast.error("Please enter staff name");
      return;
    }

    const commissionAmount =
      commissionType === "PERCENTAGE"
        ? parseFloat(commissionValue)
        : parseFloat(commissionValue) * 100; // Convert dollars to cents

    try {
      await updateStaffMember({
        staffId: editingStaff._id,
        name: staffName,
        phone: staffPhone || undefined,
        canScan,
        commissionType,
        commissionValue: commissionAmount,
      });

      // Reset form
      setEditingStaff(null);
      setStaffName("");
      setStaffPhone("");
      setCommissionValue("");
      setCanScan(false);
      setShowEditStaff(false);
      toast.success("Staff member updated successfully!");
    } catch (error: any) {
      console.error("Update staff error:", error);
      toast.error(error.message || "Failed to update staff member");
    }
  };

  const handleToggleSubSellerPermission = async (
    staffId: Id<"eventStaff">,
    currentValue: boolean
  ) => {
    try {
      await updateStaffPermissions({
        staffId,
        canAssignSubSellers: !currentValue,
      });
    } catch (error: any) {
      console.error("Update permissions error:", error);
      toast.error(error.message || "Failed to update permissions");
    }
  };

  const handleCopyRoster = async () => {
    if (!selectedSourceEvent) {
      toast.error("Please select an event to copy from");
      return;
    }

    if (selectedSourceEvent === eventId) {
      toast.error("Cannot copy roster from the same event");
      return;
    }

    try {
      const result = await copyRosterFromEvent({
        sourceEventId: selectedSourceEvent as Id<"events">,
        targetEventId: eventId,
        copyAllocations,
      });

      toast.success(result.message || "Staff roster copied successfully!");
      setShowCopyRoster(false);
      setSelectedSourceEvent("");
      setCopyAllocations(false);
    } catch (error: any) {
      console.error("Copy roster error:", error);
      toast.error(error.message || "Failed to copy roster");
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(filteredStaff.map((s) => s._id)));
    }
  };

  const handleSelectStaff = (staffId: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId);
    } else {
      newSelected.add(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleBulkAllocations = async () => {
    if (!bulkAllocationValue || selectedStaff.size === 0) {
      toast.error("Please enter allocation value and select staff members");
      return;
    }

    try {
      const allocation = parseInt(bulkAllocationValue);
      const promises = Array.from(selectedStaff).map((staffId) =>
        updateStaffMember({
          staffId: staffId as Id<"eventStaff">,
          allocatedTickets: allocation,
        })
      );

      await Promise.all(promises);
      toast.success(`Updated allocations for ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setBulkAllocationValue("");
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk allocation error:", error);
      toast.error(error.message || "Failed to update allocations");
    }
  };

  const handleBulkCommission = async () => {
    if (!bulkCommissionValue || selectedStaff.size === 0) {
      toast.error("Please enter commission value and select staff members");
      return;
    }

    try {
      const commissionAmount =
        bulkCommissionType === "PERCENTAGE"
          ? parseFloat(bulkCommissionValue)
          : parseFloat(bulkCommissionValue) * 100;

      const promises = Array.from(selectedStaff).map((staffId) =>
        updateStaffMember({
          staffId: staffId as Id<"eventStaff">,
          commissionType: bulkCommissionType,
          commissionValue: commissionAmount,
        })
      );

      await Promise.all(promises);
      toast.success(`Updated commission for ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setBulkCommissionValue("");
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk commission error:", error);
      toast.error(error.message || "Failed to update commission");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedStaff.size === 0) {
      toast.error("Please select staff members to deactivate");
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${selectedStaff.size} staff member(s)?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedStaff).map((staffId) =>
        removeStaffMember({ staffId: staffId as Id<"eventStaff"> })
      );

      await Promise.all(promises);
      toast.success(`Deactivated ${selectedStaff.size} staff members`);
      setShowBulkActions(false);
      setBulkAction(null);
      setSelectedStaff(new Set());
    } catch (error: any) {
      console.error("Bulk deactivate error:", error);
      toast.error(error.message || "Failed to deactivate staff");
    }
  };

  const filteredStaff = eventStaff.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/organizer/events`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
              <p className="text-muted-foreground mt-1">{event.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyRoster(true)}
                className="flex items-center gap-2 px-6 py-3 bg-card text-primary border-2 border-primary rounded-lg hover:bg-primary/10 transition-colors shadow-md hover:shadow-lg"
              >
                <Copy className="w-5 h-5" />
                Copy Roster
              </button>
              <button
                onClick={() => setShowAddStaff(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* View Mode Switcher */}
        <div className="bg-card rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "list"
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("hierarchy")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "hierarchy"
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                Hierarchy Tree
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {viewMode === "list" && (
          <div className="bg-card rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {filteredStaff.length > 0 && (
                <label className="flex items-center gap-2 px-4 py-3 bg-muted border border-border rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={
                      selectedStaff.size === filteredStaff.length && filteredStaff.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    Select All
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {viewMode === "list" && selectedStaff.size > 0 && (
          <div className="bg-primary/10 border border-primary rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">
                  {selectedStaff.size} staff member{selectedStaff.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedStaff(new Set())}
                  className="text-sm text-primary hover:underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBulkAction("allocations");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-card text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium"
                >
                  Set Allocations
                </button>
                <button
                  onClick={() => {
                    setBulkAction("commission");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-card text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium"
                >
                  Set Commission
                </button>
                <button
                  onClick={() => {
                    setBulkAction("deactivate");
                    setShowBulkActions(true);
                  }}
                  className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff List or Hierarchy Tree */}
        {viewMode === "hierarchy" ? (
          // Hierarchy Tree View
          <div className="bg-card rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Staff Hierarchy Tree</h3>
            {hierarchyTree && hierarchyTree.length > 0 ? (
              <div className="space-y-4">
                {hierarchyTree.map((staff) => (
                  <HierarchyNode
                    key={staff._id}
                    staff={staff}
                    handleRemoveStaff={handleRemoveStaff}
                    handleEditStaff={handleEditStaff}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No staff members yet. Add your first staff member to get started.
              </div>
            )}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No staff members yet</h3>
            <p className="text-muted-foreground mb-6">
              Add staff members to help sell tickets for this event
            </p>
            <button
              onClick={() => setShowAddStaff(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Staff Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff._id}
                className={`bg-card rounded-lg shadow-md border-2 p-6 hover:shadow-lg transition-all ${
                  selectedStaff.has(staff._id) ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedStaff.has(staff._id)}
                      onChange={() => handleSelectStaff(staff._id)}
                      className="mt-1 w-5 h-5 text-primary border-border rounded focus:ring-primary cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{staff.name}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {staff.email}
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {staff.phone}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                          {staff.role}
                        </span>
                        {staff.hierarchyLevel && staff.hierarchyLevel > 1 && (
                          <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                            Level {staff.hierarchyLevel}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          {staff.commissionType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {staff.commissionValue}% commission
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />$
                              {((staff.commissionValue || 0) / 100).toFixed(2)} per ticket
                            </>
                          )}
                        </div>
                      </div>

                      {/* Hierarchy Permissions */}
                      {staff.hierarchyLevel === 1 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staff.canAssignSubSellers || false}
                              onChange={() =>
                                handleToggleSubSellerPermission(
                                  staff._id,
                                  staff.canAssignSubSellers || false
                                )
                              }
                              className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-foreground">
                                Can assign sub-sellers
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Allow this staff member to recruit and manage their own sales team
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      <div className="mt-3 text-sm text-muted-foreground">
                        Added {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStaff(staff)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                      title="Edit staff member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveStaff(staff._id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove staff member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Add Staff Member</h2>
              <p className="text-muted-foreground mt-1">
                Add a team member to help sell tickets for this event
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "MANAGER",
                      label: "Manager",
                      desc: "Full access, can invite sellers, earns override",
                    },
                    {
                      value: "SELLER",
                      label: "Seller",
                      desc: "Sells assigned tiers, earns commission",
                    },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value as StaffRole)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        selectedRole === role.value
                          ? "border-primary bg-accent"
                          : "border hover:border"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{role.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Scan Permission - available for both roles */}
                <div className="mt-4 p-3 bg-card rounded-lg border">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canScan}
                      onChange={(e) => setCanScan(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border focus:ring-ring"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        Can scan tickets at door
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Enable if they will work check-in
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Staff Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Commission Structure (for all selling roles) */}
              {(selectedRole === "MANAGER" || selectedRole === "SELLER" || selectedRole === "TEAM_MEMBERS" || selectedRole === "ASSOCIATES") && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Commission Structure</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCommissionType("PERCENTAGE")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "PERCENTAGE"
                            ? "border-primary bg-accent"
                            : "border hover:border"
                        }`}
                      >
                        <Percent className="w-6 h-6 mx-auto mb-2 text-foreground" />
                        <p className="font-semibold text-foreground">Percentage</p>
                        <p className="text-xs text-muted-foreground mt-1">% of ticket price</p>
                      </button>

                      <button
                        onClick={() => setCommissionType("FIXED")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "FIXED"
                            ? "border-primary bg-accent"
                            : "border hover:border"
                        }`}
                      >
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-foreground" />
                        <p className="font-semibold text-foreground">Fixed</p>
                        <p className="text-xs text-muted-foreground mt-1">$ per ticket</p>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {commissionType === "PERCENTAGE"
                          ? "Percentage (%)"
                          : "Amount per Ticket ($)"}
                      </label>
                      <div className="relative">
                        {commissionType === "FIXED" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          placeholder={commissionType === "PERCENTAGE" ? "10" : "5.00"}
                          className={`w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            commissionType === "FIXED" ? "pl-8" : ""
                          }`}
                        />
                        {commissionType === "PERCENTAGE" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-card flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddStaff(false)}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaff && editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Edit Staff Member</h2>
              <p className="text-muted-foreground mt-1">Update {editingStaff.name}'s information</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Role Display (read-only) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <div className="px-4 py-3 bg-card border border rounded-lg">
                  <span className="font-semibold text-foreground">{editingStaff.role}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role cannot be changed after creation
                  </p>
                </div>
              </div>

              {/* Staff Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-card border border rounded-lg">
                    <span className="text-foreground">{editingStaff.email}</span>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Scanning Permission - available for all roles */}
              <div className="p-3 bg-card rounded-lg border">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canScan}
                    onChange={(e) => setCanScan(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border focus:ring-ring"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Can scan tickets at door
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enable if they will work check-in
                    </p>
                  </div>
                </label>
              </div>

              {/* Commission Structure (for all selling roles) */}
              {(editingStaff.role === "TEAM_MEMBERS" || editingStaff.role === "ASSOCIATES" || editingStaff.role === "MANAGER" || editingStaff.role === "SELLER") && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-foreground mb-4">Commission Structure</h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCommissionType("PERCENTAGE")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "PERCENTAGE"
                            ? "border-primary bg-accent"
                            : "border hover:border"
                        }`}
                      >
                        <Percent className="w-6 h-6 mx-auto mb-2 text-foreground" />
                        <p className="font-semibold text-foreground">Percentage</p>
                        <p className="text-xs text-muted-foreground mt-1">% of ticket price</p>
                      </button>

                      <button
                        onClick={() => setCommissionType("FIXED")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          commissionType === "FIXED"
                            ? "border-primary bg-accent"
                            : "border hover:border"
                        }`}
                      >
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-foreground" />
                        <p className="font-semibold text-foreground">Fixed</p>
                        <p className="text-xs text-muted-foreground mt-1">$ per ticket</p>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {commissionType === "PERCENTAGE"
                          ? "Percentage (%)"
                          : "Amount per Ticket ($)"}
                      </label>
                      <div className="relative">
                        {commissionType === "FIXED" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          placeholder={commissionType === "PERCENTAGE" ? "10" : "5.00"}
                          className={`w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            commissionType === "FIXED" ? "pl-8" : ""
                          }`}
                        />
                        {commissionType === "PERCENTAGE" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-card flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditStaff(false);
                  setEditingStaff(null);
                  setStaffName("");
                  setStaffPhone("");
                  setCommissionValue("");
                  setCanScan(false);
                }}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStaff}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Roster Modal */}
      {showCopyRoster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Copy Staff Roster</h2>
              <p className="text-muted-foreground mt-1">
                Copy staff members from another event to this event
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Event to Copy From *
                </label>
                <select
                  value={selectedSourceEvent}
                  onChange={(e) => setSelectedSourceEvent(e.target.value)}
                  className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Select an event --</option>
                  {organizerEvents
                    ?.filter((e) => e._id !== eventId)
                    .map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name}{" "}
                        {e.startDate ? `(${new Date(e.startDate).toLocaleDateString()})` : ""}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Only events you organize are shown</p>
              </div>

              {/* Preview */}
              {selectedSourceEvent && (
                <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">What will be copied?</h3>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• All active staff members from the selected event</li>
                        <li>• Staff roles and commission settings</li>
                        <li>• Parent-child relationships (team members and their associates)</li>
                        <li>• Permissions (scanning, sub-seller assignment)</li>
                      </ul>
                      <p className="text-sm text-foreground mt-3 font-medium">
                        Note: Sales history and commission earned will NOT be copied (starts fresh
                        for this event)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Copy Allocations Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-card border border rounded-lg">
                <input
                  type="checkbox"
                  id="copyAllocations"
                  checked={copyAllocations}
                  onChange={(e) => setCopyAllocations(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border rounded focus:ring-primary"
                />
                <label htmlFor="copyAllocations" className="flex-1 cursor-pointer">
                  <div className="font-medium text-foreground">Copy ticket allocations</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    If checked, staff members will receive the same ticket allocations as the source
                    event. If unchecked, allocations will start at 0 and you can set them manually.
                  </div>
                </label>
              </div>

              {/* Warnings */}
              {eventStaff.length > 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-warning mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-warning-foreground">
                        Warning: This event already has staff
                      </h4>
                      <p className="text-sm text-warning mt-1">
                        This event has {eventStaff.length} existing staff member
                        {eventStaff.length !== 1 ? "s" : ""}. Copying will add new staff members
                        from the selected event. No existing staff will be removed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-card border-t">
              <button
                onClick={() => {
                  setShowCopyRoster(false);
                  setSelectedSourceEvent("");
                  setCopyAllocations(false);
                }}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyRoster}
                disabled={!selectedSourceEvent}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:bg-muted-foreground disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Staff Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActions && bulkAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">
                {bulkAction === "allocations" && "Set Ticket Allocations"}
                {bulkAction === "commission" && "Set Commission"}
                {bulkAction === "deactivate" && "Deactivate Staff Members"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {bulkAction === "deactivate"
                  ? `Deactivate ${selectedStaff.size} selected staff member(s)`
                  : `Update ${selectedStaff.size} selected staff member(s)`}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {bulkAction === "allocations" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ticket Allocation *
                  </label>
                  <input
                    type="number"
                    value={bulkAllocationValue}
                    onChange={(e) => setBulkAllocationValue(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter number of tickets"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will set the ticket allocation for all selected staff members
                  </p>
                </div>
              )}

              {bulkAction === "commission" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Commission Type *
                    </label>
                    <select
                      value={bulkCommissionType}
                      onChange={(e) =>
                        setBulkCommissionType(e.target.value as "PERCENTAGE" | "FIXED")
                      }
                      className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Commission Value *
                    </label>
                    <input
                      type="number"
                      value={bulkCommissionValue}
                      onChange={(e) => setBulkCommissionValue(e.target.value)}
                      min="0"
                      step={bulkCommissionType === "PERCENTAGE" ? "0.1" : "0.01"}
                      className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={
                        bulkCommissionType === "PERCENTAGE"
                          ? "Enter percentage (e.g., 10)"
                          : "Enter dollar amount (e.g., 5.00)"
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bulkCommissionType === "PERCENTAGE"
                        ? "Percentage of ticket price"
                        : "Fixed dollar amount per ticket sold"}
                    </p>
                  </div>
                </div>
              )}

              {bulkAction === "deactivate" && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-destructive mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive">
                        Warning: This action cannot be undone
                      </h4>
                      <p className="text-sm text-destructive mt-1">Deactivating staff members will:</p>
                      <ul className="text-sm text-destructive mt-2 space-y-1 ml-4">
                        <li>• Remove them from this event</li>
                        <li>• Prevent them from selling tickets</li>
                        <li>• Keep their sales history intact</li>
                      </ul>
                      <p className="text-sm text-destructive mt-2 font-medium">
                        You can add them back later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-card border-t">
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setBulkAction(null);
                  setBulkAllocationValue("");
                  setBulkCommissionValue("");
                }}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkAction === "allocations") handleBulkAllocations();
                  else if (bulkAction === "commission") handleBulkCommission();
                  else if (bulkAction === "deactivate") handleBulkDeactivate();
                }}
                className={`px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2 ${
                  bulkAction === "deactivate"
                    ? "bg-destructive text-white hover:bg-destructive/80"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {bulkAction === "allocations" && "Update Allocations"}
                {bulkAction === "commission" && "Update Commission"}
                {bulkAction === "deactivate" && "Deactivate Staff"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
