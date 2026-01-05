"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Ticket,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Package,
  Copy,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default function ClassEnrollmentsPage({ params }: PageProps) {
  const { classId: classIdStr } = use(params);
  const classId = classIdStr as Id<"events">;
  const router = useRouter();

  const [showAddTier, setShowAddTier] = useState(false);
  const [showEditTier, setShowEditTier] = useState(false);
  const [editingTier, setEditingTier] = useState<Id<"ticketTiers"> | null>(null);

  // Form state
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierQuantity, setTierQuantity] = useState("");

  // Duplicate tier state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingTierId, setDuplicatingTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [duplicateNewName, setDuplicateNewName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Delete tier state
  const [tierToDelete, setTierToDelete] = useState<Id<"ticketTiers"> | null>(null);
  const deleteConfirmDialog = useConfirmDialog();

  const classData = useQuery(api.events.queries.getEventById, { eventId: classId });
  const ticketTiersData = useQuery(api.tickets.queries.getTicketsByEvent, { eventId: classId });

  const createTier = useMutation(api.tickets.mutations.createTicketTier);
  const updateTier = useMutation(api.tickets.mutations.updateTicketTier);
  const deleteTier = useMutation(api.tickets.mutations.deleteTicketTier);
  const duplicateTier = useMutation(api.tickets.mutations.duplicateTicketTier);

  const isLoading = classData === undefined;

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading class enrollments..." />;
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-destructive">Class not found</div>
      </div>
    );
  }

  const resetForm = () => {
    setTierName("");
    setTierDescription("");
    setTierPrice("");
    setTierQuantity("");
  };

  const handleOpenAddTier = () => {
    resetForm();
    setShowAddTier(true);
  };

  const handleCreateTier = async () => {
    if (!tierName || !tierPrice || !tierQuantity) {
      toast.error("Please fill in all required fields (Name, Price, Quantity)");
      return;
    }

    try {
      const priceCents = Math.round(parseFloat(tierPrice) * 100);
      const quantity = parseInt(tierQuantity);

      await createTier({
        eventId: classId,
        name: tierName,
        description: tierDescription || undefined,
        price: priceCents,
        quantity,
      });

      resetForm();
      setShowAddTier(false);
      toast.success("Enrollment tier created successfully!");
    } catch (error: any) {
      console.error("Create tier error:", error);
      toast.error(error.message || "Failed to create enrollment tier");
    }
  };

  const handleEditTier = (tier: any) => {
    setEditingTier(tier._id);
    setTierName(tier.name);
    setTierDescription(tier.description || "");
    setTierPrice((tier.price / 100).toString());
    setTierQuantity(tier.quantity.toString());
    setShowEditTier(true);
  };

  const handleUpdateTier = async () => {
    if (!editingTier || !tierName || !tierPrice || !tierQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const priceCents = Math.round(parseFloat(tierPrice) * 100);
      const quantity = parseInt(tierQuantity);

      await updateTier({
        tierId: editingTier,
        name: tierName,
        description: tierDescription || undefined,
        price: priceCents,
        quantity,
      });

      resetForm();
      setEditingTier(null);
      setShowEditTier(false);
      toast.success("Enrollment tier updated successfully!");
    } catch (error: any) {
      console.error("Update tier error:", error);
      toast.error(error.message || "Failed to update enrollment tier");
    }
  };

  const handleDeleteTier = async (tierId: Id<"ticketTiers">) => {
    setTierToDelete(tierId);
    deleteConfirmDialog.showConfirm({
      title: "Delete Enrollment Option?",
      description: "Are you sure you want to delete this enrollment option? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteTier({ tierId });
          setTierToDelete(null);
          toast.success("Enrollment tier deleted successfully!");
        } catch (error: any) {
          console.error("Delete tier error:", error);
          toast.error(error.message || "Failed to delete enrollment tier");
        }
      },
    });
  };

  const handleOpenDuplicate = (tierId: Id<"ticketTiers">, tierNameStr: string) => {
    setDuplicatingTierId(tierId);
    setDuplicateNewName(`${tierNameStr} (Copy)`);
    setShowDuplicateDialog(true);
  };

  const handleDuplicateTier = async () => {
    if (!duplicatingTierId) return;

    setIsDuplicating(true);
    try {
      await duplicateTier({
        tierId: duplicatingTierId,
        newName: duplicateNewName || undefined,
      });

      setShowDuplicateDialog(false);
      setDuplicatingTierId(null);
      setDuplicateNewName("");
      toast.success("Enrollment tier duplicated successfully!");
    } catch (error: any) {
      console.error("Duplicate tier error:", error);
      toast.error(error.message || "Failed to duplicate enrollment tier");
    } finally {
      setIsDuplicating(false);
    }
  };

  const tiers = ticketTiersData || [];

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
              <span className="font-medium text-foreground text-sm">Instructor View</span>
              <span className="text-warning text-xs ml-2">Manage class enrollment options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/instructor/classes"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Enrollment Options</h1>
              <p className="text-muted-foreground mt-1">{classData.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/instructor/classes/${classId}/attendance`}
                className="flex items-center gap-2 px-5 py-3 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors border border-success/20"
              >
                <ClipboardCheck className="w-5 h-5" />
                Take Attendance
              </Link>
              <button
                onClick={handleOpenAddTier}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Enrollment Option
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Presets */}
        {tiers.length === 0 && (
          <div className="bg-card rounded-lg shadow-md border p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Setup - Common Enrollment Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={async () => {
                  try {
                    await createTier({
                      eventId: classId,
                      name: "Drop-in Class",
                      description: "Single class attendance",
                      price: 2000, // $20
                      quantity: 50,
                    });
                    toast.success("Drop-in tier created!");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create tier");
                  }
                }}
                className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Drop-in Class</span>
                </div>
                <p className="text-sm text-muted-foreground">Single class - $20</p>
              </button>

              <button
                onClick={async () => {
                  try {
                    await createTier({
                      eventId: classId,
                      name: "5-Class Pack",
                      description: "Save with a 5-class package",
                      price: 9000, // $90 (save $10)
                      quantity: 20,
                    });
                    toast.success("5-Class pack created!");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create tier");
                  }
                }}
                className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Package className="w-5 h-5 text-success" />
                  </div>
                  <span className="font-semibold text-foreground">5-Class Pack</span>
                </div>
                <p className="text-sm text-muted-foreground">5 classes - $90 (save $10)</p>
              </button>

              <button
                onClick={async () => {
                  try {
                    await createTier({
                      eventId: classId,
                      name: "10-Class Pack",
                      description: "Best value - 10 classes",
                      price: 16000, // $160 (save $40)
                      quantity: 10,
                    });
                    toast.success("10-Class pack created!");
                  } catch (error: any) {
                    toast.error(error.message || "Failed to create tier");
                  }
                }}
                className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Package className="w-5 h-5 text-warning" />
                  </div>
                  <span className="font-semibold text-foreground">10-Class Pack</span>
                </div>
                <p className="text-sm text-muted-foreground">10 classes - $160 (save $40)</p>
              </button>
            </div>
          </div>
        )}

        {/* Tiers List */}
        {tiers.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No enrollment options yet</h3>
            <p className="text-muted-foreground mb-6">
              Create enrollment options so students can sign up for your class
            </p>
            <button
              onClick={handleOpenAddTier}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Enrollment Option
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier) => {
              const soldOut = tier.sold >= tier.quantity;
              return (
                <div
                  key={tier._id}
                  className="bg-card rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                        {tier.name.toLowerCase().includes("pack") && (
                          <span className="px-3 py-1 text-xs font-semibold bg-success/10 text-success rounded-full">
                            CLASS PACK
                          </span>
                        )}
                        {soldOut && (
                          <span className="px-3 py-1 text-xs font-semibold bg-destructive/10 text-destructive rounded-full">
                            SOLD OUT
                          </span>
                        )}
                      </div>

                      {tier.description && (
                        <p className="text-muted-foreground mb-4">{tier.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <DollarSign className="w-4 h-4" />
                            Price
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            ${(tier.price / 100).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Users className="w-4 h-4" />
                            Available
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            {tier.sold || 0} / {tier.quantity}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Package className="w-4 h-4" />
                            Revenue
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            ${(((tier.sold || 0) * tier.price) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditTier(tier)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                        title="Edit tier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDuplicate(tier._id, tier.name)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Duplicate tier"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTier(tier._id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete tier"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Tier Modal */}
      {showAddTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Create Enrollment Option</h2>
              <p className="text-muted-foreground mt-1">Add a new way for students to enroll</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g., Drop-in Class, 5-Class Pack"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={tierDescription}
                  onChange={(e) => setTierDescription(e.target.value)}
                  placeholder="Describe what's included..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(e.target.value)}
                    placeholder="20.00"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tierQuantity}
                    onChange={(e) => setTierQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-muted flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddTier(false);
                  resetForm();
                }}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTier}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Create Enrollment Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {showEditTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Edit Enrollment Option</h2>
              <p className="text-muted-foreground mt-1">Update enrollment details</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={tierDescription}
                  onChange={(e) => setTierDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tierQuantity}
                    onChange={(e) => setTierQuantity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-muted flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditTier(false);
                  setEditingTier(null);
                  resetForm();
                }}
                className="px-6 py-3 text-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTier}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Update Enrollment Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Tier Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Copy className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">Duplicate Enrollment Option</h3>
                <p className="text-muted-foreground text-sm">
                  Create a copy with the same settings.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-1">
                New Name
              </label>
              <input
                type="text"
                value={duplicateNewName}
                onChange={(e) => setDuplicateNewName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Tier name"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicatingTierId(null);
                  setDuplicateNewName("");
                }}
                disabled={isDuplicating}
                className="px-4 py-2 border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDuplicateTier}
                disabled={isDuplicating}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDuplicating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Duplicating...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog {...deleteConfirmDialog.props} />
    </div>
  );
}
