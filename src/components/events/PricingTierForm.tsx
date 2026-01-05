"use client";

import { useState } from "react";
import { Plus, Trash2, Clock, DollarSign, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  availableFrom: string; // ISO date string
  availableUntil: string; // ISO date string (optional)
}

interface PricingTierFormProps {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
  basePrice: string; // For comparison
}

export function PricingTierForm({ tiers, onChange, basePrice }: PricingTierFormProps) {
  const [expanded, setExpanded] = useState(false);

  const addTier = () => {
    const newTier: PricingTier = {
      id: `pricing-tier-${Date.now()}`,
      name: "",
      price: basePrice || "",
      availableFrom: new Date().toISOString().split("T")[0],
      availableUntil: "",
    };
    onChange([...tiers, newTier]);
    setExpanded(true);
  };

  const removeTier = (id: string) => {
    onChange(tiers.filter((tier) => tier.id !== id));
  };

  const updateTier = (id: string, field: keyof PricingTier, value: string) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)));
  };

  // Sort tiers by availableFrom date for display
  const sortedTiers = [...tiers].sort(
    (a, b) => new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime()
  );

  // Calculate savings between tiers
  const calculateSavings = (currentPrice: string, nextPrice: string) => {
    const current = parseFloat(currentPrice) || 0;
    const next = parseFloat(nextPrice) || 0;
    const savings = next - current;
    if (savings > 0) {
      return `+$${savings.toFixed(2)}`;
    }
    return null;
  };

  if (!expanded && tiers.length === 0) {
    return (
      <div className="bg-accent border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-1">Early Bird Pricing (Optional)</h4>
            <p className="text-sm text-primary mb-3">
              Create time-based pricing tiers to reward early buyers. Example: $50 Early Bird → $75
              Regular → $100 Last Chance
            </p>
            <button
              type="button"
              onClick={addTier}
              className="text-sm font-medium text-primary hover:text-primary flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Early Bird Pricing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">Early Bird Pricing</h4>
          <p className="text-sm text-muted-foreground">Prices automatically change based on date</p>
        </div>
        {tiers.length === 0 && (
          <button
            type="button"
            onClick={addTier}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        )}
      </div>

      {tiers.length > 0 && (
        <div className="space-y-3">
          {sortedTiers.map((tier, index) => {
            const nextTier = sortedTiers[index + 1];
            const savings = nextTier ? calculateSavings(tier.price, nextTier.price) : null;

            return (
              <div key={tier.id}>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-accent text-primary rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <h5 className="font-medium text-foreground">Pricing Tier {index + 1}</h5>
                    </div>
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
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                        placeholder='e.g., "Early Bird", "Regular", "Last Chance"'
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Price (USD)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.price}
                          onChange={(e) => updateTier(tier.id, "price", e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Available From */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Available From
                      </label>
                      <input
                        type="date"
                        value={tier.availableFrom}
                        onChange={(e) => updateTier(tier.id, "availableFrom", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>

                    {/* Available Until */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Available Until
                        <span className="text-muted-foreground text-xs ml-1">(optional for last tier)</span>
                      </label>
                      <input
                        type="date"
                        value={tier.availableUntil}
                        onChange={(e) => updateTier(tier.id, "availableUntil", e.target.value)}
                        min={tier.availableFrom}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Show savings indicator */}
                  {savings && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <TrendingDown className="w-4 h-4 text-warning" />
                      <span className="text-warning font-medium">
                        Price increases by {savings} when this tier ends
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow between tiers */}
                {index < sortedTiers.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="text-muted-foreground text-sm">↓ Price Change ↓</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add another tier button */}
          <button
            type="button"
            onClick={addTier}
            className="w-full py-2.5 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Pricing Tier
          </button>
        </div>
      )}

      {/* Preview/Summary */}
      {tiers.length > 0 && (
        <div className="bg-success/10 border border-success rounded-lg p-3">
          <p className="text-sm text-success">
            <strong>Preview:</strong> Customers will see different prices based on when they buy.{" "}
            {sortedTiers.length} pricing tier{sortedTiers.length !== 1 ? "s" : ""} configured.
          </p>
        </div>
      )}
    </div>
  );
}
