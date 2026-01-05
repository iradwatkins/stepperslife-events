"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Calendar,
  Info,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { CapacityProgressBar } from "@/components/events/CapacityProgressBar";
import {
  CapacityAwareTicketEditor,
  TicketTier as EditorTicketTier,
} from "@/components/events/CapacityAwareTicketEditor";
import { FirstEventCongratsModal } from "@/components/organizer/FirstEventCongratsModal";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function TicketTiersPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [showAddTier, setShowAddTier] = useState(false);
  const [editingTier, setEditingTier] = useState<Id<"ticketTiers"> | null>(null);
  const [showEditTier, setShowEditTier] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Duplicate tier state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingTierId, setDuplicatingTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [duplicateNewName, setDuplicateNewName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Delete tier state
  const [tierToDelete, setTierToDelete] = useState<Id<"ticketTiers"> | null>(null);
  const deleteConfirmDialog = useConfirmDialog();

  // Form state - now using CapacityAwareTicketEditor format
  const [newTiers, setNewTiers] = useState<EditorTicketTier[]>([]);
  const [editTierData, setEditTierData] = useState<EditorTicketTier[]>([]);

  const event = useQuery(api.events.queries.getEventById, { eventId });
  // Use a direct query for ticket tiers instead of the public query which requires PUBLISHED status
  const ticketTiersData = useQuery(api.tickets.queries.getTicketsByEvent, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const myEvents = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const creditBalance = useQuery(api.credits.queries.getMyCredits);

  const createTier = useMutation(api.tickets.mutations.createTicketTier);
  const updateTier = useMutation(api.tickets.mutations.updateTicketTier);
  const deleteTier = useMutation(api.tickets.mutations.deleteTicketTier);
  const duplicateTier = useMutation(api.tickets.mutations.duplicateTicketTier);
  const markPopupShown = useMutation(api.users.mutations.markFirstEventTicketPopupShown);

  // Show congratulations popup for first event
  useEffect(() => {
    if (
      currentUser &&
      myEvents &&
      creditBalance &&
      event &&
      !currentUser.firstEventTicketPopupShown
    ) {
      // Check if this is the first event AND user has 1000 free credits
      const isFirstEvent = myEvents.length === 1 && myEvents[0]._id === eventId;
      const hasFreeCredits =
        creditBalance.creditsRemaining === 1000 && !creditBalance.firstEventFreeUsed;

      if (isFirstEvent && hasFreeCredits) {
        setShowCongratsModal(true);
      }
    }
  }, [currentUser, myEvents, creditBalance, event, eventId]);

  const handleCloseCongratsModal = async () => {
    setShowCongratsModal(false);
    try {
      await markPopupShown({});
    } catch (error) {
      console.error("Failed to mark popup as shown:", error);
    }
  };

  const isLoading = event === undefined;

  if (isLoading) {
    return (
      <LoadingSpinner fullPage text="Loading ticket tiers..." />
    );
  }

  // No need to check organizer permissions here - the proxy middleware already handles auth
  // If the user got this far, they're authenticated and authorized

  // TypeScript null check - event is guaranteed to exist after loading check
  if (!event) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-destructive">Event not found</div>
      </div>
    );
  }

  const handleOpenAddTier = () => {
    // Initialize with one empty tier
    setNewTiers([
      {
        id: `tier-${Date.now()}`,
        name: "",
        description: "",
        price: "",
        quantity: "",
      },
    ]);
    setShowAddTier(true);
  };

  const handleCreateTier = async () => {
    const tier = newTiers[0];
    if (!tier || !tier.name || !tier.price || !tier.quantity) {
      toast.error("Please fill in all required fields (Name, Price, Quantity)");
      return;
    }

    try {
      const priceCents = Math.round(parseFloat(tier.price) * 100);
      const quantity = parseInt(tier.quantity);

      await createTier({
        eventId,
        name: tier.name,
        description: tier.description || undefined,
        price: priceCents,
        quantity,
        // Simple table package support
        isTablePackage: tier.isTablePackage,
        tableCapacity: tier.seatsPerTable,
      });

      setNewTiers([]);
      setShowAddTier(false);
      toast.success("Ticket tier created successfully!");
    } catch (error: any) {
      console.error("Create tier error:", error);
      toast.error(error.message || "Failed to create ticket tier");
    }
  };

  const handleEditTier = (tier: any) => {
    setEditingTier(tier._id);

    // Convert database tier to simplified editor format
    const editorTier: EditorTicketTier = {
      id: tier._id,
      name: tier.name,
      description: tier.description || "",
      price: (tier.price / 100).toString(),
      quantity: tier.quantity.toString(),
      // Simple table package support
      isTablePackage: tier.isTablePackage,
      seatsPerTable: tier.tableCapacity,
      // Early bird pricing support
      pricingTiers: tier.pricingTiers,
    };

    setEditTierData([editorTier]);
    setShowEditTier(true);
  };

  const handleUpdateTier = async () => {
    const tier = editTierData[0];
    if (!editingTier || !tier || !tier.name || !tier.price || !tier.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const priceCents = Math.round(parseFloat(tier.price) * 100);
      const quantity = parseInt(tier.quantity);

      // Convert pricing tiers to Convex format if they exist
      const pricingTiers = tier.pricingTiers?.map((pt) => ({
        id: pt.id,
        name: pt.name,
        price: Math.round(parseFloat(pt.price) * 100), // Convert to cents
        availableFrom: new Date(pt.availableFrom).getTime(),
        availableUntil: pt.availableUntil ? new Date(pt.availableUntil).getTime() : undefined,
      }));

      await updateTier({
        tierId: editingTier,
        name: tier.name,
        description: tier.description || undefined,
        price: priceCents,
        quantity,
        // Simple table package support
        isTablePackage: tier.isTablePackage,
        tableCapacity: tier.seatsPerTable,
        // Early bird pricing
        pricingTiers: pricingTiers,
      });

      setEditTierData([]);
      setEditingTier(null);
      setShowEditTier(false);
      toast.success("Ticket tier updated successfully!");
    } catch (error: any) {
      console.error("Update tier error:", error);
      toast.error(error.message || "Failed to update ticket tier");
    }
  };

  const handleDeleteTier = async (tierId: Id<"ticketTiers">) => {
    setTierToDelete(tierId);
    deleteConfirmDialog.showConfirm({
      title: "Delete Ticket Tier?",
      description: "Are you sure you want to delete this ticket tier? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteTier({ tierId });
          setTierToDelete(null);
          toast.success("Ticket tier deleted successfully!");
        } catch (error: any) {
          console.error("Delete tier error:", error);
          toast.error(error.message || "Failed to delete ticket tier");
        }
      },
    });
  };

  // Handle opening duplicate dialog
  const handleOpenDuplicate = (tierId: Id<"ticketTiers">, tierName: string) => {
    setDuplicatingTierId(tierId);
    setDuplicateNewName(`${tierName} (Copy)`);
    setShowDuplicateDialog(true);
  };

  // Handle duplicate tier
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
      toast.success("Ticket tier duplicated successfully!");
    } catch (error: any) {
      console.error("Duplicate tier error:", error);
      toast.error(error.message || "Failed to duplicate ticket tier");
    } finally {
      setIsDuplicating(false);
    }
  };

  const tiers = ticketTiersData || [];

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* First Event Congratulations Modal */}
      <FirstEventCongratsModal
        isOpen={showCongratsModal}
        onClose={handleCloseCongratsModal}
        creditsRemaining={creditBalance?.creditsRemaining || 0}
      />

      {/* Header */}
      <header className="bg-card dark:bg-card shadow-sm border-b border-border dark:border">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/organizer/events`}
            className="inline-flex items-center gap-2 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white">Ticket Tiers</h1>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">{event.name}</p>
            </div>
            <button
              onClick={handleOpenAddTier}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Ticket Tier
            </button>
          </div>
        </div>
      </header>

      {/* Capacity Progress Banner */}
      {event.capacity && event.capacity > 0 && tiers.length > 0 && (
        <div className="bg-card dark:bg-card border-b border-border dark:border">
          <div className="container mx-auto px-4 py-6">
            <CapacityProgressBar
              capacity={event.capacity}
              allocated={tiers.reduce((sum, tier) => {
                // Simple capacity calculation
                const qty = tier.quantity || 0;
                if (tier.isTablePackage && tier.tableCapacity) {
                  return sum + qty * tier.tableCapacity; // Tables × seats per table
                }
                return sum + qty; // Individual tickets
              }, 0)}
              sold={tiers.reduce((sum, tier) => {
                // Simple sold calculation
                const sold = tier.sold || 0;
                if (tier.isTablePackage && tier.tableCapacity) {
                  return sum + sold * tier.tableCapacity; // Tables sold × seats per table
                }
                return sum + sold; // Individual tickets sold
              }, 0)}
              showBreakdown={tiers.length <= 6}
              breakdown={tiers.map((tier, index) => {
                const qty = tier.quantity || 0;
                const seats =
                  tier.isTablePackage && tier.tableCapacity ? qty * tier.tableCapacity : qty;
                return {
                  name: tier.name,
                  quantity: seats,
                  color: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6366F1"][
                    index % 6
                  ],
                };
              })}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {tiers.length === 0 ? (
          <div className="bg-card dark:bg-card rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
              No ticket tiers yet
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground mb-6">
              Create ticket tiers to start selling tickets for this event
            </p>
            <button
              onClick={handleOpenAddTier}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ticket Tier
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tiers.map((tier) => {
              // Simple capacity calculation
              const qty = tier.quantity || 0;
              const sold = tier.sold || 0;
              const totalCapacity =
                tier.isTablePackage && tier.tableCapacity ? qty * tier.tableCapacity : qty;
              const totalSold =
                tier.isTablePackage && tier.tableCapacity ? sold * tier.tableCapacity : sold;

              const soldOut = totalSold >= totalCapacity;
              const saleActive = !tier.saleStart || tier.saleStart <= Date.now();
              const saleEnded = tier.saleEnd && tier.saleEnd < Date.now();

              return (
                <div
                  key={tier._id}
                  className="bg-card dark:bg-card rounded-lg shadow-md border border-border dark:border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-foreground dark:text-white">
                          {tier.name}
                        </h3>
                        {tier.isTablePackage && (
                          <span className="px-3 py-1 text-xs font-semibold bg-primary/10 dark:bg-sky-900/30 text-primary dark:text-sky-300 rounded-full">
                            TABLE PACKAGE
                          </span>
                        )}
                        {soldOut && (
                          <span className="px-3 py-1 text-xs font-semibold bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive rounded-full">
                            SOLD OUT
                          </span>
                        )}
                        {!soldOut && saleEnded && (
                          <span className="px-3 py-1 text-xs font-semibold bg-muted dark:bg-card text-foreground dark:text-muted-foreground rounded-full">
                            ENDED
                          </span>
                        )}
                        {!soldOut && !saleActive && (
                          <span className="px-3 py-1 text-xs font-semibold bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning rounded-full">
                            NOT STARTED
                          </span>
                        )}
                      </div>

                      {tier.description && (
                        <p className="text-muted-foreground dark:text-muted-foreground mb-4">{tier.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                            <DollarSign className="w-4 h-4" />
                            Price
                          </div>
                          <p className="text-lg font-bold text-foreground dark:text-white">
                            ${(tier.price / 100).toFixed(2)}
                            {tier.isTablePackage && tier.tableCapacity && (
                              <span className="text-sm text-muted-foreground dark:text-muted-foreground ml-1">
                                ({qty} × {tier.tableCapacity} seats)
                              </span>
                            )}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                            <Users className="w-4 h-4" />
                            {tier.isTablePackage ? "Total Seats" : "Tickets"}
                          </div>
                          <p className="text-lg font-bold text-foreground dark:text-white">
                            {totalSold} / {totalCapacity}
                          </p>
                        </div>

                        {tier.saleStart && (
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              Sale Start
                            </div>
                            <p className="text-sm font-medium text-foreground dark:text-white">
                              {format(new Date(tier.saleStart), "MMM d, h:mm a")}
                            </p>
                          </div>
                        )}

                        {tier.saleEnd && (
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              Sale End
                            </div>
                            <p className="text-sm font-medium text-foreground dark:text-white">
                              {format(new Date(tier.saleEnd), "MMM d, h:mm a")}
                            </p>
                          </div>
                        )}
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
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg transition-colors"
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

      {/* Add Ticket Tier Modal */}
      {showAddTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card dark:bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border dark:border">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">
                Create Ticket Tier
              </h2>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                Configure your ticket type with flexible options
              </p>
            </div>

            <div className="p-6">
              <CapacityAwareTicketEditor
                capacity={event.capacity || 0}
                tiers={newTiers}
                onChange={setNewTiers}
                showPresets={false}
                hideAddButton={true}
              />
            </div>

            <div className="p-6 border-t border-border dark:border bg-muted dark:bg-background flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddTier(false);
                  setNewTiers([]);
                }}
                className="px-6 py-3 text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTier}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Create Ticket Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Tier Modal */}
      {showEditTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card dark:bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border dark:border">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Edit Ticket Tier</h2>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                Update ticket details and configuration
              </p>
            </div>

            <div className="p-6">
              <CapacityAwareTicketEditor
                capacity={event.capacity || 0}
                tiers={editTierData}
                onChange={setEditTierData}
                showPresets={false}
                hideAddButton={true}
              />
            </div>

            <div className="p-6 border-t border-border dark:border bg-muted dark:bg-background flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditTier(false);
                  setEditingTier(null);
                  setEditTierData([]);
                }}
                className="px-6 py-3 text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTier}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Update Ticket Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Ticket Tier Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card dark:bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Copy className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
                  Duplicate Ticket Tier
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground text-sm">
                  Create a copy of this ticket tier with the same settings.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                New Tier Name
              </label>
              <input
                type="text"
                value={duplicateNewName}
                onChange={(e) => setDuplicateNewName(e.target.value)}
                className="w-full px-4 py-2 border border-border dark:border rounded-lg bg-background dark:bg-background text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Tier name"
              />
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                The new tier will have 0 tickets sold and the same price/quantity as the original.
              </p>
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
                className="px-4 py-2 border border-border dark:border text-foreground dark:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-background transition-colors disabled:opacity-50"
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
                    Duplicate Tier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ticket Tier Confirmation */}
      <ConfirmDialog {...deleteConfirmDialog.props} />
    </div>
  );
}
