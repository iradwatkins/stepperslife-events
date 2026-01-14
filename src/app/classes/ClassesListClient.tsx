"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Calendar, MapPin, Tag, Search, AlertCircle, BookOpen, GraduationCap, Award, X, ChevronDown, Clock, SlidersHorizontal, Users, DollarSign, UserCircle, CheckCircle2, Star } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ClassesSubNav } from "@/components/layout/ClassesSubNav";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/classes/FavoriteButton";
import { Id } from "@/../convex/_generated/dataModel";

// Extended type for class events with class-specific fields
// These fields map to schema: classLevel -> level, etc.
type ClassEvent = {
  _id: string; // Required for React key
  name?: string;
  description?: string;
  level?: string; // Maps to classLevel in schema
  instructorName?: string; // Instructor name
  instructorSlug?: string; // Instructor slug for linking to profile
  instructorAvatarUrl?: string; // Instructor avatar
  classType?: string; // Class type
  duration?: number; // Duration in minutes
  maxCapacity?: number; // Maximum enrollment capacity
  currentEnrollment?: number; // Current number enrolled
  lowestPriceCents?: number | null; // Lowest ticket price in cents
  averageRating?: number; // Average review rating (1-5)
  totalReviews?: number; // Total number of reviews
  startDate?: number;
  endDate?: number;
  eventDateLiteral?: string; // Pre-formatted date string
  eventTimeLiteral?: string; // Pre-formatted time string
  location?: string | {
    city?: string;
    state?: string;
    venueName?: string;
    address?: string;
    zipCode?: string;
    country?: string;
  };
  imageUrl?: string;
  isRecurring?: boolean;
  daysOfWeek?: number[];
  categories?: string[];
  timezone?: string;
};

// Helper to format price display
function formatPrice(cents: number | null | undefined, showPerClass = true): string {
  if (cents === null || cents === undefined) return "";
  if (cents === 0) return "Free";
  const price = `$${(cents / 100).toFixed(0)}`;
  return showPerClass ? `${price}/class` : price;
}

// Class types for filtering (only 3 main types)
const CLASS_TYPES = ["Steppin", "Line Dancing", "Walking"];

// Skill levels for filtering (separate from class type)
const LEVEL_TYPES = ["Beginner", "Intermediate", "Advanced"];

// Price ranges for filtering (client-side)
const PRICE_RANGES = [
  { label: "Free", min: 0, max: 0 },
  { label: "$1 - $25", min: 1, max: 2500 },
  { label: "$26 - $50", min: 2600, max: 5000 },
  { label: "$51+", min: 5100, max: Infinity },
] as const;

// Props for server-side initial data (hybrid SSR + CSR pattern)
interface ClassesListClientProps {
  initialClasses?: ClassEvent[];
  initialInstructors?: { slug: string; name: string; verified?: boolean }[];
  showPastByDefault?: boolean; // For /classes/all route to show all classes including past
}

export default function ClassesListClient({
  initialClasses,
  initialInstructors,
  showPastByDefault = false,
}: ClassesListClientProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showPastClasses, setShowPastClasses] = useState(showPastByDefault);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("masonry");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Query classes with filters - use initial data as fallback for SSR hydration
  const classesQuery = useQuery(api.public.queries.getPublishedClasses, {
    searchTerm: searchTerm || undefined,
    categories: selectedTypes.length > 0 ? selectedTypes : undefined,
    levels: selectedLevels.length > 0 ? selectedLevels : undefined,
    includePast: showPastClasses,
    daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
    instructorSlug: selectedInstructor || undefined,
  });
  // Use client query if available, otherwise fall back to server-side initial data
  const classesRaw = useMemo(() => {
    return classesQuery ?? initialClasses ?? [];
  }, [classesQuery, initialClasses]);

  // Helper to extract city from location (supports both object and string format)
  const getClassCity = useCallback((c: ClassEvent): string | null => {
    if (!c.location) return null;
    if (typeof c.location === "object") {
      const loc = c.location as { city?: string };
      if (loc.city) return loc.city;
    }
    if (typeof c.location === "string") {
      // Try to extract city from legacy string format (e.g., "Chicago, IL")
      const parts = c.location.split(",");
      if (parts.length > 0) return parts[0].trim();
    }
    return null;
  }, []);

  // Compute unique cities from all classes
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    classesRaw.forEach((c: ClassEvent) => {
      const city = getClassCity(c);
      if (city) cities.add(city);
    });
    return Array.from(cities).sort();
  }, [classesRaw, getClassCity]);

  // Filter by price range and city client-side
  const classes = useMemo(() => {
    let filtered = classesRaw;

    // Filter by price range
    if (selectedPriceRange) {
      const range = PRICE_RANGES.find(r => r.label === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((c: ClassEvent) => {
          const price = c.lowestPriceCents ?? 0;
          if (range.max === 0) {
            // Free classes
            return price === 0;
          }
          return price >= range.min && price <= range.max;
        });
      }
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter((c: ClassEvent) => getClassCity(c) === selectedCity);
    }

    return filtered;
  }, [classesRaw, selectedPriceRange, selectedCity, getClassCity]);

  const instructorsQuery = useQuery(api.public.queries.getClassInstructors, {});
  const instructors = instructorsQuery ?? initialInstructors ?? [];

  // Toggle a class type in the multi-select (memoized for performance)
  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Toggle a skill level in the multi-select (memoized for performance)
  const toggleLevel = useCallback((level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }, []);

  // Toggle a day in the multi-select (memoized for performance)
  const toggleDay = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  // Check if an image should be loaded with priority (first 6 visible)
  const isPriorityImage = useCallback((index: number) => index < 6, []);

  // Timeout fallback - after 10 seconds, show error state
  // Only show timeout if no data from either client query or server-side initial data
  useEffect(() => {
    const hasNoData = classesQuery === undefined && (!initialClasses || initialClasses.length === 0);
    if (hasNoData) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      // Use queueMicrotask to avoid synchronous setState during render
      queueMicrotask(() => {
        setLoadingTimeout(false);
      });
    }
  }, [classesQuery, initialClasses]);

  // Format date
  function formatClassDate(timestamp: number, timezone?: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone || "America/New_York",
    });
  }

  // Show timeout error state - but with hero and helpful options
  // Only show if no data from either source
  const hasNoDataAtAll = classesQuery === undefined && (!initialClasses || initialClasses.length === 0);
  if (loadingTimeout && hasNoDataAtAll) {
    return (
      <>
        <PublicHeader />
        <ClassesSubNav />
        <div className="min-h-screen bg-background">
          {/* Hero Section - Static version for error state */}
          <section className="relative min-h-[300px] md:min-h-[400px] w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-white drop-shadow-lg">
                Master Your Stepping Skills
              </h1>
              <p className="text-lg md:text-xl text-white/90 text-center max-w-2xl mb-6">
                Discover stepping classes, workshops, and lessons from expert instructors.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </section>

          {/* Error Message with Options */}
          <div className="container mx-auto px-4 py-12">
            <motion.div
              className="max-w-lg mx-auto text-center bg-card rounded-xl p-8 shadow-lg border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Classes Temporarily Unavailable
              </h3>
              <p className="text-muted-foreground mb-6">
                We&apos;re having trouble loading classes right now. You can try again or browse our demo classes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
                <Link
                  href="/classes/chicago-steppin-basics"
                  className="px-6 py-2.5 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
                >
                  View Demo Classes
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Loading state - show hero with loading indicator below
  // Only show if no data from either client query or server-side initial data
  if (hasNoDataAtAll && !loadingTimeout) {
    return (
      <>
        <PublicHeader />
        <ClassesSubNav />
        <div className="min-h-screen bg-background">
          {/* Hero Section - Static version for loading */}
          <section className="relative min-h-[300px] md:min-h-[400px] w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-white drop-shadow-lg">
                Master Your Stepping Skills
              </h1>
              <p className="text-lg md:text-xl text-white/90 text-center max-w-2xl">
                Discover stepping classes, workshops, and lessons from expert instructors.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </section>

          {/* Skeleton Loading Cards */}
          <div className="container mx-auto px-4 py-8" role="status" aria-live="polite" aria-label="Loading classes">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[0, 1, 2, 3].map((columnIndex) => (
                <div key={columnIndex} className="grid gap-3 sm:gap-4">
                  {[0, 1, 2].map((cardIndex) => (
                    <div key={`${columnIndex}-${cardIndex}`} className="relative overflow-hidden rounded-lg">
                      {/* Card skeleton with portrait aspect ratio */}
                      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                        <Skeleton className="absolute inset-0" />
                        {/* Type badge skeleton - top left */}
                        <div className="absolute top-3 left-3">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        {/* Level badge skeleton - top right */}
                        <div className="absolute top-3 right-3">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        {/* Schedule badge skeleton - bottom left */}
                        <div className="absolute bottom-3 left-3">
                          <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <motion.p
              className="mt-6 text-center text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Loading classes...
            </motion.p>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      {/* Skip Link for Keyboard Users */}
      <a
        href="#classes-list"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to classes
      </a>
      <PublicHeader />
      <ClassesSubNav />
      <main data-testid="classes-page" className="min-h-screen bg-background" role="main">
        {/* Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] w-full overflow-hidden">
          {/* Solid Background */}
          <div className="absolute inset-0 bg-slate-900" />

          {/* Background Dancing Image */}
          <motion.div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1545959570-a94084071b5d?w=1920&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />


          {/* Main Content */}
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-20 flex flex-col items-center justify-center min-h-[500px] md:min-h-[600px]">
            {/* Class Count Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <GraduationCap className="h-4 w-4" />
                </motion.span>
                {classes.length} {classes.length === 1 ? "Class" : "Classes"} Available
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 text-white drop-shadow-lg"
            >
              Master Your<br />Stepping Skills
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 text-center max-w-2xl mb-8"
            >
              Discover stepping classes, workshops, and lessons from expert instructors.
              Learn at your own pace and join a vibrant community.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  onClick={() => document.getElementById("classes-list")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-white !text-slate-900 hover:bg-slate-100 font-semibold px-8 py-6 text-lg rounded-full shadow-lg"
                >
                  <BookOpen className="mr-2 h-5 w-5 text-slate-900" />
                  Browse Classes
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-white/50 !text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-semibold px-8 py-6 text-lg rounded-full"
                >
                  <Link href="/organizer/classes/create">
                    <GraduationCap className="mr-2 h-5 w-5 text-white" />
                    Create a Class
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats/Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 md:gap-8"
            >
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-warning" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">50+</p>
                <p className="text-white/70 text-xs md:text-sm">Instructors</p>
              </div>
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-warning" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">All Levels</p>
                <p className="text-white/70 text-xs md:text-sm">Beginner to Pro</p>
              </div>
              <div className="text-center">
                <motion.div
                  className="flex items-center justify-center mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <MapPin className="h-6 w-6 md:h-8 md:w-8 text-warning" />
                </motion.div>
                <p className="text-white font-bold text-lg md:text-2xl">15+</p>
                <p className="text-white/70 text-xs md:text-sm">Cities</p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Compact Filter Bar */}
        <nav className="bg-card border-b border-border sticky top-0 z-10" role="search" aria-label="Filter classes">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Search - flexible width */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <label htmlFor="classes-search" className="sr-only">Search classes</label>
                <input
                  id="classes-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search classes..."
                  data-testid="classes-search-input"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Mobile Filter Button - Opens Sheet Drawer */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-expanded={mobileFilterOpen}
                    aria-controls="mobile-filter-panel"
                    aria-label={`Filter classes. ${selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0)} filters applied`}
                    className={`h-9 gap-1.5 sm:hidden ${
                      selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0) > 0
                        ? "border-primary text-primary"
                        : ""
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                    {selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0) > 0 && (
                      <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                        {selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl" id="mobile-filter-panel">
                  <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center justify-between">
                      <span>Filter Classes</span>
                      {(selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0) > 0) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTypes([]);
                            setSelectedLevels([]);
                            setSelectedDays([]);
                            setSelectedInstructor(null);
                            setSelectedPriceRange(null);
                            setSelectedCity(null);
                          }}
                          className="text-muted-foreground text-sm"
                        >
                          Clear all
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-6 pb-6">
                    {/* Class Type Section */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                        <Tag className="w-4 h-4" />
                        Class Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CLASS_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              selectedTypes.includes(type)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                            aria-pressed={selectedTypes.includes(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skill Level Section */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                        <Award className="w-4 h-4" />
                        Skill Level
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LEVEL_TYPES.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => toggleLevel(level)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              selectedLevels.includes(level)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                            aria-pressed={selectedLevels.includes(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Day of Week Section */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        Day of Week
                      </label>
                      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Select days of the week">
                        {DAY_NAMES.map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(index)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              selectedDays.includes(index)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                            aria-pressed={selectedDays.includes(index)}
                            aria-label={day}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Instructor Filter Section */}
                    {instructors && instructors.length > 0 && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                          <UserCircle className="w-4 h-4" />
                          Instructor
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {instructors.map((instructor) => (
                            <button
                              key={instructor.slug}
                              type="button"
                              onClick={() => setSelectedInstructor(
                                selectedInstructor === instructor.slug ? null : instructor.slug
                              )}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                selectedInstructor === instructor.slug
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                              aria-pressed={selectedInstructor === instructor.slug}
                            >
                              {instructor.name.split(' ')[0]}
                              {instructor.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Range Section */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                        <DollarSign className="w-4 h-4" />
                        Price Range
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PRICE_RANGES.map((range) => (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() => setSelectedPriceRange(
                              selectedPriceRange === range.label ? null : range.label
                            )}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              selectedPriceRange === range.label
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                            aria-pressed={selectedPriceRange === range.label}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* City/Location Section */}
                    {uniqueCities.length > 0 && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setSelectedCity(
                                selectedCity === city ? null : city
                              )}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                selectedCity === city
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                              aria-pressed={selectedCity === city}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Classes Toggle */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={showPastClasses}
                          onCheckedChange={(checked) => setShowPastClasses(checked === true)}
                        />
                        <span className="text-sm font-medium text-foreground">Show past classes</span>
                      </label>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <Button
                    className="w-full"
                    onClick={() => setMobileFilterOpen(false)}
                  >
                    Apply Filters
                    {selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0) > 0 && (
                      <span className="ml-2">
                        ({selectedTypes.length + selectedLevels.length + selectedDays.length + (selectedInstructor ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedCity ? 1 : 0)})
                      </span>
                    )}
                  </Button>
                </SheetContent>
              </Sheet>

              {/* Desktop Filter Pills */}
              <div className="hidden sm:flex items-center gap-2" role="toolbar" aria-label="Filter classes">
                {/* Type Filter - Inline Pills */}
                <div className="flex items-center gap-1.5" role="group" aria-label="Class type filters">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  {CLASS_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                        selectedTypes.includes(type)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      aria-pressed={selectedTypes.includes(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-border" />

                {/* Level Filter - Inline Pills */}
                <div className="flex items-center gap-1.5" role="group" aria-label="Skill level filters">
                  <Award className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  {LEVEL_TYPES.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                        selectedLevels.includes(level)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      aria-pressed={selectedLevels.includes(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px h-6 bg-border" />

                {/* Day Filter - Inline Pills (Desktop only) */}
                <div className="hidden md:flex items-center gap-1" role="group" aria-label="Day of week filters">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  {DAY_NAMES.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`w-9 h-7 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                        selectedDays.includes(index)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      aria-pressed={selectedDays.includes(index)}
                      aria-label={day}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Day Filter - Tablet Dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-9 gap-1 md:hidden ${selectedDays.length > 0 ? "border-primary text-primary" : ""}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Day</span>
                      {selectedDays.length > 0 && (
                        <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs font-medium">
                          {selectedDays.length}
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_NAMES.map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedDays.includes(index)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Divider */}
                <div className="w-px h-6 bg-border" />

                {/* Instructor Filter - Dropdown */}
                {instructors && instructors.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-9 gap-1 ${selectedInstructor ? "border-primary text-primary" : ""}`}
                      >
                        <UserCircle className="w-3.5 h-3.5" />
                        <span>{selectedInstructor ? instructors.find(i => i.slug === selectedInstructor)?.name.split(' ')[0] : "Instructor"}</span>
                        {selectedInstructor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstructor(null);
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {instructors.map((instructor) => (
                          <button
                            key={instructor.slug}
                            type="button"
                            onClick={() => setSelectedInstructor(
                              selectedInstructor === instructor.slug ? null : instructor.slug
                            )}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                              selectedInstructor === instructor.slug
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {instructor.name.split(' ')[0]}
                            {instructor.verified && (
                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Divider */}
                <div className="w-px h-6 bg-border" />

                {/* Price Range Filter - Dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-9 gap-1 ${selectedPriceRange ? "border-primary text-primary" : ""}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{selectedPriceRange || "Price"}</span>
                      {selectedPriceRange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPriceRange(null);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex flex-wrap gap-1.5">
                      {PRICE_RANGES.map((range) => (
                        <button
                          key={range.label}
                          type="button"
                          onClick={() => setSelectedPriceRange(
                            selectedPriceRange === range.label ? null : range.label
                          )}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedPriceRange === range.label
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* City/Location Filter - Dropdown */}
                {uniqueCities.length > 0 && (
                  <>
                    {/* Divider */}
                    <div className="w-px h-6 bg-border" />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-9 gap-1 ${selectedCity ? "border-primary text-primary" : ""}`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{selectedCity || "City"}</span>
                          {selectedCity && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCity(null);
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                          {uniqueCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setSelectedCity(
                                selectedCity === city ? null : city
                              )}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                selectedCity === city
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}

                {/* Divider */}
                <div className="w-px h-6 bg-border" />

                {/* Past Classes Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  <Checkbox
                    checked={showPastClasses}
                    onCheckedChange={(checked) => setShowPastClasses(checked === true)}
                    data-testid="classes-past-toggle"
                  />
                  <span>Past</span>
                </label>

                {/* Divider */}
                <div className="w-px h-6 bg-border" />

                {/* View Toggle */}
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>

              {/* Mobile: View Toggle Only (filters are in sheet) */}
              <div className="sm:hidden">
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>
            </div>

          </div>
        </nav>

        {/* Classes Grid */}
        <div id="classes-list" className="container mx-auto px-4 py-8">
          {classes.length === 0 ? (
            <motion.div
              data-testid="classes-empty-state"
              className="text-center py-12"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No classes found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedTypes.length > 0 || selectedLevels.length > 0 || selectedDays.length > 0
                  ? "Try adjusting your filters to find more classes"
                  : "Check back soon for upcoming classes!"}
              </p>
            </motion.div>
          ) : (
            <>
              {viewMode === "masonry" ? (
                /* Masonry View - 4 columns stacked with badges */
                <div data-testid="classes-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" aria-live="polite" aria-label={`${classes.length} classes found`}>
                  {[0, 1, 2, 3].map((columnIndex) => (
                    <div key={columnIndex} className="grid gap-3 sm:gap-4">
                      {classes
                        .map((item, idx) => ({ item, originalIndex: idx }))
                        .filter(({ originalIndex }) => originalIndex % 4 === columnIndex)
                        .map(({ item: classItem, originalIndex }) => (
                          <Link
                            key={classItem._id}
                            href={`/classes/${classItem._id}`}
                            data-testid={`class-card-${classItem._id}`}
                            className="group block cursor-pointer"
                          >
                            <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                              {/* Portrait aspect ratio image */}
                              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
                                {classItem.imageUrl ? (
                                  <Image
                                    src={classItem.imageUrl}
                                    alt={classItem.name || "Class"}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    priority={isPriorityImage(originalIndex)}
                                    loading={isPriorityImage(originalIndex) ? undefined : "lazy"}
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                                  </div>
                                )}
                              </div>

                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-lg" />

                              {/* Top Left - Class Type & Price Badges */}
                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-foreground">
                                  {classItem.categories?.[0] || "Class"}
                                </span>
                                {classItem.lowestPriceCents !== undefined && classItem.lowestPriceCents !== null && (
                                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${
                                    classItem.lowestPriceCents === 0
                                      ? "bg-emerald-500 text-white"
                                      : "bg-warning text-warning-foreground"
                                  }`}>
                                    {formatPrice(classItem.lowestPriceCents)}
                                  </span>
                                )}
                              </div>

                              {/* Top Right - Favorite Button & Level Badge */}
                              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                <FavoriteButton
                                  eventId={classItem._id as Id<"events">}
                                  size="sm"
                                />
                                {classItem.level && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded-full shadow-sm">
                                    <Award className="w-3 h-3" />
                                    <span>{classItem.level}</span>
                                  </div>
                                )}
                              </div>

                              {/* Bottom Left - Schedule & Duration Badge */}
                              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                <div className="flex flex-col gap-1.5">
                                  {/* Date */}
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                    <Calendar className="w-3.5 h-3.5 text-foreground" />
                                    <span className="text-xs font-semibold text-foreground">
                                      {classItem.eventDateLiteral || (classItem.startDate
                                        ? new Date(classItem.startDate).toLocaleDateString("en-US", {
                                            weekday: "short",
                                          })
                                        : "TBD")}
                                    </span>
                                  </div>
                                  {/* Duration */}
                                  {(classItem.duration || classItem.eventTimeLiteral) && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                      <Clock className="w-3.5 h-3.5 text-foreground" />
                                      <span className="text-xs font-medium text-foreground">
                                        {classItem.duration
                                          ? `${Math.floor(classItem.duration / 60)}h ${classItem.duration % 60}m`
                                          : classItem.eventTimeLiteral}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Instructor Avatar, Rating, or Enrollment */}
                                <div className="flex flex-col items-end gap-1.5">
                                  {/* Instructor */}
                                  {classItem.instructorName && (
                                    <Link
                                      href={classItem.instructorSlug ? `/instructors/${classItem.instructorSlug}` : "#"}
                                      onClick={(e) => {
                                        if (classItem.instructorSlug) {
                                          e.stopPropagation();
                                        } else {
                                          e.preventDefault();
                                        }
                                      }}
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-sm ${classItem.instructorSlug ? "hover:bg-slate-700/90 cursor-pointer" : ""}`}
                                    >
                                      <GraduationCap className="w-3.5 h-3.5 text-white" />
                                      <span className="text-xs font-medium text-white truncate max-w-[80px]">
                                        {classItem.instructorName.split(' ')[0]}
                                      </span>
                                    </Link>
                                  )}
                                  {/* Rating Display */}
                                  {classItem.averageRating !== undefined && classItem.averageRating > 0 && (
                                    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs font-semibold text-foreground">
                                        {classItem.averageRating.toFixed(1)}
                                      </span>
                                      {classItem.totalReviews !== undefined && classItem.totalReviews > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          ({classItem.totalReviews})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {/* Enrollment Availability */}
                                  {classItem.maxCapacity && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm ${
                                      classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                                        ? "bg-red-500/90 text-white"
                                        : classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity * 0.8
                                          ? "bg-amber-500/90 text-white"
                                          : "bg-emerald-500/90 text-white"
                                    }`}>
                                      <Users className="w-3.5 h-3.5" />
                                      <span className="text-xs font-medium">
                                        {classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                                          ? "Full"
                                          : `${classItem.maxCapacity - (classItem.currentEnrollment || 0)} left`}
                                      </span>
                                    </div>
                                  )}
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
                <div data-testid="classes-grid" className="space-y-4" aria-live="polite" aria-label={`${classes.length} classes found`}>
                  {classes.map((classItem: typeof classes[0] & ClassEvent, index) => (
                    <Link
                      key={classItem._id}
                      href={`/classes/${classItem._id}`}
                      data-testid={`class-card-${classItem._id}`}
                      className="block bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Class Image */}
                        <div className="relative sm:w-64 h-48 sm:h-auto bg-muted flex-shrink-0">
                          {classItem.imageUrl ? (
                            <Image
                              src={classItem.imageUrl}
                              alt={classItem.name || "Class"}
                              fill
                              sizes="(max-width: 640px) 100vw, 256px"
                              className="object-cover"
                              priority={isPriorityImage(index)}
                              loading={isPriorityImage(index) ? undefined : "lazy"}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                              <BookOpen className="w-12 h-12 text-white opacity-50" />
                            </div>
                          )}
                        </div>

                        {/* Class Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                                {classItem.name}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {classItem.categories?.[0] && (
                                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-accent text-primary rounded-full">
                                    {classItem.categories[0]}
                                  </span>
                                )}
                                {classItem.level && (
                                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                                    {classItem.level}
                                  </span>
                                )}
                              </div>
                            </div>
                            <FavoriteButton
                              eventId={classItem._id as Id<"events">}
                              size="md"
                              className="ml-4 flex-shrink-0"
                            />
                          </div>

                          {/* Description Preview */}
                          {classItem.description && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {classItem.description}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{classItem.eventDateLiteral || (classItem.startDate && formatClassDate(classItem.startDate, classItem.timezone))}</span>
                            </div>

                            {classItem.eventTimeLiteral && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{classItem.eventTimeLiteral}</span>
                              </div>
                            )}

                            {classItem.location && typeof classItem.location === "object" && classItem.location.city && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>{classItem.location.city}, {classItem.location.state}</span>
                              </div>
                            )}

                            {classItem.instructorName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                                <span>Instructor: </span>
                                {classItem.instructorSlug ? (
                                  <Link
                                    href={`/instructors/${classItem.instructorSlug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:underline"
                                  >
                                    {classItem.instructorName}
                                  </Link>
                                ) : (
                                  <span>{classItem.instructorName}</span>
                                )}
                              </div>
                            )}

                            {/* Duration */}
                            {classItem.duration && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Duration: {Math.floor(classItem.duration / 60)}h {classItem.duration % 60}m</span>
                              </div>
                            )}

                            {/* Enrollment Availability */}
                            {classItem.maxCapacity && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span className={
                                  classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                                    ? "text-red-500 font-medium"
                                    : classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity * 0.8
                                      ? "text-amber-500 font-medium"
                                      : "text-emerald-500 font-medium"
                                }>
                                  {classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                                    ? "Class Full"
                                    : `${classItem.maxCapacity - (classItem.currentEnrollment || 0)} spots available`}
                                </span>
                              </div>
                            )}

                            {/* Price */}
                            {classItem.lowestPriceCents !== undefined && classItem.lowestPriceCents !== null && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 flex-shrink-0" />
                                <span className={`font-medium ${
                                  classItem.lowestPriceCents === 0 ? "text-emerald-600" : "text-foreground"
                                }`}>
                                  {formatPrice(classItem.lowestPriceCents)}
                                </span>
                              </div>
                            )}

                            {/* Rating */}
                            {classItem.averageRating !== undefined && classItem.averageRating > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                <span className="font-medium text-foreground">
                                  {classItem.averageRating.toFixed(1)}
                                </span>
                                {classItem.totalReviews !== undefined && classItem.totalReviews > 0 && (
                                  <span className="text-muted-foreground">
                                    ({classItem.totalReviews} {classItem.totalReviews === 1 ? "review" : "reviews"})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* Default Grid View - 2x3 columns with details */
                <div data-testid="classes-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6" aria-live="polite" aria-label={`${classes.length} classes found`}>
                  {classes.map((classItem: typeof classes[0] & ClassEvent, index) => (
                    <Link
                      key={classItem._id}
                      href={`/classes/${classItem._id}`}
                      data-testid={`class-card-${classItem._id}`}
                      className="group block bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        {classItem.imageUrl ? (
                          <Image
                            src={classItem.imageUrl}
                            alt={classItem.name || "Class"}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            priority={isPriorityImage(index)}
                            loading={isPriorityImage(index) ? undefined : "lazy"}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2UzZTNlMyIvPjwvc3ZnPg=="
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                            <BookOpen className="w-12 h-12 text-white opacity-50" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                        {/* Class Type Badge - Top Left */}
                        {classItem.classType && (
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-foreground">
                              {classItem.classType.replace("_", " ")}
                            </span>
                          </div>
                        )}

                        {/* Favorite Button & Level Badge - Top Right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <FavoriteButton
                            eventId={classItem._id as Id<"events">}
                            size="sm"
                          />
                          {classItem.level && (
                            <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full shadow-sm">
                              {classItem.level}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">{classItem.name}</h3>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{classItem.eventDateLiteral || (classItem.startDate && formatClassDate(classItem.startDate, classItem.timezone))}</span>
                        </div>

                        {classItem.eventTimeLiteral && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{classItem.eventTimeLiteral}</span>
                          </div>
                        )}

                        {classItem.location && typeof classItem.location === "object" && classItem.location.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{classItem.location.city}, {classItem.location.state}</span>
                          </div>
                        )}

                        {/* Instructor */}
                        {classItem.instructorName && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 flex-shrink-0" />
                            {classItem.instructorSlug ? (
                              <Link
                                href={`/instructors/${classItem.instructorSlug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="truncate text-primary hover:underline"
                              >
                                {classItem.instructorName}
                              </Link>
                            ) : (
                              <span className="truncate">{classItem.instructorName}</span>
                            )}
                          </div>
                        )}

                        {/* Duration */}
                        {classItem.duration && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{Math.floor(classItem.duration / 60)}h {classItem.duration % 60}m</span>
                          </div>
                        )}

                        {/* Enrollment Indicator */}
                        {classItem.maxCapacity && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${
                            classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                              ? "text-red-500"
                              : classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity * 0.8
                                ? "text-amber-500"
                                : "text-emerald-500"
                          }`}>
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {classItem.currentEnrollment && classItem.currentEnrollment >= classItem.maxCapacity
                                ? "Full"
                                : `${classItem.maxCapacity - (classItem.currentEnrollment || 0)} spots left`}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        {classItem.lowestPriceCents !== undefined && classItem.lowestPriceCents !== null && (
                          <div className={`flex items-center gap-1 text-sm font-semibold ${
                            classItem.lowestPriceCents === 0 ? "text-emerald-600" : "text-foreground"
                          }`}>
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{formatPrice(classItem.lowestPriceCents)}</span>
                          </div>
                        )}

                        {/* Rating */}
                        {classItem.averageRating !== undefined && classItem.averageRating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-foreground">
                              {classItem.averageRating.toFixed(1)}
                            </span>
                            {classItem.totalReviews !== undefined && classItem.totalReviews > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({classItem.totalReviews})
                              </span>
                            )}
                          </div>
                        )}

                        {classItem.categories && classItem.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {classItem.categories.slice(0, 2).map((cat: string) => (
                              <span key={cat} className="px-2 py-0.5 bg-muted text-foreground rounded-full text-xs">
                                {cat}
                              </span>
                            ))}
                            {classItem.categories.length > 2 && (
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                                +{classItem.categories.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
