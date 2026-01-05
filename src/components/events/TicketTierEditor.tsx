"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, DollarSign, Users } from "lucide-react";
import { PricingTierForm, PricingTier } from "./PricingTierForm";

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  pricingTiers?: PricingTier[]; // Optional early bird pricing
  isTablePackage?: boolean; // True if selling entire tables
  tableCapacity?: number; // Number of seats per table (4, 6, 8, 10, etc.)
}

interface TicketTierEditorProps {
  tiers: TicketTier[];
  onChange: (tiers: TicketTier[]) => void;
}

export function TicketTierEditor({ tiers, onChange }: TicketTierEditorProps) {
  const addTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: "",
      description: "",
      price: "",
      quantity: "",
    };
    onChange([...tiers, newTier]);
  };

  const removeTier = (id: string) => {
    onChange(tiers.filter((tier) => tier.id !== id));
  };

  const updateTier = (id: string, field: keyof TicketTier, value: string) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)));
  };

  const updateTierPricing = (id: string, pricingTiers: PricingTier[]) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, pricingTiers } : tier)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ticket Tiers</h3>
          <p className="text-sm text-muted-foreground">Add different ticket types with varying prices</p>
        </div>
        <button
          type="button"
          onClick={addTier}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {tiers.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No ticket tiers yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add at least one ticket tier to enable ticketing
          </p>
          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="bg-muted border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-foreground">Tier {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  className="text-destructive hover:text-destructive/90 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tier Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                    placeholder="e.g., General Admission, VIP, Table Seating"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {tier.isTablePackage ? "Price per Table (USD) *" : "Price (USD) *"}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, "price", e.target.value)}
                      placeholder={tier.isTablePackage ? "500.00" : "25.00"}
                      step="0.01"
                      min="0"
                      className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                  {tier.isTablePackage && tier.tableCapacity && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(parseFloat(tier.price) / tier.tableCapacity || 0).toFixed(2)} per seat
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Quantity Available *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => updateTier(tier.id, "quantity", e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={tier.description}
                    onChange={(e) => updateTier(tier.id, "description", e.target.value)}
                    placeholder="Benefits included with this tier..."
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                {/* Table Package Option */}
                <div className="md:col-span-2 pt-3 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tier.isTablePackage || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onChange(
                          tiers.map((t) =>
                            t.id === tier.id
                              ? {
                                  ...t,
                                  isTablePackage: isChecked,
                                  tableCapacity: isChecked ? 4 : undefined,
                                }
                              : t
                          )
                        );
                      }}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Sell as Table Package</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Customers purchase entire tables instead of individual seats
                  </p>

                  {tier.isTablePackage && (
                    <div className="mt-3 ml-6">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Table Capacity (Number of Seats) *
                      </label>
                      <select
                        value={tier.tableCapacity || 4}
                        onChange={(e) =>
                          onChange(
                            tiers.map((t) =>
                              t.id === tier.id
                                ? { ...t, tableCapacity: parseInt(e.target.value) }
                                : t
                            )
                          )
                        }
                        className="w-full md:w-auto px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      >
                        <option value="2">2 Seats (Couple)</option>
                        <option value="4">4 Seats (Small Table)</option>
                        <option value="6">6 Seats (Standard Table)</option>
                        <option value="8">8 Seats (Large Table)</option>
                        <option value="10">10 Seats (XL Table)</option>
                        <option value="12">12 Seats (XXL Table)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quantity field above represents number of tables available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Early Bird Pricing Section */}
              <div className="mt-4 pt-4 border-t border-border">
                <PricingTierForm
                  tiers={tier.pricingTiers || []}
                  onChange={(pricingTiers) => updateTierPricing(tier.id, pricingTiers)}
                  basePrice={tier.price}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <button
          type="button"
          onClick={addTier}
          className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Another Tier
        </button>
      )}
    </div>
  );
}
