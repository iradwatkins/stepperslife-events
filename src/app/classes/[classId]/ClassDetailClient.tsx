"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Share2,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Tag,
  Star,
  Users,
  Ticket,
  CalendarPlus,
  ChevronDown,
  Bell,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { formatEventDate, formatEventTime } from "@/lib/date-format";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ClassReviewList } from "@/components/classes/ClassReviewList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface EnrollmentTier {
  _id: string;
  name: string;
  description?: string;
  priceCents: number;
  quantity: number;
  sold: number;
  available: number;
  isAvailable: boolean;
}

interface MockClassData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  organizerName: string;
  categories: string[];
  price: number;
  totalLessons: number;
  enrollmentCount: number;
  averageRating: number;
  instructorPhoto: string;
  isMockData: boolean;
  // Properties from Convex data (optional for mock)
  startDate?: number;
  endDate?: number;
  timezone?: string;
  eventTimeLiteral?: string;
  location?: {
    venueName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  organizer?: {
    name?: string;
    email?: string;
  };
  enrollmentTiers?: EnrollmentTier[];
  lowestPriceCents?: number | null;
  hasAvailableSpots?: boolean;
  // Class series configuration
  numberOfSessions?: number;
  classFrequency?: "weekly" | "bi-weekly" | "monthly";
  seriesPriceCents?: number | null;
  doorPriceCents?: number | null;
}

interface ClassDetailClientProps {
  classId: string | Id<"events">;
  mockData?: MockClassData;
}

export default function ClassDetailClient({ classId, mockData }: ClassDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Waitlist state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  // Only query Convex if we don't have mock data
  const convexClassDetails = useQuery(
    api.public.queries.getPublicClassDetails,
    mockData ? "skip" : { classId: classId as Id<"events"> }
  );

  // Waitlist queries
  const waitlistCount = useQuery(
    api.waitlist.queries.getWaitlistCount,
    mockData ? "skip" : { eventId: classId as Id<"events"> }
  );

  const isOnWaitlist = useQuery(
    api.waitlist.queries.checkUserOnWaitlist,
    mockData || !user?.email ? "skip" : { eventId: classId as Id<"events">, email: user.email }
  );

  // Waitlist mutation
  const joinWaitlist = useMutation(api.waitlist.mutations.joinWaitlist);

  // Use mock data if available, otherwise use Convex data
  const classDetails = mockData || convexClassDetails;

  // Format price for display
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Handle enroll button click
  const handleEnroll = () => {
    if (mockData) {
      // For mock data, show a toast instead of alert
      toast.info("Demo Class", {
        description: "This is a demo class. Sign up functionality coming soon!",
      });
      return;
    }
    // Navigate to class-specific checkout page
    router.push(`/classes/${classId}/checkout`);
  };

  // Handle joining waitlist
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoiningWaitlist(true);
    setWaitlistError(null);

    try {
      await joinWaitlist({
        eventId: classId as Id<"events">,
        email: waitlistEmail,
        name: waitlistName,
        quantity: 1,
      });
      setWaitlistSuccess(true);
      // Reset form
      setWaitlistName("");
      setWaitlistEmail("");
    } catch (error) {
      setWaitlistError(error instanceof Error ? error.message : "Failed to join waitlist");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  // Open waitlist modal with pre-filled email if logged in
  const openWaitlistModal = () => {
    if (user?.email) {
      setWaitlistEmail(user.email);
      setWaitlistName(user.name || "");
    }
    setWaitlistSuccess(false);
    setWaitlistError(null);
    setShowWaitlistModal(true);
  };

  if (classDetails === undefined) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading class...</p>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (classDetails === null) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Class Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This class doesn't exist or is no longer available.
              </p>
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Classes
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: classDetails.name,
      text: `Check out this class: ${classDetails.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Helper to get location string from location object
  const getLocationString = () => {
    if (!classDetails?.location) return 'Online';
    if (typeof classDetails.location === 'string') return classDetails.location;
    const loc = classDetails.location;
    return `${loc.venueName || ''} ${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''} ${loc.zipCode || ''}`.trim() || 'Online';
  };

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = () => {
    if (!classDetails?.startDate) return null;

    const startDate = new Date(classDetails.startDate);
    const endDate = classDetails.endDate ? new Date(classDetails.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    // Format dates as YYYYMMDDTHHmmssZ
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: classDetails.name,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: classDetails.description || `Class: ${classDetails.name}`,
      location: getLocationString(),
      sf: 'true',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate ICS file content for Apple Calendar/Outlook
  const generateIcsContent = () => {
    if (!classDetails?.startDate) return null;

    const startDate = new Date(classDetails.startDate);
    const endDate = classDetails.endDate ? new Date(classDetails.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SteppersLife//Class Calendar//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${classDetails.name}`,
      `DESCRIPTION:${(classDetails.description || '').replace(/\n/g, '\\n').substring(0, 200)}`,
      `LOCATION:${getLocationString()}`,
      `URL:${typeof window !== 'undefined' ? window.location.href : ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  };

  // Download ICS file
  const downloadIcs = () => {
    const icsContent = generateIcsContent();
    if (!icsContent) return;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${classDetails.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isPast = classDetails.endDate ? classDetails.endDate < Date.now() : false;

  return (
    <>
      <PublicHeader />
      <div data-testid="class-detail-page" className="min-h-screen bg-muted">
        {/* Header */}
        <header className="bg-card shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                data-testid="back-to-classes"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Classes</span>
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                data-testid="share-btn"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Classes", href: "/classes" },
              { label: classDetails.name },
            ]}
          />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Top Section: Image + Info */}
            <div className="grid md:grid-cols-5 gap-8 mb-8">
              {/* Class Image - Left (2/5 width) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2"
              >
                <div className="relative w-full bg-muted rounded-xl overflow-hidden shadow-lg sticky top-24">
                  {classDetails.imageUrl ? (
                    <img
                      src={classDetails.imageUrl}
                      alt={classDetails.name}
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center bg-primary">
                      <BookOpen className="w-24 h-24 text-white opacity-50" />
                    </div>
                  )}

                  {/* Class Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold shadow-lg bg-primary text-white">
                      Class
                    </span>
                  </div>

                  {/* Past Class Badge */}
                  {isPast && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-muted text-foreground rounded-full text-xs font-semibold shadow-lg">
                        Past Class
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Class Info - Right (3/5 width) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-3"
              >
                {/* Class Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="class-title">
                  {classDetails.name}
                </h1>

                {/* Categories */}
                {classDetails.categories && classDetails.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6" data-testid="class-categories">
                    {classDetails.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Class Details Card */}
                <div className="bg-card rounded-lg border border-border p-6 mb-6">
                  {/* Enrollment Section - Real Data */}
                  {!mockData && classDetails.enrollmentTiers && classDetails.enrollmentTiers.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <div>
                          {/* Series Price Display */}
                          {classDetails.seriesPriceCents != null ? (
                            <>
                              <p className="text-3xl font-bold text-primary">
                                {classDetails.seriesPriceCents === 0
                                  ? "Free"
                                  : formatPrice(classDetails.seriesPriceCents)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Full Series ({classDetails.numberOfSessions || 1} {(classDetails.numberOfSessions || 1) === 1 ? "class" : "classes"})
                              </p>
                              {/* Door Price - if available */}
                              {classDetails.doorPriceCents != null && classDetails.doorPriceCents > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Drop-in: {formatPrice(classDetails.doorPriceCents)} per class (cash at door)
                                </p>
                              )}
                            </>
                          ) : classDetails.lowestPriceCents != null ? (
                            <>
                              <p className="text-3xl font-bold text-primary">
                                {classDetails.lowestPriceCents === 0
                                  ? "Free"
                                  : `From ${formatPrice(classDetails.lowestPriceCents)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {classDetails.enrollmentTiers.length === 1
                                  ? "Single enrollment option"
                                  : `${classDetails.enrollmentTiers.length} enrollment options`}
                              </p>
                            </>
                          ) : null}
                        </div>
                        {!isPast && classDetails.hasAvailableSpots ? (
                          <Button
                            size="lg"
                            className="px-8"
                            onClick={handleEnroll}
                            data-testid="enroll-now-btn"
                          >
                            <Ticket className="w-5 h-5 mr-2" />
                            Enroll Now
                          </Button>
                        ) : isPast ? (
                          <Button size="lg" className="px-8" disabled>
                            Class Ended
                          </Button>
                        ) : isOnWaitlist ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <span>You're on the waitlist!</span>
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            className="px-8"
                            variant="secondary"
                            onClick={openWaitlistModal}
                            data-testid="join-waitlist-btn"
                          >
                            <Bell className="w-5 h-5 mr-2" />
                            Join Waitlist
                            {waitlistCount !== undefined && waitlistCount > 0 && (
                              <span className="ml-2 text-xs opacity-70">({waitlistCount})</span>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Enrollment Tiers Preview */}
                      {classDetails.enrollmentTiers.length > 1 && (
                        <div className="mb-4 pb-4 border-b border-border">
                          <p className="text-sm font-medium text-foreground mb-2">Enrollment Options:</p>
                          <div className="space-y-2">
                            {classDetails.enrollmentTiers.slice(0, 3).map((tier) => (
                              <div
                                key={tier._id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-muted-foreground">{tier.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {tier.priceCents === 0 ? "Free" : formatPrice(tier.priceCents)}
                                  </span>
                                  {!tier.isAvailable && (
                                    <span className="text-xs text-destructive">(Sold Out)</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* No Enrollment Available */}
                  {!mockData && (!classDetails.enrollmentTiers || classDetails.enrollmentTiers.length === 0) && !isPast && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <p className="text-sm text-muted-foreground">
                        Enrollment options coming soon. Check back later!
                      </p>
                    </div>
                  )}

                  {/* Mock Course Info - Price, Lessons, Rating */}
                  {mockData && (
                    <>
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <div>
                          <p className="text-3xl font-bold text-primary">${mockData.price.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">One-time purchase</p>
                        </div>
                        <Button size="lg" className="px-8" onClick={handleEnroll} data-testid="enroll-now-btn">
                          Enroll Now
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-warning mb-1">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="text-lg font-bold text-foreground">{mockData.averageRating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <span className="text-lg font-bold text-foreground">{mockData.totalLessons}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Lessons</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-lg font-bold text-foreground">{mockData.enrollmentCount}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Students</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Date & Time */}
                  {classDetails.startDate && (
                    <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border" data-testid="class-date">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {formatEventDate(classDetails.startDate, classDetails.timezone)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatEventTime(classDetails.startDate, classDetails.timezone)}
                          {classDetails.endDate &&
                            ` - ${formatEventTime(classDetails.endDate, classDetails.timezone)}`}
                        </p>
                        {classDetails.eventTimeLiteral && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {classDetails.eventTimeLiteral}
                          </p>
                        )}
                        {/* Series Info - frequency and sessions */}
                        {classDetails.numberOfSessions && classDetails.numberOfSessions > 1 && (
                          <p className="text-sm text-primary font-medium mt-2">
                            {classDetails.numberOfSessions} classes,{" "}
                            {classDetails.classFrequency === "weekly" && "every week"}
                            {classDetails.classFrequency === "bi-weekly" && "every 2 weeks"}
                            {classDetails.classFrequency === "monthly" && "every month"}
                          </p>
                        )}
                        {/* Add to Calendar */}
                        {!isPast && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                                data-testid="add-to-calendar-btn"
                              >
                                <CalendarPlus className="w-4 h-4" />
                                Add to Calendar
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem asChild>
                                <a
                                  href={generateGoogleCalendarUrl() || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16l-6.72 6.72a.752.752 0 01-.528.24.752.752 0 01-.528-.24l-3.36-3.36a.75.75 0 111.056-1.056l2.832 2.832 6.192-6.192a.75.75 0 111.056 1.056z"/>
                                  </svg>
                                  Google Calendar
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={downloadIcs} className="flex items-center gap-2 cursor-pointer">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                Apple Calendar / Outlook
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {classDetails.location && typeof classDetails.location === "object" && (
                    <div className="flex items-start gap-3" data-testid="class-location">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        {classDetails.location.venueName && (
                          <p className="font-semibold text-foreground">
                            {classDetails.location.venueName}
                          </p>
                        )}
                        {classDetails.location.address && (
                          <p className="text-sm text-muted-foreground">
                            {classDetails.location.address}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {classDetails.location.city}, {classDetails.location.state}{" "}
                          {classDetails.location.zipCode}
                        </p>
                        {classDetails.location.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                              `${classDetails.location.address}, ${classDetails.location.city}, ${classDetails.location.state}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm mt-1 inline-flex items-center gap-1"
                          >
                            View Map
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Online Class Notice for Mock Data */}
                  {mockData && !classDetails.location && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Online Course</p>
                        <p className="text-sm text-muted-foreground">
                          Access this course anytime, anywhere with lifetime access
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer / Instructor */}
                {(classDetails.organizer || classDetails.organizerName) && (
                  <div className="bg-card rounded-lg border border-border p-6" data-testid="class-instructor">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Instructor</h3>
                    <div className="flex items-center gap-4">
                      {mockData?.instructorPhoto && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                          <Image
                            src={mockData.instructorPhoto}
                            alt={classDetails.organizerName || "Instructor"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-foreground font-medium text-xl">
                          {classDetails.organizer?.name ||
                            classDetails.organizerName ||
                            "Class Instructor"}
                        </p>
                        {classDetails.organizer?.email && (
                          <a
                            href={`mailto:${classDetails.organizer.email}`}
                            className="text-primary hover:underline text-sm mt-2 inline-block"
                          >
                            Contact Instructor
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Description Section - Full Width Below */}
            {classDetails.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8"
                data-testid="class-description"
              >
                <div className="bg-card rounded-lg border border-border p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">About This Class</h2>
                  <div className="prose max-w-none text-foreground">
                    <p className="whitespace-pre-wrap">{classDetails.description}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reviews Section - Only show for real classes, not mock data */}
            {!mockData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-8"
                data-testid="class-reviews"
              >
                <div className="bg-card rounded-lg border border-border p-6 md:p-8">
                  <ClassReviewList
                    classId={classDetails._id as Id<"events">}
                    isInstructor={user?.role === "organizer" && classDetails.organizer?.email === user?.email}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-card rounded-xl shadow-2xl p-6"
          >
            {/* Close button */}
            <button
              onClick={() => setShowWaitlistModal(false)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {waitlistSuccess ? (
              /* Success State */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">You're on the Waitlist!</h3>
                <p className="text-muted-foreground mb-6">
                  We'll notify you by email if a spot becomes available for this class.
                </p>
                <Button onClick={() => setShowWaitlistModal(false)} className="w-full">
                  Got it
                </Button>
              </div>
            ) : (
              /* Form State */
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Join Waitlist</h3>
                    <p className="text-sm text-muted-foreground">Get notified when a spot opens up</p>
                  </div>
                </div>

                <form onSubmit={handleJoinWaitlist} className="space-y-4">
                  <div>
                    <label htmlFor="waitlist-name" className="block text-sm font-medium text-foreground mb-1">
                      Your Name
                    </label>
                    <input
                      id="waitlist-name"
                      type="text"
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="waitlist-email" className="block text-sm font-medium text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter your email"
                    />
                  </div>

                  {waitlistError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                      {waitlistError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowWaitlistModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isJoiningWaitlist} className="flex-1">
                      {isJoiningWaitlist ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join Waitlist"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      <PublicFooter />
    </>
  );
}
