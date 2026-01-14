"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Calendar, Search, Filter, AlertCircle, Ticket, Music, Users, Star, ChevronDown, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EventsSubNav } from "@/components/layout/EventsSubNav";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickFilters } from "@/components/events/QuickFilters";
import { DateRangePicker } from "@/components/events/DateRangePicker";
import { LocationFilter, type LocationFilter as LocationFilterType } from "@/components/events/LocationFilter";
import { MobileFiltersSheet } from "@/components/events/MobileFiltersSheet";
import { EventSkeletonGrid } from "@/components/events/EventCardSkeleton";
import { calculateDistance } from "@/lib/geo";
import {
  type EventFilter,
  getFilterDateRange,
  getEndOfDay,
  getWeekendStart,
  getWeekendEnd,
  getEndOfMonth,
  getEmptyStateMessage,
} from "@/lib/date-utils";

// Pre-computed star positions and animation delays for hero section
// Using deterministic values to avoid Math.random() during render (React hooks purity)
const STAR_CONFIGS = [
  { left: 15, top: 25, duration: 2.8, delay: 0.3 },
  { left: 42, top: 18, duration: 3.2, delay: 1.1 },
  { left: 78, top: 35, duration: 2.5, delay: 0.7 },
  { left: 28, top: 62, duration: 3.5, delay: 1.8 },
  { left: 55, top: 45, duration: 2.9, delay: 0.2 },
  { left: 82, top: 72, duration: 3.1, delay: 1.4 },
  { left: 12, top: 78, duration: 2.6, delay: 0.9 },
  { left: 65, top: 22, duration: 3.4, delay: 1.6 },
  { left: 38, top: 85, duration: 2.7, delay: 0.5 },
  { left: 88, top: 55, duration: 3.0, delay: 1.2 },
  { left: 22, top: 42, duration: 3.3, delay: 0.8 },
  { left: 72, top: 88, duration: 2.4, delay: 1.9 },
] as const;

// Event data structure
interface EventData {
  _id: string;
  name: string;
  description?: string;
  startDate?: string | number;
  imageUrl?: string;
  eventType?: string;
  location?: string | { venueName?: string; city?: string; state?: string; lat?: number; lng?: number };
  ticketsVisible?: boolean;
  categories?: string[];
}

// Category data structure
interface CategoryData {
  name: string;
  slug?: string;
}

// Props for server-side initial data
interface EventsListClientProps {
  initialEvents?: { events: EventData[]; counts: { all: number; tonight: number; weekend: number; month: number }; filter: string };
  initialCategories?: CategoryData[];
  initialFilterCounts?: { all: number; tonight: number; weekend: number; month: number };
}

export default function EventsListClient({
  initialEvents,
  initialCategories,
  initialFilterCounts,
}: EventsListClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get filter from URL or default to 'all'
  // Using a function to compute initial state avoids needing a sync effect
  const [activeFilter, setActiveFilter] = useState<EventFilter>(() => {
    const filter = searchParams.get('filter') as EventFilter | null;
    if (filter && ['tonight', 'weekend', 'month', 'all'].includes(filter)) {
      return filter;
    }
    return 'all';
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("masonry");

  // Infinite scroll pagination
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Custom date range filter
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) {
      return {
        from: parseISO(from),
        to: to ? parseISO(to) : undefined,
      };
    }
    return undefined;
  });

  // Location filter
  const [locationFilter, setLocationFilter] = useState<LocationFilterType | null>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const city = searchParams.get('city');

    if (lat && lng && radius) {
      return {
        type: 'coords',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius, 10),
      };
    }
    if (city) {
      return { type: 'city', city };
    }
    return null;
  });

  // Calculate filter date ranges based on user's timezone
  const filterDateRanges = useMemo(() => {
    const now = new Date();
    return {
      tonightStart: now.getTime(),
      tonightEnd: getEndOfDay(now).getTime(),
      weekendStart: getWeekendStart(now).getTime(),
      weekendEnd: getWeekendEnd(now).getTime(),
      monthEnd: getEndOfMonth(now).getTime(),
    };
  }, []);

  // Get the current filter's date range
  const currentFilterRange = useMemo(() => {
    return getFilterDateRange(activeFilter);
  }, [activeFilter]);

  // Query events with the active filter - use initial data as fallback
  const filteredEventsQuery = useQuery(api.public.queries.getFilteredEvents, {
    filter: activeFilter,
    startTime: currentFilterRange.start,
    endTime: currentFilterRange.end ?? undefined,
    category: selectedCategory,
    searchTerm: searchTerm || undefined,
  });

  // Use query result if available, otherwise fall back to initial data
  const filteredEventsResult = filteredEventsQuery ?? initialEvents;

  // Query for filter counts (with timezone-aware ranges)
  const filterCountsQuery = useQuery(api.public.queries.getEventFilterCounts, {
    tonightStart: filterDateRanges.tonightStart,
    tonightEnd: filterDateRanges.tonightEnd,
    weekendStart: filterDateRanges.weekendStart,
    weekendEnd: filterDateRanges.weekendEnd,
    monthEnd: filterDateRanges.monthEnd,
    category: selectedCategory,
    searchTerm: searchTerm || undefined,
  });

  // Use query result if available, otherwise fall back to initial data
  const filterCounts = filterCountsQuery ?? initialFilterCounts;

  // Legacy query for backward compatibility (used when showPastEvents is true)
  const legacyEvents = useQuery(
    api.public.queries.getPublishedEvents,
    showPastEvents ? {
      searchTerm: searchTerm || undefined,
      category: selectedCategory,
      includePast: true,
    } : "skip"
  );

  // Determine which events to show (before client-side filters)
  const baseEvents = showPastEvents
    ? legacyEvents
    : filteredEventsResult?.events;

  // Apply client-side filters for custom date range and location
  const events = useMemo(() => {
    if (!baseEvents) return undefined;

    let filtered = [...baseEvents];

    // Apply custom date range filter
    if (dateRange?.from) {
      const fromTime = dateRange.from.getTime();
      const toTime = dateRange.to ? dateRange.to.getTime() + 86400000 - 1 : fromTime + 86400000 - 1; // End of day

      filtered = filtered.filter(event => {
        if (!event.startDate) return false;
        const eventTime = new Date(event.startDate).getTime();
        return eventTime >= fromTime && eventTime <= toTime;
      });
    }

    // Apply location filter
    if (locationFilter) {
      if (locationFilter.type === 'coords') {
        // Note: Events with lat/lng coordinates in their location data would be filtered here
        // Currently, events don't store coordinates, so we filter by city/state match
        // This is a placeholder for future geocoded events
        filtered = filtered.filter(event => {
          if (!event.location || typeof event.location === 'string') return true;
          // Check if location has coordinates (future support)
          const loc = event.location as { lat?: number; lng?: number; city?: string; state?: string };
          if (loc.lat && loc.lng) {
            const distance = calculateDistance(
              locationFilter.lat,
              locationFilter.lng,
              loc.lat,
              loc.lng
            );
            return distance <= locationFilter.radius;
          }
          return true; // Include all events without coords for now
        });
      } else if (locationFilter.type === 'city') {
        const searchCity = locationFilter.city.toLowerCase();
        filtered = filtered.filter(event => {
          if (!event.location) return false;
          if (typeof event.location === 'string') {
            return event.location.toLowerCase().includes(searchCity);
          }
          const cityMatch = event.location.city?.toLowerCase().includes(searchCity);
          const stateMatch = event.location.state?.toLowerCase().includes(searchCity);
          return cityMatch || stateMatch;
        });
      }
    }

    return filtered;
  }, [baseEvents, dateRange, locationFilter]);

  const categoriesQuery = useQuery(api.public.queries.getCategories, {});
  // Use query result if available, otherwise fall back to initial data
  const categories = categoriesQuery ?? initialCategories;

  // Handle filter change - update URL
  const handleFilterChange = (filter: EventFilter) => {
    setActiveFilter(filter);
    // Clear custom date range when using preset filters
    if (filter !== 'all') {
      setDateRange(undefined);
    }

    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    // Clear date params when using preset filters
    params.delete('from');
    params.delete('to');
    const newUrl = params.toString() ? `?${params.toString()}` : '/events';
    router.replace(newUrl, { scroll: false });
  };

  // Handle custom date range change - update URL
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Switch to 'all' filter when using custom dates
    if (range?.from) {
      setActiveFilter('all');
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('filter'); // Clear preset filter

    if (range?.from) {
      params.set('from', format(range.from, 'yyyy-MM-dd'));
      if (range.to) {
        params.set('to', format(range.to, 'yyyy-MM-dd'));
      } else {
        params.delete('to');
      }
    } else {
      params.delete('from');
      params.delete('to');
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/events';
    router.replace(newUrl, { scroll: false });
  };

  // Handle location filter change - update URL
  const handleLocationChange = (location: LocationFilterType | null) => {
    setLocationFilter(location);

    const params = new URLSearchParams(searchParams.toString());
    // Clear all location params first
    params.delete('lat');
    params.delete('lng');
    params.delete('radius');
    params.delete('city');

    if (location) {
      if (location.type === 'coords') {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
        params.set('radius', location.radius.toString());
      } else {
        params.set('city', location.city);
      }
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/events';
    router.replace(newUrl, { scroll: false });
  };

  // Reset pagination when filters change
  // Using useEffect is intentional here - we want to sync visibleCount with filter state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setVisibleCount(12);
  }, [activeFilter, searchTerm, selectedCategory, showPastEvents, dateRange, locationFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load more events callback
  const loadMore = useCallback(() => {
    if (!events || isLoadingMore) return;
    if (visibleCount >= events.length) return;

    setIsLoadingMore(true);
    // Simulate small delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 12, events?.length ?? prev));
      setIsLoadingMore(false);
    }, 300);
  }, [events, visibleCount, isLoadingMore]);

  // Intersection observer ref callback for auto-loading
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && events && visibleCount < events.length) {
        loadMore();
      }
    }, { rootMargin: '200px' });

    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, events, visibleCount, loadMore]);

  // Slice events for pagination
  const visibleEvents = useMemo(() => {
    if (!events) return undefined;
    return events.slice(0, visibleCount);
  }, [events, visibleCount]);

  const hasMore = events && visibleCount < events.length;

  // Timeout fallback - after 10 seconds, show error state
  // Using useEffect is intentional here - we sync loadingTimeout state with events loading status
  useEffect(() => {
    if (events === undefined) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingTimeout(false);
    }
  }, [events]);

  // Show timeout error state
  if (loadingTimeout && events === undefined) {
    return (
      <>
        <PublicHeader />
        <EventsSubNav />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connection Issue
              </h3>
              <p className="text-muted-foreground mb-4">
                Unable to load events. Please check your connection and try again.
              </p>
              <motion.button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
            </motion.div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (events === undefined) {
    return (
      <>
        <PublicHeader />
        <EventsSubNav />
        <div className="min-h-screen bg-background">
          {/* Skeleton Hero Section */}
          <section className="relative min-h-[300px] md:min-h-[400px] w-full overflow-hidden bg-gradient-to-br from-sky-900 via-primary to-sky-800">
            <div className="container mx-auto px-4 py-16 relative z-10">
              <div className="text-center text-white">
                <div className="h-12 w-64 bg-white/20 animate-pulse rounded mx-auto mb-4" />
                <div className="h-6 w-96 max-w-full bg-white/10 animate-pulse rounded mx-auto" />
              </div>
            </div>
          </section>

          {/* Skeleton Filters */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex gap-2 mb-6 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>

            {/* Skeleton Event Grid */}
            <EventSkeletonGrid count={12} viewMode="masonry" />
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <EventsSubNav />
      <div data-testid="events-page" className="min-h-screen bg-background">
        {/* Epic Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] w-full overflow-hidden">
          {/* Animated Gradient Background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-sky-900 via-primary to-sky-800"
            animate={{
              background: [
                "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #075985 100%)",
                "linear-gradient(135deg, #0284c7 0%, #075985 50%, #0c4a6e 100%)",
                "linear-gradient(135deg, #075985 0%, #0c4a6e 50%, #0284c7 100%)",
                "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #075985 100%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />

          {/* Background Image with Parallax */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Floating Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Ticket Icon */}
            <motion.div
              className="absolute top-20 left-[10%] text-white/20"
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Ticket className="w-16 h-16 md:w-24 md:h-24" />
            </motion.div>

            {/* Calendar Icon */}
            <motion.div
              className="absolute top-32 right-[15%] text-white/15"
              animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Calendar className="w-12 h-12 md:w-20 md:h-20" />
            </motion.div>

            {/* Music Icon */}
            <motion.div
              className="absolute bottom-32 left-[20%] text-white/10"
              animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <Music className="w-14 h-14 md:w-16 md:h-16" />
            </motion.div>

            {/* Users Icon */}
            <motion.div
              className="absolute bottom-40 right-[10%] text-white/15"
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Users className="w-10 h-10 md:w-14 md:h-14" />
            </motion.div>

            {/* Star Icons */}
            {STAR_CONFIGS.map((config, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${config.left}%`,
                  top: `${config.top}%`,
                }}
                animate={{
                  opacity: [0.1, 0.4, 0.1],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: config.duration,
                  repeat: Infinity,
                  delay: config.delay,
                }}
              >
                <Star className="w-3 h-3 md:w-4 md:h-4 text-warning/30 fill-yellow-400/30" />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center py-16 md:py-24">
            <div className="max-w-3xl">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
                  <Ticket className="w-4 h-4" />
                  {events.length > 0 ? `${events.length} Events Available` : "Discover Stepping Events"}
                </span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                Find Your Next{" "}
                <motion.span
                  className="inline-block bg-gradient-to-r from-sky-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Stepping Event
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Discover workshops, socials, competitions, and unforgettable nights.
                Join the Chicago Steppin community and make memories that last.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-white !text-primary hover:bg-white/90 shadow-xl shadow-sky-900/30"
                    onClick={() => document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    Browse Events
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 bg-white/10 border-white/30 !text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Link href="/organizer/events/create">
                      <Ticket className="w-5 h-5 mr-2 text-white" />
                      Host an Event
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Stats - Only show if there are events */}
              {events.length > 0 && (
                <motion.div
                  className="mt-12 flex flex-wrap gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                >
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">{events.length}</div>
                    <div className="text-sm text-white/60">Active Events</div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Quick Filters */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <QuickFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              counts={filterCounts ?? undefined}
            />
          </div>
        </div>

        {/* Compact Filter Bar */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Search - flexible width */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <label htmlFor="events-search" className="sr-only">Search events</label>
                <input
                  id="events-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  data-testid="events-search-input"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Mobile Filter Sheet */}
              <MobileFiltersSheet
                categories={categories}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                locationFilter={locationFilter}
                onLocationChange={handleLocationChange}
                showPastEvents={showPastEvents}
                onPastEventsChange={setShowPastEvents}
                resultCount={events?.length ?? 0}
                filterCounts={filterCounts ?? undefined}
              />

              {/* Category Filter - Inline Pills (Desktop Only) */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5" role="group" aria-label="Category filter">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(undefined)}
                    aria-pressed={!selectedCategory}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    All
                  </button>
                  {categories?.slice(0, 5).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      aria-pressed={selectedCategory === cat.name}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat.name
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {categories && categories.length > 5 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2" aria-label="More categories">
                          <span className="text-xs">More</span>
                          <ChevronDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                          {categories.slice(5).map((cat) => (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => setSelectedCategory(cat.name)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedCategory === cat.name
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Past Events Toggle - Desktop only */}
                <label className="hidden sm:flex items-center gap-1.5 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  <Checkbox
                    checked={showPastEvents}
                    onCheckedChange={(checked) => setShowPastEvents(checked === true)}
                    data-testid="events-past-toggle"
                    aria-label="Show past events"
                  />
                  <span>Past</span>
                </label>

                {/* Divider - Desktop only */}
                <div className="hidden sm:block w-px h-6 bg-border" aria-hidden="true" />

                {/* Date Range Picker - Desktop only */}
                <div className="hidden sm:block">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </div>

                {/* Location Filter - Desktop only */}
                <div className="hidden sm:block">
                  <LocationFilter
                    onLocationChange={handleLocationChange}
                    currentFilter={locationFilter}
                  />
                </div>

                {/* Divider - Desktop only */}
                <div className="hidden sm:block w-px h-6 bg-border" aria-hidden="true" />

                {/* View Toggle - Always visible */}
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div id="events-grid" className="container mx-auto px-4 py-8">
          {events.length === 0 ? (
            <motion.div
              data-testid="events-empty-state"
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              </motion.div>
              {(() => {
                const emptyMessage = getEmptyStateMessage(activeFilter);
                return (
                  <>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {searchTerm || selectedCategory
                        ? "No events found"
                        : emptyMessage.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedCategory
                        ? "Try adjusting your filters to find more events"
                        : emptyMessage.subtitle}
                    </p>
                    {activeFilter !== 'all' && !searchTerm && !selectedCategory && (
                      <Button
                        variant="outline"
                        onClick={() => handleFilterChange('all')}
                        className="mt-2"
                      >
                        View All Events
                      </Button>
                    )}
                  </>
                );
              })()}
            </motion.div>
          ) : (
            <>
              {/* Showing count */}
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>
                  Showing {visibleEvents?.length ?? 0} of {events.length} events
                </span>
              </div>

              {viewMode === "masonry" ? (
                /* Masonry View - 4 columns stacked with card design */
                <div data-testid="events-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {[0, 1, 2, 3].map((columnIndex) => (
                    <div key={columnIndex} className="grid gap-3 sm:gap-4">
                      {(visibleEvents ?? [])
                        .filter((_, index) => index % 4 === columnIndex)
                        .map((event) => (
                          <Link
                            key={event._id}
                            href={`/events/${event._id}`}
                            data-testid={`event-card-${event._id}`}
                            className="group block cursor-pointer"
                          >
                            <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                              {/* Portrait aspect ratio image */}
                              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
                                <Image
                                  src={event.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"}
                                  alt={event.name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>

                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-lg" />

                              {/* Top Left - Event Type Badge */}
                              <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-foreground">
                                  {event.eventType?.replace("_", " ") || "Event"}
                                </span>
                              </div>

                              {/* Top Right - Tickets Badge */}
                              {event.ticketsVisible && (
                                <div className="absolute top-3 right-3">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-success text-white text-xs font-semibold rounded-full shadow-sm">
                                    <Ticket className="w-3 h-3" />
                                    <span>Available</span>
                                  </div>
                                </div>
                              )}

                              {/* Bottom Left - Date Badge */}
                              <div className="absolute bottom-3 left-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                  <Calendar className="w-4 h-4 text-foreground" />
                                  <span className="text-sm font-semibold text-foreground">
                                    {event.startDate
                                      ? new Date(event.startDate).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "TBD"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ))}
                </div>
              ) : viewMode === "list" ? (
                /* List View - Horizontal cards with details */
                <div data-testid="events-grid" className="space-y-4">
                  {(visibleEvents ?? []).map((event) => (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      data-testid={`event-card-${event._id}`}
                      className="block bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Event Image */}
                        <div className="relative sm:w-64 h-48 sm:h-auto bg-muted flex-shrink-0">
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt={event.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 256px"
                              className="object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary">
                              <Calendar className="w-12 h-12 text-white opacity-50" />
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                                {event.name}
                              </h3>
                              {/* Event Type Badge */}
                              <span className="inline-block px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                                {event.eventType?.replace("_", " ") || "Event"}
                              </span>
                            </div>
                          </div>

                          {/* Description Preview */}
                          {event.description && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {event.startDate
                                  ? new Date(event.startDate).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Date TBD"}
                              </span>
                            </div>

                            {event.location && (typeof event.location === "string" ? event.location : (event.location.city || event.location.state)) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>
                                  {typeof event.location === "string"
                                    ? event.location
                                    : [event.location.venueName, event.location.city, event.location.state].filter(Boolean).join(", ")}
                                </span>
                              </div>
                            )}

                            {event.ticketsVisible && (
                              <div className="flex items-center gap-2 text-sm text-success font-medium">
                                <Ticket className="w-4 h-4" />
                                <span>Tickets Available</span>
                              </div>
                            )}
                          </div>

                          {/* Categories */}
                          {event.categories && event.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {event.categories.slice(0, 3).map((category: string) => (
                                <span
                                  key={category}
                                  className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                              {event.categories.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                                  +{event.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* Default Grid View - Card with image and details */
                <div data-testid="events-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(visibleEvents ?? []).map((event) => (
                    <Link
                      key={event._id}
                      href={`/events/${event._id}`}
                      data-testid={`event-card-${event._id}`}
                      className="group block cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-card">
                        {/* Event Image */}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={event.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80"}
                            alt={event.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Event Type Badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                              {event.eventType?.replace("_", " ") || "Event"}
                            </span>
                          </div>

                          {/* Tickets Available Badge */}
                          {event.ticketsVisible && (
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 px-2 py-1 bg-success text-white text-xs font-semibold rounded-full shadow-sm">
                                <Ticket className="w-3 h-3" />
                                <span>Available</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="p-4 space-y-2">
                          {/* Event Name */}
                          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {event.name}
                          </h3>

                          {/* Date & Time */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {event.startDate
                                ? new Date(event.startDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Date TBD"}
                            </span>
                          </div>

                          {/* Location */}
                          {event.location && (typeof event.location === "string" ? event.location : (event.location.city || event.location.state)) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">
                                {typeof event.location === "string"
                                  ? event.location
                                  : [event.location.city, event.location.state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}

                          {/* Categories */}
                          {event.categories && event.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.categories.slice(0, 2).map((category: string) => (
                                <span
                                  key={category}
                                  className="px-2 py-1 text-xs bg-muted text-foreground rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                              {event.categories.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-muted text-foreground rounded-full">
                                  +{event.categories.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Load More Trigger / End of Results */}
              <div className="mt-8">
                {hasMore ? (
                  <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-8"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading more events...</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        className="px-8"
                      >
                        Load More Events
                      </Button>
                    )}
                  </div>
                ) : events.length > 12 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      You&apos;ve seen all {events.length} events
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
