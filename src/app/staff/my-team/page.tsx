"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Percent,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type StaffRole = "STAFF" | "TEAM_MEMBERS";

export default function MyTeamPage() {
  const [showAddSubSeller, setShowAddSubSeller] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "TEAM_MEMBERS" as StaffRole,
    parentCommissionPercent: "",
    subSellerCommissionPercent: "",
    autoAssignToNewEvents: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const myGlobalSubSellers = useQuery(api.staff.queries.getMyGlobalSubSellers);
  const addGlobalSubSeller = useMutation(api.staff.mutations.addGlobalSubSeller);
  const toggleAutoAssign = useMutation(api.staff.mutations.toggleStaffAutoAssign);
  const removeStaff = useMutation(api.staff.mutations.removeStaffMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email) {
      setError("Please enter name and email");
      return;
    }

    const parentPercent = parseFloat(formData.parentCommissionPercent);
    const subSellerPercent = parseFloat(formData.subSellerCommissionPercent);

    if (isNaN(parentPercent) || isNaN(subSellerPercent)) {
      setError("Please enter valid commission percentages");
      return;
    }

    if (parentPercent + subSellerPercent > 100) {
      setError("Total commission cannot exceed 100%");
      return;
    }

    try {
      await addGlobalSubSeller({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        canScan: formData.role === "STAFF",
        parentCommissionPercent: parentPercent,
        subSellerCommissionPercent: subSellerPercent,
        autoAssignToNewEvents: formData.autoAssignToNewEvents,
      });

      setSuccess("Sub-seller added to your default team!");
      setShowAddSubSeller(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "TEAM_MEMBERS",
        parentCommissionPercent: "",
        subSellerCommissionPercent: "",
        autoAssignToNewEvents: true,
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sub-seller");
    }
  };

  const handleToggleAutoAssign = async (staffId: Id<"eventStaff">, currentValue: boolean) => {
    try {
      await toggleAutoAssign({
        staffId,
        autoAssignToNewEvents: !currentValue,
      });
      toast.success("Auto-assign setting updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle auto-assign");
    }
  };

  const handleRemoveSubSeller = async (staffId: Id<"eventStaff">) => {
    try {
      await removeStaff({ staffId });
      toast.success("Sub-seller removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove sub-seller");
    }
  };

  if (myGlobalSubSellers === undefined) {
    return <LoadingSpinner fullPage text="Loading team..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-2 text-primary hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-8 h-8" />
          My Default Team
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your default sub-seller roster. These team members will be automatically assigned
          to events when you join them.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-success/10 border border-success rounded-lg p-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="text-success">{success}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-accent border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground">
            <p className="font-semibold mb-1">How Your Default Team Works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sub-sellers added here are your default roster</li>
              <li>When you join a new event, they'll be automatically added under you</li>
              <li>You can still customize their settings per event after creation</li>
              <li>Toggle auto-assign on/off for each sub-seller individually</li>
              <li>Commission splits are configured here and applied to all new events</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Sub-Seller Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowAddSubSeller(true)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Default Sub-Seller
        </button>
      </div>

      {/* Sub-Sellers List */}
      {myGlobalSubSellers.length === 0 ? (
        <div className="bg-card rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Default Sub-Sellers Yet</h3>
          <p className="text-muted-foreground mb-6">
            Add sub-sellers to your default team to have them automatically assigned when you join
            events.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {myGlobalSubSellers.map((subSeller) => (
              <div key={subSeller._id} className="bg-card rounded-lg shadow-md p-4 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{subSeller.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Referral: {subSeller.referralCode}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                    {subSeller.role}
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

                <div className="grid grid-cols-2 gap-3 text-sm mb-3 py-3 border-t border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Commission Split</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Percent className="w-3 h-3 text-success" />
                      <span className="font-medium text-sm">You: {subSeller.parentCommissionPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="w-3 h-3 text-primary" />
                      <span className="text-sm">Them: {subSeller.subSellerCommissionPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auto-Assign</p>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleAutoAssign(
                          subSeller._id,
                          subSeller.autoAssignToNewEvents || false
                        )
                      }
                      className="flex items-center gap-1 mt-1"
                    >
                      {subSeller.autoAssignToNewEvents ? (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <XCircle className="w-4 h-4" />
                          Disabled
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubSeller(subSeller._id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Remove sub-seller"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Commission Split
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Auto-Assign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {myGlobalSubSellers.map((subSeller) => (
                    <tr key={subSeller._id} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{subSeller.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Referral: {subSeller.referralCode}
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
                        <span className="px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                          {subSeller.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-success" />
                            <span className="font-medium">
                              You: {subSeller.parentCommissionPercent}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-primary" />
                            <span>Them: {subSeller.subSellerCommissionPercent}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAutoAssign(
                              subSeller._id,
                              subSeller.autoAssignToNewEvents || false
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          {subSeller.autoAssignToNewEvents ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Enabled</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <XCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">Disabled</span>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubSeller(subSeller._id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove sub-seller"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Sub-Seller Modal */}
      {showAddSubSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-foreground">Add Default Sub-Seller</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-2">
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
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as StaffRole })
                    }
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="TEAM_MEMBERS">Team Members</option>
                  </select>
                </div>

                <div className="bg-warning/10 border border-warning rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">Commission Split</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how commissions are split between you and your sub-seller
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Commission %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.parentCommissionPercent}
                          onChange={(e) =>
                            setFormData({ ...formData, parentCommissionPercent: e.target.value })
                          }
                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Sub-Seller Commission %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.subSellerCommissionPercent}
                          onChange={(e) =>
                            setFormData({ ...formData, subSellerCommissionPercent: e.target.value })
                          }
                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Total must not exceed 100%. Remaining percentage goes to the event organizer.
                  </p>
                </div>

                <div className="bg-accent border border-border rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoAssignToNewEvents}
                      onChange={(e) =>
                        setFormData({ ...formData, autoAssignToNewEvents: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        Auto-assign to new events
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically add this sub-seller when you join new events
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
                >
                  Add to Default Team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubSeller(false);
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
