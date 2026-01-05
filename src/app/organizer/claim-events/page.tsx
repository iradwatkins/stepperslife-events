"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Calendar, MapPin, Gift, Filter, X, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatEventDate } from "@/lib/date-format";
import debounce from "lodash/debounce";
import { EVENT_CATEGORIES } from "@/lib/constants";

export default function ClaimEventsPage() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Claim flow state
  const [claimingEventId, setClaimingEventId] = useState<Id<"events"> | null>(null);
  const [claimCode, setClaimCode] = useState("");

  // Queries and mutations
  const searchResults = useQuery(api.events.queries.searchClaimableEvents, {
    searchTerm: searchTerm || undefined,
    category: category,
    dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
    dateTo: dateTo ? new Date(dateTo).getTime() : undefined,
  });

  const claimEventMutation = useMutation(api.events.mutations.claimEvent);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Handle claiming an event
  const handleClaimEvent = async (eventId: Id<"events">) => {
    try {
      await claimEventMutation({
        eventId,
        claimCode: claimCode || undefined,
      });

      toast.success("Event claimed successfully!");
      setClaimingEventId(null);
      setClaimCode("");
    } catch (error: any) {
      console.error("Error claiming event:", error);
      toast.error(error.message || "Failed to claim event");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategory(undefined);
    setDateFrom("");
    setDateTo("");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || category || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Claim Events</h1>
          <p className="text-muted-foreground">
            Search for events created by administrators and claim ownership to start managing them.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by event name, location, or description..."
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border rounded-lg focus:ring-2 focus:ring-success focus:border-success outline-none"
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? "bg-success/10 border-success text-success"
                  : "border hover:bg-card"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-success text-white px-2 py-0.5 rounded-full text-xs">
                  Active
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Category
                      </label>
                      <select
                        value={category || ""}
                        onChange={(e) => setCategory(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-success focus:border-success"
                      >
                        <option value="">All Categories</option>
                        {EVENT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date From Filter */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-success focus:border-success"
                      />
                    </div>

                    {/* Date To Filter */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border rounded-lg focus:ring-2 focus:ring-success focus:border-success"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 text-sm text-destructive hover:text-destructive font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <div>
          {/* No search state */}
          {!hasActiveFilters && (
            <div className="bg-white rounded-lg border-2 border-dashed border p-12">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Start Searching</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a search term or apply filters to find claimable events
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {hasActiveFilters && searchResults === undefined && (
            <div className="bg-white rounded-lg p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-success"></div>
                <p className="mt-4 text-muted-foreground">Searching for events...</p>
              </div>
            </div>
          )}

          {/* No results state */}
          {hasActiveFilters && searchResults && searchResults.length === 0 && (
            <div className="bg-white rounded-lg border border p-12">
              <div className="text-center">
                <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No Events Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search criteria or check back later
                </p>
              </div>
            </div>
          )}

          {/* Results grid */}
          {hasActiveFilters && searchResults && searchResults.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Found {searchResults.length} claimable event{searchResults.length !== 1 ? "s" : ""}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="bg-white rounded-lg shadow-md border border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Event Image */}
                    <div className="h-48 bg-muted">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary">
                          <Gift className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-foreground mb-2">{event.name}</h3>

                      {/* Event Info */}
                      <div className="space-y-2 mb-4">
                        {event.startDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{formatEventDate(event.startDate, event.timezone)}</span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {typeof event.location === "string"
                                ? event.location
                                : `${event.location.venueName || ""} ${event.location.city}, ${event.location.state}`}
                            </span>
                          </div>
                        )}

                        {event.categories && event.categories.length > 0 && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                            {event.categories[0]}
                          </span>
                        )}
                      </div>

                      {/* Claim Section */}
                      {claimingEventId === event._id ? (
                        <div className="space-y-2">
                          {event.claimCode && (
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">
                                Claim Code Required
                              </label>
                              <input
                                type="text"
                                value={claimCode}
                                onChange={(e) => setClaimCode(e.target.value)}
                                placeholder="Enter claim code"
                                className="w-full px-3 py-2 border border rounded-lg text-sm focus:ring-2 focus:ring-success focus:border-success"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleClaimEvent(event._id)}
                              className="flex-1 px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/80 transition-colors font-medium"
                            >
                              Confirm Claim
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setClaimingEventId(null);
                                setClaimCode("");
                              }}
                              className="px-4 py-2 text-sm border border rounded-lg hover:bg-card transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setClaimingEventId(event._id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/80 transition-colors font-medium"
                        >
                          <Gift className="w-4 h-4" />
                          Claim This Event
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
