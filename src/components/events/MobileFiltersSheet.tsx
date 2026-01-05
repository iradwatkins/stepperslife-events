"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickFilters } from "./QuickFilters";
import { DateRangePicker } from "./DateRangePicker";
import { LocationFilter, type LocationFilter as LocationFilterType } from "./LocationFilter";
import type { EventFilter } from "@/lib/date-utils";
import type { DateRange } from "react-day-picker";

interface Category {
  name: string;
}

interface MobileFiltersSheetProps {
  categories: Category[] | undefined;
  activeFilter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  locationFilter: LocationFilterType | null;
  onLocationChange: (location: LocationFilterType | null) => void;
  showPastEvents: boolean;
  onPastEventsChange: (show: boolean) => void;
  resultCount: number;
  filterCounts?: {
    tonight: number;
    weekend: number;
    month: number;
    all: number;
  };
}

export function MobileFiltersSheet({
  categories,
  activeFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
  locationFilter,
  onLocationChange,
  showPastEvents,
  onPastEventsChange,
  resultCount,
  filterCounts,
}: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    activeFilter !== "all" ||
    selectedCategory !== undefined ||
    dateRange !== undefined ||
    locationFilter !== null ||
    showPastEvents;

  const clearAllFilters = () => {
    onFilterChange("all");
    onCategoryChange(undefined);
    onDateRangeChange(undefined);
    onLocationChange(null);
    onPastEventsChange(false);
  };

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`sm:hidden gap-2 ${hasActiveFilters ? "border-primary text-primary" : ""}`}
          aria-label={hasActiveFilters ? `Filters active, ${resultCount} results` : "Open filters"}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
              !
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl flex flex-col"
      >
        <SheetHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Events</SheetTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-8">
          {/* Quick Filters */}
          <section>
            <h3 className="text-sm font-medium mb-3">Time Period</h3>
            <QuickFilters
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              counts={filterCounts}
              className="flex-wrap"
            />
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-sm font-medium mb-3">Category</h3>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category filter">
              <button
                type="button"
                onClick={() => onCategoryChange(undefined)}
                aria-pressed={!selectedCategory}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                All Categories
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onCategoryChange(cat.name)}
                  aria-pressed={selectedCategory === cat.name}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>

          {/* Date Range */}
          <section>
            <h3 className="text-sm font-medium mb-3">Custom Date Range</h3>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              className="w-full"
            />
          </section>

          {/* Location */}
          <section>
            <h3 className="text-sm font-medium mb-3">Location</h3>
            <LocationFilter
              currentFilter={locationFilter}
              onLocationChange={onLocationChange}
              className="w-full"
            />
          </section>

          {/* Past Events */}
          <section>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={showPastEvents}
                onCheckedChange={(checked) => onPastEventsChange(checked === true)}
                aria-label="Include past events"
              />
              <span className="text-sm">Include past events</span>
            </label>
          </section>
        </div>

        <SheetFooter className="flex-shrink-0 border-t pt-4 flex-row gap-3">
          <SheetClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </SheetClose>
          <Button className="flex-1" onClick={handleApply}>
            Show {resultCount} {resultCount === 1 ? "Event" : "Events"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
