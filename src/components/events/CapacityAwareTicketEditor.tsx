"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, DollarSign, Users, ChevronDown, ChevronUp } from "lucide-react";
import { CapacityProgressBar } from "./CapacityProgressBar";
import { PricingTierForm, PricingTier } from "./PricingTierForm";

// Simplified ticket tier interface - no more allocation modes!
export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  // Simple table package support
  isTablePackage?: boolean;
  seatsPerTable?: number;
  // Early bird pricing support
  pricingTiers?: PricingTier[];
}

interface CapacityAwareTicketEditorProps {
  capacity: number;
  tiers: TicketTier[];
  onChange: (tiers: TicketTier[]) => void;
  sold?: number;
  showPresets?: boolean;
  hideAddButton?: boolean;
}

export function CapacityAwareTicketEditor({
  capacity,
  tiers,
  onChange,
  sold = 0,
  showPresets = true,
  hideAddButton = false,
}: CapacityAwareTicketEditorProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  // Simple capacity calculation
  const getTierCapacity = (tier: TicketTier): number => {
    const qty = parseInt(tier.quantity) || 0;
    if (tier.isTablePackage && tier.seatsPerTable) {
      return qty * tier.seatsPerTable; // Tables × seats per table
    }
    return qty; // Individual tickets
  };

  // Calculate totals
  const totalAllocated = tiers.reduce((sum, tier) => sum + getTierCapacity(tier), 0);
  const totalIndividual = tiers
    .filter((t) => !t.isTablePackage)
    .reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0);

  const tableTiers = tiers.filter((t) => t.isTablePackage);
  const totalTables = tableTiers.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0);
  const totalSeatsInTables = tableTiers.reduce((sum, t) => sum + getTierCapacity(t), 0);

  const addTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: "",
      description: "",
      price: "",
      quantity: "",
      isTablePackage: false,
      seatsPerTable: 8,
    };
    onChange([...tiers, newTier]);
    setExpandedTiers(new Set([...expandedTiers, newTier.id]));
  };

  const removeTier = (id: string) => {
    onChange(tiers.filter((t) => t.id !== id));
    const newExpanded = new Set(expandedTiers);
    newExpanded.delete(id);
    setExpandedTiers(newExpanded);
  };

  const updateTier = (id: string, field: keyof TicketTier, value: any) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)));
  };

  const updateTierPricing = (id: string, pricingTiers: PricingTier[]) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, pricingTiers } : tier)));
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTiers(newExpanded);
  };

  const addQuickTier = (template: { name: string; price: string; quantity: string }) => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      ...template,
      description: "",
      isTablePackage: false,
      seatsPerTable: 8,
    };
    onChange([...tiers, newTier]);
  };

  return (
    <div className="space-y-6">
      {/* Capacity Progress */}
      {capacity > 0 && (
        <div>
          <CapacityProgressBar
            capacity={capacity}
            allocated={totalAllocated}
            sold={sold}
            showBreakdown={true}
            breakdown={tiers.map((tier, index) => ({
              name: tier.name || `Tier ${index + 1}`,
              quantity: getTierCapacity(tier),
              color: ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6366F1"][index % 6],
            }))}
          />

          {/* Ticket Breakdown Summary */}
          <div className="mt-4 p-4 bg-card rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Ticket Breakdown:
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Capacity:</span>
                <span className="font-semibold text-foreground">
                  {totalAllocated} tickets
                </span>
              </div>
              {totalIndividual > 0 && (
                <div className="flex justify-between pl-4">
                  <span>↳ Individual tickets:</span>
                  <span>{totalIndividual}</span>
                </div>
              )}
              {totalSeatsInTables > 0 && (
                <div className="flex justify-between pl-4">
                  <span>
                    ↳ Seats in {totalTables} table{totalTables !== 1 ? "s" : ""}:
                  </span>
                  <span>{totalSeatsInTables}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Presets */}
      {showPresets && tiers.length === 0 && (
        <div className="bg-accent border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Start:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                addQuickTier({
                  name: "General Admission",
                  price: "25",
                  quantity: capacity > 0 ? Math.floor(capacity * 0.7).toString() : "100",
                })
              }
              className="px-3 py-2 text-sm bg-card border border rounded-lg hover:bg-muted transition-colors"
            >
              General Admission
            </button>
            <button
              type="button"
              onClick={() =>
                addQuickTier({
                  name: "VIP",
                  price: "50",
                  quantity: capacity > 0 ? Math.floor(capacity * 0.3).toString() : "50",
                })
              }
              className="px-3 py-2 text-sm bg-card border border rounded-lg hover:bg-muted transition-colors"
            >
              VIP
            </button>
          </div>
        </div>
      )}

      {/* Ticket Tiers List */}
      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const isExpanded = expandedTiers.has(tier.id);
          const tierCapacity = getTierCapacity(tier);
          const tierPrice = parseFloat(tier.price) || 0;

          return (
            <div
              key={tier.id}
              className="border border rounded-lg overflow-hidden bg-card"
            >
              {/* Tier Header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => toggleExpanded(tier.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {tier.name || `Untitled Tier ${index + 1}`}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {tierCapacity > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {tier.isTablePackage
                                ? `${tier.quantity} tables × ${tier.seatsPerTable} seats`
                                : `${tierCapacity} tickets`}
                            </span>
                          </div>
                        )}
                        {tierPrice > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>${tierPrice.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTier(tier.id);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Tier Details (Expanded) */}
              {isExpanded && (
                <div className="border-t border p-4 space-y-4 bg-card">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Ticket Name *
                    </label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                      placeholder="e.g., General Admission, VIP, Early Bird"
                      className="w-full px-3 py-2 border border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={tier.description}
                      onChange={(e) => updateTier(tier.id, "description", e.target.value)}
                      placeholder="Describe what's included with this ticket..."
                      rows={2}
                      className="w-full px-3 py-2 border border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Price & Quantity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Price *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </div>
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => updateTier(tier.id, "price", e.target.value)}
                          placeholder="25.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-8 pr-3 py-2 border border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Price per ticket
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={tier.quantity}
                        onChange={(e) => updateTier(tier.id, "quantity", e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-3 py-2 border border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {tier.isTablePackage ? "Number of tables" : "Number of tickets"}
                      </p>
                    </div>
                  </div>

                  {/* Table Package Checkbox */}
                  <div className="border border rounded-lg p-4 bg-card">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tier.isTablePackage || false}
                        onChange={(e) => {
                          updateTier(tier.id, "isTablePackage", e.target.checked);
                          if (!tier.seatsPerTable) {
                            updateTier(tier.id, "seatsPerTable", 8);
                          }
                        }}
                        className="mt-0.5 w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          This is a table package
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sell complete tables instead of individual tickets
                        </div>
                      </div>
                    </label>

                    {/* Seats per Table (if table package) */}
                    {tier.isTablePackage && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Seats per Table *
                        </label>
                        <select
                          value={tier.seatsPerTable || 8}
                          onChange={(e) =>
                            updateTier(tier.id, "seatsPerTable", parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="2">2 seats per table</option>
                          <option value="4">4 seats per table</option>
                          <option value="6">6 seats per table</option>
                          <option value="8">8 seats per table</option>
                          <option value="10">10 seats per table</option>
                          <option value="12">12 seats per table</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          = {getTierCapacity(tier)} total seats ({tier.quantity} tables ×{" "}
                          {tier.seatsPerTable} seats)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Early Bird Pricing Section */}
                  <div className="mt-4 pt-4 border-t border">
                    <PricingTierForm
                      tiers={tier.pricingTiers || []}
                      onChange={(pricingTiers) => updateTierPricing(tier.id, pricingTiers)}
                      basePrice={tier.price}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Tier Button */}
      {!hideAddButton && (
        <button
          type="button"
          onClick={addTier}
          className="w-full py-3 border-2 border-dashed border rounded-lg hover:border-primary hover:bg-accent transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Ticket Tier
        </button>
      )}
    </div>
  );
}
