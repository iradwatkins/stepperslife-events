"use client";

import React from "react";
import { Accessibility, Crown, User, Filter } from "lucide-react";

interface AccessibilityFiltersProps {
  onFilterChange: (filters: SeatFilters) => void;
  filters: SeatFilters;
}

export interface SeatFilters {
  showWheelchair: boolean;
  showVIP: boolean;
  showStandard: boolean;
  wheelchairOnly: boolean;
}

export default function AccessibilityFilters({
  onFilterChange,
  filters,
}: AccessibilityFiltersProps) {
  const toggleFilter = (key: keyof SeatFilters) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Seat Filters</h3>
      </div>

      <div className="space-y-2">
        {/* Wheelchair Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.wheelchairOnly}
            onChange={() => toggleFilter("wheelchairOnly")}
            className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
          />
          <Accessibility className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground group-hover:text-foreground/80">
            Wheelchair Accessible Only
          </span>
        </label>

        {/* Show/Hide Filters */}
        <div className="pl-6 space-y-2 border-l-2 border-border">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showWheelchair}
              onChange={() => toggleFilter("showWheelchair")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-ring disabled:opacity-50"
            />
            <Accessibility className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground">
              Show Wheelchair Seats
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showVIP}
              onChange={() => toggleFilter("showVIP")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-ring disabled:opacity-50"
            />
            <Crown className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground">Show VIP Seats</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.showStandard}
              onChange={() => toggleFilter("showStandard")}
              disabled={filters.wheelchairOnly}
              className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-ring disabled:opacity-50"
            />
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground">
              Show Standard Seats
            </span>
          </label>
        </div>
      </div>

      {filters.wheelchairOnly && (
        <div className="mt-3 p-2 bg-accent border border-primary/30 rounded text-xs text-accent-foreground">
          Only showing wheelchair accessible seats
        </div>
      )}
    </div>
  );
}
