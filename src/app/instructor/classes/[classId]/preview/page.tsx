"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Share2,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Tag,
  Ticket,
  CalendarPlus,
  ChevronDown,
  Eye,
  Edit,
  Loader2,
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
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default function ClassPreviewPage({ params }: PageProps) {
  const { classId } = use(params);
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);

  // Get current user to verify ownership
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Get class details
  const classDetails = useQuery(
    api.events.queries.getEventById,
    { eventId: classId as Id<"events"> }
  );

  // Get enrollment tiers
  const enrollmentTiers = useQuery(
    api.events.queries.getEventTicketTiers,
    { eventId: classId as Id<"events"> }
  );

  // Publish mutation
  const publishEvent = useMutation(api.events.mutations.publishEvent);

  // Format price for display
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Handle publish
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishEvent({ eventId: classId as Id<"events"> });
      toast.success("Class published successfully!");
      // Redirect to the public class page
      router.push(`/classes/${classId}`);
    } catch (error) {
      console.error("Failed to publish class:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish class");
    } finally {
      setIsPublishing(false);
    }
  };

  // Loading state
  if (authLoading || currentUser === undefined || classDetails === undefined) {
    return <LoadingSpinner fullPage text="Loading preview..." />;
  }

  // Class not found
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
                This class doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Link
                href="/instructor/classes"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Classes
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Check if user is the instructor of this class
  const isInstructor = currentUser && classDetails.organizerId === currentUser._id;
  const isAdmin = currentUser?.role === "admin";

  if (!isInstructor && !isAdmin) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You don&apos;t have permission to preview this class. Only the instructor can view the preview.
              </p>
              <Link
                href="/instructor/classes"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Classes
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
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Helper to get location string from location object
  const getLocationString = () => {
    if (!classDetails?.location) return "Online";
    if (typeof classDetails.location === "string") return classDetails.location;
    const loc = classDetails.location;
    return (
      `${loc.venueName || ""} ${loc.address || ""}, ${loc.city || ""}, ${loc.state || ""} ${loc.zipCode || ""}`.trim() ||
      "Online"
    );
  };

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = () => {
    if (!classDetails?.startDate) return null;

    const startDate = new Date(classDetails.startDate);
    const endDate = classDetails.endDate
      ? new Date(classDetails.endDate)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    // Format dates as YYYYMMDDTHHmmssZ
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: classDetails.name,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: classDetails.description || `Class: ${classDetails.name}`,
      location: getLocationString(),
      sf: "true",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate ICS file content for Apple Calendar/Outlook
  const generateIcsContent = () => {
    if (!classDetails?.startDate) return null;

    const startDate = new Date(classDetails.startDate);
    const endDate = classDetails.endDate
      ? new Date(classDetails.endDate)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SteppersLife//Class Calendar//EN",
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${classDetails.name}`,
      `DESCRIPTION:${(classDetails.description || "").replace(/\n/g, "\\n").substring(0, 200)}`,
      `LOCATION:${getLocationString()}`,
      `URL:${typeof window !== "undefined" ? window.location.href : ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return icsContent;
  };

  // Download ICS file
  const downloadIcs = () => {
    const icsContent = generateIcsContent();
    if (!icsContent) return;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${classDetails.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isPast = classDetails.endDate ? classDetails.endDate < Date.now() : false;
  const isDraft = classDetails.status === "DRAFT";

  // Calculate lowest price from enrollment tiers
  const lowestPriceCents =
    enrollmentTiers && enrollmentTiers.length > 0
      ? Math.min(...enrollmentTiers.map((t) => t.price))
      : null;

  const hasAvailableSpots =
    enrollmentTiers && enrollmentTiers.length > 0
      ? enrollmentTiers.some((t) => t.quantity > t.sold)
      : false;

  return (
    <>
      <PublicHeader />
      <div data-testid="class-preview-page" className="min-h-screen bg-muted">
        {/* Preview Banner */}
        <div className="bg-warning/20 border-b border-warning/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-full">
                  <Eye className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Preview Mode</span>
                  <p className="text-sm text-muted-foreground">
                    This is how your class will appear to students. Only you can see this preview.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/instructor/classes/${classId}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Class
                </Link>
                {isDraft && (
                  <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="inline-flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Publish Class
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="bg-card shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/instructor/classes"
                className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                data-testid="back-to-classes"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to My Classes</span>
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
                    // eslint-disable-next-line @next/next/no-img-element
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

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                        isDraft
                          ? "bg-warning text-white"
                          : isPast
                          ? "bg-muted text-foreground"
                          : "bg-success text-white"
                      }`}
                    >
                      {isDraft ? "Draft" : isPast ? "Past Class" : "Published"}
                    </span>
                  </div>
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
                <h1
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                  data-testid="class-title"
                >
                  {classDetails.name}
                </h1>

                {/* Categories */}
                {classDetails.categories && classDetails.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6" data-testid="class-categories">
                    {classDetails.categories.map((category: string) => (
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
                  {/* Enrollment Section */}
                  {enrollmentTiers && enrollmentTiers.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <div>
                          {lowestPriceCents != null && (
                            <>
                              <p className="text-3xl font-bold text-primary">
                                {lowestPriceCents === 0
                                  ? "Free"
                                  : `From ${formatPrice(lowestPriceCents)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {enrollmentTiers.length === 1
                                  ? "Single enrollment option"
                                  : `${enrollmentTiers.length} enrollment options`}
                              </p>
                            </>
                          )}
                        </div>
                        {!isPast && hasAvailableSpots ? (
                          <Button
                            size="lg"
                            className="px-8"
                            disabled
                            data-testid="enroll-now-btn"
                          >
                            <Ticket className="w-5 h-5 mr-2" />
                            Enroll Now
                          </Button>
                        ) : isPast ? (
                          <Button size="lg" className="px-8" disabled>
                            Class Ended
                          </Button>
                        ) : (
                          <Button size="lg" className="px-8" variant="secondary" disabled>
                            Sold Out
                          </Button>
                        )}
                      </div>

                      {/* Enrollment Tiers Preview */}
                      {enrollmentTiers.length > 1 && (
                        <div className="mb-4 pb-4 border-b border-border">
                          <p className="text-sm font-medium text-foreground mb-2">
                            Enrollment Options:
                          </p>
                          <div className="space-y-2">
                            {enrollmentTiers.slice(0, 3).map((tier) => (
                              <div
                                key={tier._id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-muted-foreground">{tier.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {tier.price === 0 ? "Free" : formatPrice(tier.price)}
                                  </span>
                                  {tier.sold >= tier.quantity && (
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
                  {(!enrollmentTiers || enrollmentTiers.length === 0) && !isPast && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <p className="text-sm text-muted-foreground">
                        No enrollment options configured yet. Add pricing tiers to allow students to
                        enroll.
                      </p>
                    </div>
                  )}

                  {/* Date & Time */}
                  {classDetails.startDate && (
                    <div
                      className="flex items-start gap-3 mb-4 pb-4 border-b border-border"
                      data-testid="class-date"
                    >
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
                                  href={generateGoogleCalendarUrl() || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16l-6.72 6.72a.752.752 0 01-.528.24.752.752 0 01-.528-.24l-3.36-3.36a.75.75 0 111.056-1.056l2.832 2.832 6.192-6.192a.75.75 0 111.056 1.056z" />
                                  </svg>
                                  Google Calendar
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={downloadIcs}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
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

                  {/* Online Class Notice */}
                  {(!classDetails.location ||
                    (typeof classDetails.location === "object" &&
                      !classDetails.location.city)) && (
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

                {/* Instructor */}
                {classDetails.organizerName && (
                  <div
                    className="bg-card rounded-lg border border-border p-6"
                    data-testid="class-instructor"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-3">Instructor</h3>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-foreground font-medium text-xl">
                          {classDetails.organizerName}
                        </p>
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

            {/* Preview Notice at Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 text-center">
                <Eye className="w-8 h-8 text-warning mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  This is a Preview
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Students cannot see this page until you publish the class.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href={`/instructor/classes/${classId}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Class
                  </Link>
                  {isDraft && (
                    <Button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-2"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Publish Class
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}
