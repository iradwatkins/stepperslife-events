"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Plus,
  DollarSign,
  Ticket,
  Mail,
  Phone,
  X,
  Check,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function MySubSellersPage() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    allocatedTickets: "",
    parentCommissionPercent: "",
    subSellerCommissionPercent: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const staffPositions = useQuery(api.staff.queries.getStaffDashboard);
  const subSellers = useQuery(
    api.staff.queries.getMySubSellers,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

  const assignSubSeller = useMutation(api.staff.mutations.assignSubSeller);

  // Select first event by default
  if (staffPositions && staffPositions.length > 0 && !selectedEventId) {
    setSelectedEventId(staffPositions[0].event?._id as Id<"events">);
  }

  const selectedPosition = staffPositions?.find((pos) => pos.event?._id === selectedEventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEventId) {
      setError("Please select an event");
      return;
    }

    // Validate commission split
    const parentPercent = parseFloat(formData.parentCommissionPercent);
    const subSellerPercent = parseFloat(formData.subSellerCommissionPercent);

    if (parentPercent + subSellerPercent > 100) {
      setError("Total commission split cannot exceed 100%");
      return;
    }

    if (parentPercent < 0 || subSellerPercent < 0) {
      setError("Commission percentages cannot be negative");
      return;
    }

    try {
      await assignSubSeller({
        eventId: selectedEventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: "ASSOCIATES",
        allocatedTickets: formData.allocatedTickets
          ? parseInt(formData.allocatedTickets)
          : undefined,
        parentCommissionPercent: parentPercent,
        subSellerCommissionPercent: subSellerPercent,
      });

      setSuccess("Sub-seller added successfully!");
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        allocatedTickets: "",
        parentCommissionPercent: "",
        subSellerCommissionPercent: "",
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add sub-seller");
    }
  };

  if (!staffPositions) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (staffPositions.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Staff Positions</h2>
          <p className="text-muted-foreground">You are not assigned as staff for any events yet.</p>
        </div>
      </div>
    );
  }

  const canAssignSubSellers = selectedPosition?.canAssignSubSellers;
  const availableTickets = selectedPosition
    ? selectedPosition.allocatedTickets - selectedPosition.ticketsSold
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-8 h-8" />
          My Sub-Sellers
        </h1>
        <p className="text-muted-foreground mt-1">Manage your team of ticket sellers</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-success/10 border border-success rounded-lg p-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          <span className="text-success">{success}</span>
        </div>
      )}

      {/* Event Selector */}
      {staffPositions.length > 1 && (
        <div className="mb-6 bg-card rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-foreground mb-2">Select Event</label>
          <select
            value={selectedEventId || ""}
            onChange={(e) => setSelectedEventId(e.target.value as Id<"events">)}
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            {staffPositions.map((pos) => (
              <option key={pos.event?._id} value={pos.event?._id}>
                {pos.event?.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Permission Check */}
      {!canAssignSubSellers ? (
        <div className="bg-warning/10 border border-warning rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning mb-1">Permission Required</h3>
              <p className="text-warning">
                You don't have permission to assign sub-sellers for this event. Please contact the
                event organizer to enable this feature.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Sub-Sellers</p>
              <p className="text-3xl font-bold text-foreground">{subSellers?.length || 0}</p>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-success" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Available to Allocate</p>
              <p className="text-3xl font-bold text-foreground">{availableTickets}</p>
            </div>

            <div className="bg-card rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Sub-Seller Sales</p>
              <p className="text-3xl font-bold text-foreground">
                {subSellers?.reduce((sum, s) => sum + s.ticketsSold, 0) || 0}
              </p>
            </div>
          </div>

          {/* Add Sub-Seller Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Sub-Seller
            </button>
          </div>

          {/* Sub-Sellers List */}
          {subSellers && subSellers.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {subSellers.map((subSeller) => (
                  <div key={subSeller._id} className="bg-card rounded-lg shadow-md p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{subSeller.name}</p>
                        <p className="text-xs text-muted-foreground">Level {subSeller.hierarchyLevel}</p>
                      </div>
                      <span className="text-sm font-semibold text-success">
                        ${(subSeller.commissionEarned / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{subSeller.email}</span>
                      </div>
                      {subSeller.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {subSeller.phone}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm mb-3 py-3 border-t border-b border-border">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Allocated</p>
                        <p className="font-medium">{subSeller.allocatedTickets || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Sold</p>
                        <p className="font-semibold">{subSeller.ticketsSold}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="font-medium">{subSeller.availableTickets}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Commission Split</p>
                      <p className="text-foreground">
                        Parent: {subSeller.parentCommissionPercent}% / Sub: {subSeller.subSellerCommissionPercent}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-card rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Allocated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Sold
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Available
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Commission Split
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Earned
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {subSellers.map((subSeller) => (
                        <tr key={subSeller._id} className="hover:bg-muted">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">{subSeller.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Level {subSeller.hierarchyLevel}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                {subSeller.email}
                              </div>
                              {subSeller.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                  {subSeller.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-foreground">
                              {subSeller.allocatedTickets || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-foreground">
                              {subSeller.ticketsSold}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-foreground">
                              {subSeller.availableTickets}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">
                              Parent: {subSeller.parentCommissionPercent}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Sub-seller: {subSeller.subSellerCommissionPercent}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-success">
                              ${(subSeller.commissionEarned / 100).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-lg shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Sub-Sellers Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your sales team by adding your first sub-seller.
              </p>
            </div>
          )}
        </>
      )}

      {/* Add Sub-Seller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h2 className="text-2xl font-bold text-foreground">Add Sub-Seller</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 bg-destructive/10 border border-destructive rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Allocated Tickets
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={availableTickets}
                    value={formData.allocatedTickets}
                    onChange={(e) => setFormData({ ...formData, allocatedTickets: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {availableTickets} tickets available to allocate
                  </p>
                </div>

                <div className="bg-accent border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3">Commission Split</h3>
                  <p className="text-sm text-accent-foreground mb-4">
                    Configure how commissions are split between you and the sub-seller. Your current
                    commission:{" "}
                    {selectedPosition?.commissionValue}
                    {selectedPosition?.commissionType === "PERCENTAGE" ? "%" : " cents"}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Commission % <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.parentCommissionPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, parentCommissionPercent: e.target.value })
                        }
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Sub-Seller Commission % <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.subSellerCommissionPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, subSellerCommissionPercent: e.target.value })
                        }
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  {formData.parentCommissionPercent && formData.subSellerCommissionPercent && (
                    <div className="mt-3 text-sm">
                      <p className="text-foreground">
                        Total:{" "}
                        {parseFloat(formData.parentCommissionPercent) +
                          parseFloat(formData.subSellerCommissionPercent)}
                        %
                        {parseFloat(formData.parentCommissionPercent) +
                          parseFloat(formData.subSellerCommissionPercent) >
                          100 && <span className="text-destructive ml-2">(Exceeds 100%)</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
                >
                  Add Sub-Seller
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                  }}
                  className="flex-1 bg-muted text-foreground py-3 rounded-lg hover:bg-muted/80 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
