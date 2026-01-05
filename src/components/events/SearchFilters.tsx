"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EVENT_CATEGORIES } from "@/lib/constants";

interface SearchFiltersProps {
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  selectedCategory: string | null;
  showPastEvents?: boolean;
  onTogglePastEvents?: (show: boolean) => void;
}

const CATEGORIES = ["All", ...EVENT_CATEGORIES];

export function SearchFilters({
  onSearchChange,
  onCategoryChange,
  selectedCategory,
  showPastEvents = false,
  onTogglePastEvents,
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearchChange("");
  };

  const handleCategoryClick = (category: string) => {
    if (category === "All") {
      onCategoryChange(null);
    } else {
      onCategoryChange(category);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search events by name, description, or location..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Filter Chips and Past Events Toggle */}
      <div className="flex flex-wrap gap-2 items-center">
        {CATEGORIES.map((category) => {
          const isSelected =
            category === "All" ? selectedCategory === null : selectedCategory === category;

          return (
            <button
              type="button"
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  isSelected
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-foreground hover:bg-muted shadow-sm"
                }
              `}
            >
              {category}
            </button>
          );
        })}

        {/* Past Events Toggle - on same line */}
        {onTogglePastEvents && (
          <button
            type="button"
            onClick={() => onTogglePastEvents(!showPastEvents)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${
                showPastEvents
                  ? "bg-primary text-white shadow-md hover:bg-primary/90"
                  : "bg-white text-foreground hover:bg-muted shadow-sm"
              }
            `}
          >
            {showPastEvents ? "Viewing Past Events" : "View Past Events"}
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing results for:</span>
          {searchQuery && (
            <span className="px-2 py-1 bg-accent text-primary rounded">"{searchQuery}"</span>
          )}
          {selectedCategory && (
            <span className="px-2 py-1 bg-accent text-primary rounded">{selectedCategory}</span>
          )}
        </div>
      )}
    </div>
  );
}
