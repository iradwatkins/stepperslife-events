"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package, DollarSign, Tag, Calendar, TrendingDown, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface TicketTier {
  _id: Id<"ticketTiers">;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  eventId?: Id<"events"> | string;
  eventName?: string;
}

interface BundleData {
  _id: Id<"ticketBundles">;
  name: string;
  description?: string;
  price: number;
  regularPrice?: number;
  percentageSavings?: number;
  includedTiers: IncludedTier[];
  includedTiersDetails?: IncludedTierDetail[];
  totalQuantity: number;
  available: number;
  sold: number;
  saleStart?: number;
  saleEnd?: number;
  bundleType?: "SINGLE_EVENT" | "MULTI_EVENT";
  eventIds?: Id<"events">[];
  isActive: boolean;
}

interface IncludedTierDetail {
  tierId: Id<"ticketTiers">;
  tierName: string;
  quantity: number;
}

interface CreateBundleData {
  eventId: Id<"events">;
  name: string;
  description?: string;
  price: number;
  includedTiers: IncludedTier[];
  totalQuantity: number;
  saleStart?: number;
  saleEnd?: number;
  bundleType: "SINGLE_EVENT" | "MULTI_EVENT";
  eventIds?: Id<"events">[];
}

interface IncludedTier {
  tierId: Id<"ticketTiers">;
  tierName: string;
  quantity: number;
  eventId?: Id<"events"> | string; // For multi-event bundles
  eventName?: string; // For multi-event bundles
}

interface BundleFormData {
  name: string;
  description: string;
  price: string;
  includedTiers: IncludedTier[];
  totalQuantity: string;
  saleStart: string;
  saleEnd: string;
  bundleType: "SINGLE_EVENT" | "MULTI_EVENT";
  selectedEventIds: Id<"events">[]; // For multi-event bundles
}

interface BundleEditorProps {
  eventId: Id<"events">;
}

export function BundleEditor({ eventId }: BundleEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<Id<"ticketBundles"> | null>(null);
  const [formData, setFormData] = useState<BundleFormData>({
    name: "",
    description: "",
    price: "",
    includedTiers: [],
    totalQuantity: "",
    saleStart: "",
    saleEnd: "",
    bundleType: "SINGLE_EVENT",
    selectedEventIds: [eventId], // Start with current event
  });

  // Fetch ticket tiers for this event (for single-event mode)
  const tiers = useQuery(api.events.queries.getEventTicketTiers, {
    eventId,
  }) as TicketTier[] | undefined;

  // Fetch existing bundles
  const bundles = useQuery(api.bundles.queries.getBundlesForEvent, {
    eventId,
    includeInactive: true,
  });

  const createBundle = useMutation(api.bundles.mutations.createTicketBundle);
  const updateBundle = useMutation(api.bundles.mutations.updateTicketBundle);
  const deleteBundle = useMutation(api.bundles.mutations.deleteTicketBundle);

  // Fetch all events from this organizer (for multi-event bundle creation)
  const organizerEvents = useQuery(api.events.queries.getOrganizerEvents, {
    userId: undefined,
  });

  // Fetch tiers from multiple events when in multi-event mode
  const multiEventTiers = useQuery(
    api.tickets.queries.getTiersFromMultipleEvents,
    formData.bundleType === "MULTI_EVENT" && formData.selectedEventIds.length > 0
      ? { eventIds: formData.selectedEventIds }
      : "skip"
  );

  // Use multi-event tiers in multi-event mode, regular tiers in single-event mode
  const availableTiers = formData.bundleType === "MULTI_EVENT" ? multiEventTiers : tiers;

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      includedTiers: [],
      totalQuantity: "",
      saleStart: "",
      saleEnd: "",
      bundleType: "SINGLE_EVENT",
      selectedEventIds: [eventId],
    });
    setIsCreating(false);
    setEditingBundleId(null);
  };

  const addTierToBundle = (
    tierId: Id<"ticketTiers">,
    eventIdParam?: Id<"events"> | string,
    eventNameParam?: string
  ) => {
    const tier = availableTiers?.find((t) => t._id === tierId);
    if (!tier) return;

    // Check if tier already added
    if (formData.includedTiers.some((it) => it.tierId === tierId)) {
      toast.error("This tier is already included in the bundle");
      return;
    }

    const newTier: IncludedTier = {
      tierId,
      tierName: tier.name,
      quantity: 1,
    };

    // Add event info for multi-event bundles
    if (formData.bundleType === "MULTI_EVENT") {
      newTier.eventId = eventIdParam || tier.eventId;
      newTier.eventName = eventNameParam || tier.eventName;
    }

    setFormData({
      ...formData,
      includedTiers: [...formData.includedTiers, newTier],
    });
  };

  const removeTierFromBundle = (tierId: Id<"ticketTiers">) => {
    setFormData({
      ...formData,
      includedTiers: formData.includedTiers.filter((it) => it.tierId !== tierId),
    });
  };

  const updateTierQuantity = (tierId: Id<"ticketTiers">, quantity: number) => {
    setFormData({
      ...formData,
      includedTiers: formData.includedTiers.map((it) =>
        it.tierId === tierId ? { ...it, quantity } : it
      ),
    });
  };

  const calculateRegularPrice = () => {
    if (!availableTiers) return 0;
    let total = 0;
    for (const includedTier of formData.includedTiers) {
      const tier = availableTiers.find((t) => t._id === includedTier.tierId);
      if (tier) {
        total += tier.price * includedTier.quantity;
      }
    }
    return total;
  };

  const calculateSavings = () => {
    const regularPrice = calculateRegularPrice();
    const bundlePrice = parseFloat(formData.price) * 100 || 0;
    return regularPrice - bundlePrice;
  };

  const calculateSavingsPercentage = () => {
    const regularPrice = calculateRegularPrice();
    if (regularPrice === 0) return 0;
    const savings = calculateSavings();
    return Math.round((savings / regularPrice) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.includedTiers.length === 0) {
      toast.error("Please add at least one ticket tier to the bundle");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a bundle name");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid bundle price");
      return;
    }

    if (!formData.totalQuantity || parseInt(formData.totalQuantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const bundleData: CreateBundleData = {
        eventId,
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100),
        includedTiers: formData.includedTiers,
        totalQuantity: parseInt(formData.totalQuantity),
        saleStart: formData.saleStart ? new Date(formData.saleStart).getTime() : undefined,
        saleEnd: formData.saleEnd ? new Date(formData.saleEnd).getTime() : undefined,
        bundleType: formData.bundleType,
      };

      // For multi-event bundles, include all event IDs
      if (formData.bundleType === "MULTI_EVENT") {
        bundleData.eventIds = formData.selectedEventIds;
      }

      if (editingBundleId) {
        await updateBundle({
          bundleId: editingBundleId,
          ...bundleData,
        });
      } else {
        await createBundle(bundleData);
      }

      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save bundle";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (bundle: BundleData) => {
    setFormData({
      name: bundle.name,
      description: bundle.description || "",
      price: (bundle.price / 100).toFixed(2),
      includedTiers: bundle.includedTiers,
      totalQuantity: bundle.totalQuantity.toString(),
      saleStart: bundle.saleStart ? new Date(bundle.saleStart).toISOString().split("T")[0] : "",
      saleEnd: bundle.saleEnd ? new Date(bundle.saleEnd).toISOString().split("T")[0] : "",
      bundleType: bundle.bundleType || "SINGLE_EVENT",
      selectedEventIds: bundle.eventIds || [eventId],
    });
    setEditingBundleId(bundle._id);
    setIsCreating(true);
  };

  const handleDelete = async (bundleId: Id<"ticketBundles">) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      await deleteBundle({ bundleId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete bundle";
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (bundle: BundleData) => {
    try {
      await updateBundle({
        bundleId: bundle._id,
        isActive: !bundle.isActive,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update bundle status";
      toast.error(errorMessage);
    }
  };

  if (!tiers) {
    return <div className="text-muted-foreground">Loading ticket tiers...</div>;
  }

  if (tiers.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-2">No ticket tiers available</p>
        <p className="text-sm text-muted-foreground">Create ticket tiers first before creating bundles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ticket Bundles</h3>
          <p className="text-sm text-muted-foreground">
            Package multiple tickets together at a discounted price
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Bundle
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="bg-accent border-2 border-primary/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-foreground">
              {editingBundleId ? "Edit Bundle" : "Create New Bundle"}
            </h4>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            {/* Bundle Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bundle Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 3-Day Weekend Pass, VIP Package"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included in this bundle..."
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Included Tiers */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Included Tickets *
              </label>

              {/* Selected Tiers */}
              {formData.includedTiers.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {formData.includedTiers.map((includedTier) => {
                    const tier = availableTiers?.find((t) => t._id === includedTier.tierId);
                    return (
                      <div
                        key={includedTier.tierId}
                        className="flex items-center gap-3 bg-white border border-border rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{includedTier.tierName}</div>
                          <div className="text-sm text-muted-foreground">
                            ${((tier?.price || 0) / 100).toFixed(2)} each
                            {includedTier.eventName && (
                              <span className="ml-2 px-2 py-0.5 bg-accent text-primary text-xs rounded">
                                {includedTier.eventName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={includedTier.quantity}
                            onChange={(e) =>
                              updateTierQuantity(includedTier.tierId, parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-2 py-1 border border-border rounded text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTierFromBundle(includedTier.tierId)}
                          className="text-destructive hover:text-destructive/90 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mb-3 p-3 bg-muted rounded border border-border">
                  No tickets added yet. Select from available tiers below.
                </div>
              )}

              {/* Add Tier Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedTierId = e.target.value as Id<"ticketTiers">;
                    const selectedTier = availableTiers?.find(
                      (t) => t._id === selectedTierId
                    );
                    if (selectedTier) {
                      addTierToBundle(selectedTierId, selectedTier.eventId, selectedTier.eventName);
                    }
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                defaultValue=""
              >
                <option value="">+ Add Ticket Type</option>
                {availableTiers
                  ?.filter((tier) => !formData.includedTiers.some((it) => it.tierId === tier._id))
                  .map((tier) => (
                    <option key={tier._id} value={tier._id}>
                      {tier.name} - ${(tier.price / 100).toFixed(2)} ({tier.available} available)
                    </option>
                  ))}
              </select>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Regular Price (Calculated) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Regular Price
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={`$${(calculateRegularPrice() / 100).toFixed(2)}`}
                    disabled
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-muted text-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">If bought separately</p>
              </div>

              {/* Bundle Price */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bundle Price (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your bundle price</p>
              </div>

              {/* Savings */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Savings</label>
                <div className="relative">
                  <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                  <input
                    type="text"
                    value={`$${(calculateSavings() / 100).toFixed(2)} (${calculateSavingsPercentage()}%)`}
                    disabled
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-success/10 text-success font-medium"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customer saves</p>
              </div>
            </div>

            {/* Quantity and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Quantity */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bundles Available *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale Start */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sale Starts (Optional)
                </label>
                <input
                  type="date"
                  value={formData.saleStart}
                  onChange={(e) => setFormData({ ...formData, saleStart: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Sale End */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sale Ends (Optional)
                </label>
                <input
                  type="date"
                  value={formData.saleEnd}
                  onChange={(e) => setFormData({ ...formData, saleEnd: e.target.value })}
                  min={formData.saleStart}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {editingBundleId ? "Update Bundle" : "Create Bundle"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Existing Bundles List */}
      {bundles && bundles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Existing Bundles</h4>
          {bundles.map((bundle) => (
            <div
              key={bundle._id}
              className={`border rounded-lg p-4 ${
                bundle.isActive ? "bg-white border-border" : "bg-muted border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-5 h-5 text-primary" />
                    <h5 className="font-semibold text-foreground">{bundle.name}</h5>
                    {!bundle.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mb-2">{bundle.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      <span className="font-semibold text-primary">
                        ${(bundle.price / 100).toFixed(2)}
                      </span>
                      {bundle.regularPrice && (
                        <span className="text-muted-foreground line-through ml-2">
                          ${(bundle.regularPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Savings:</span>{" "}
                      <span className="font-semibold text-success">
                        {bundle.percentageSavings}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>{" "}
                      <span className="font-medium">
                        {bundle.available} / {bundle.totalQuantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sold:</span>{" "}
                      <span className="font-medium">{bundle.sold}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {bundle.includedTiersDetails?.map((tier: IncludedTierDetail) => (
                      <div
                        key={tier.tierId}
                        className="text-xs px-2 py-1 bg-accent text-primary rounded"
                      >
                        {tier.quantity}x {tier.tierName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(bundle)}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted"
                    disabled={bundle.sold > 0}
                    title={bundle.sold > 0 ? "Cannot edit bundle with sales" : "Edit bundle"}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(bundle)}
                    className={`px-3 py-1 text-sm rounded ${
                      bundle.isActive
                        ? "bg-warning/10 text-warning hover:bg-warning/20"
                        : "bg-success/10 text-success hover:bg-success/20"
                    }`}
                  >
                    {bundle.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {bundle.sold === 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(bundle._id)}
                      className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {bundles && bundles.length === 0 && !isCreating && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No bundles created yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create bundles to package multiple tickets together at a discount
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Bundle
          </button>
        </div>
      )}
    </div>
  );
}
