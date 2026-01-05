"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  ArrowLeft,
  Ticket,
  AlertCircle,
  ExternalLink,
  Bell,
  X,
  TrendingDown,
  Package,
  Zap,
  Hotel,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ShoppingCart,
  ZoomIn,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventDate, formatEventTime, formatEventDateTime } from "@/lib/date-format";
import { SocialShareButtons } from "@/components/events/SocialShareButtons";
import InteractiveSeatingChart from "@/components/seating/InteractiveSeatingChart";
import HotelSection from "@/components/hotels/HotelSection";
import { StickyCartBar } from "@/components/events/StickyCartBar";
import { useEventCart } from "@/contexts/EventCartContext";
import { SocialProof } from "@/components/events/SocialProof";
import { InterestedButton } from "@/components/events/InterestedButton";
import { WhosGoing } from "@/components/events/WhosGoing";
import { EventDiningSection } from "@/components/events/EventDiningSection";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
import { DressCodeBadge } from "@/components/events/DressCodeBadge";
import { BeginnerBadge } from "@/components/events/BeginnerBadge";
import { RelatedClasses } from "@/components/events/RelatedClasses";
import { HotelBlock } from "@/components/events/HotelBlock";
import { CarpoolSection } from "@/components/events/CarpoolSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toast } from "sonner";

// Tab type for purchase options
type PurchaseTab = "tickets" | "hotels" | "bundles";

// Type definitions for event data from Convex
interface TicketTier {
  _id: Id<"ticketTiers">;
  name: string;
  description?: string;
  price: number;
  currentPrice?: number;
  currentTierName?: string;
  quantity?: number;
  sold?: number;
  isEarlyBird?: boolean;
  nextPriceChange?: { date: number; price: number; tierName: string };
  pricingTiers?: Array<{
    name: string;
    price: number;
    availableFrom: number;
    availableUntil?: number;
  }>;
}

interface RoomType {
  id: string;
  name: string;
  description?: string;
  pricePerNightCents: number;
  quantity: number;
  sold: number;
  maxGuests: number;
}

interface HotelPackage {
  _id: Id<"hotelPackages">;
  hotelName: string;
  city: string;
  state: string;
  checkInDate: number;
  checkOutDate: number;
  roomTypes: RoomType[];
}

interface BundleTierDetail {
  tierId: Id<"ticketTiers">;
  tierName: string;
  quantity: number;
}

interface EventBundle {
  _id: Id<"ticketBundles">;
  name: string;
  description?: string;
  price: number;
  regularPrice?: number;
  available: number;
  percentageSavings?: number;
  includedTiersDetails?: BundleTierDetail[];
}

interface Seat {
  id: string;
  number: string;
  status: "AVAILABLE" | "RESERVED" | "UNAVAILABLE" | "BLOCKED";
  type?: string;
  sessionId?: string;
  sessionExpiry?: number;
}

interface Row {
  id: string;
  label: string;
  seats: Seat[];
  curved?: boolean;
}

interface Table {
  id: string;
  number: string | number;
  seats: Seat[];
  shape?: string;
  rotation?: number;
  customPath?: string;
  seatArc?: { startAngle?: number; arcDegrees?: number };
}

interface SeatingSection {
  id: string;
  name: string;
  color?: string;
  rows?: Row[];
  tables?: Table[];
}

interface SeatingChart {
  venueImageUrl?: string;
  seatingStyle?: "TABLE_BASED" | "ROW_BASED";
  sections: SeatingSection[];
}

interface EventDetailClientProps {
  eventId: Id<"events">;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const ENABLE_SEATING = process.env.NEXT_PUBLIC_ENABLE_SEATING_CHARTS === "true";
  const { setEventId } = useEventCart();

  // Initialize event cart with this event's ID
  useEffect(() => {
    setEventId(eventId);
  }, [eventId, setEventId]);

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, {
    eventId,
  });
  const seatingChart = ENABLE_SEATING
    ? useQuery(api.seating.queries.getPublicSeatingChart, { eventId })
    : null;
  const eventBundles = useQuery(api.bundles.queries.getBundlesForPublicEvent, { eventId });
  const hotelPackages = useQuery(api.hotels.queries.getHotelPackagesForEvent, { eventId });

  // Determine which tabs are available
  const hasTickets = (eventDetails?.ticketTiers?.length ?? 0) > 0;
  const hasHotels = (hotelPackages?.length ?? 0) > 0;
  const hasBundles = (eventBundles?.length ?? 0) > 0;

  // UI state
  const [activeTab, setActiveTab] = useState<PurchaseTab>("tickets");
  const [showDescription, setShowDescription] = useState(false);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  // Waitlist state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [waitlistTierId, setWaitlistTierId] = useState<Id<"ticketTiers"> | undefined>(undefined);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistQuantity, setWaitlistQuantity] = useState(1);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  const joinWaitlist = useMutation(api.waitlist.mutations.joinWaitlist);

  // Close flyer modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFlyerModal) {
        setShowFlyerModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showFlyerModal]);

  // Redirect CLASS events to their dedicated page
  useEffect(() => {
    if (eventDetails && eventDetails.eventType === "CLASS") {
      router.replace(`/classes/${eventId}`);
    }
  }, [eventDetails, eventId, router]);

  if (eventDetails === undefined) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting class
  if (eventDetails?.eventType === "CLASS") {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Redirecting to class...</p>
          </div>
        </div>
      </div>
    );
  }

  if (eventDetails === null) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This event doesn't exist or is no longer available.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: eventDetails.name,
      text: `Check out this event: ${eventDetails.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleJoinWaitlist = (tierId?: Id<"ticketTiers">) => {
    setWaitlistTierId(tierId);
    setShowWaitlistModal(true);
  };

  const handleSubmitWaitlist = async () => {
    if (!waitlistEmail || !waitlistName || waitlistQuantity < 1) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsJoiningWaitlist(true);
    try {
      await joinWaitlist({
        eventId,
        ticketTierId: waitlistTierId,
        email: waitlistEmail,
        name: waitlistName,
        quantity: waitlistQuantity,
      });
      toast.success("Successfully joined the waitlist! We'll notify you when tickets become available.");
      setShowWaitlistModal(false);
      setWaitlistEmail("");
      setWaitlistName("");
      setWaitlistQuantity(1);
      setWaitlistTierId(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to join waitlist";
      toast.error(message);
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const isUpcoming = eventDetails.startDate ? eventDetails.startDate > Date.now() : false;
  const isPast = eventDetails.endDate ? eventDetails.endDate < Date.now() : false;
  const showTickets =
    eventDetails.eventType === "TICKETED_EVENT" &&
    eventDetails.ticketsVisible &&
    eventDetails.paymentConfigured &&
    isUpcoming;

  // Check if all tickets are sold out
  const allTicketsSoldOut =
    eventDetails.ticketTiers?.every(
      (tier) =>
        tier.quantity !== undefined && tier.sold !== undefined && tier.quantity - tier.sold <= 0
    ) ?? false;

  return (
    <div className="min-h-screen bg-muted pb-24">
      {/* Compact Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logos/stepperslife-logo-dark.png"
                  alt="SteppersLife"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            { label: "Events", href: "/events" },
            { label: eventDetails.name },
          ]}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Compact Hero: Flyer + Event Info Side by Side */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl border border-border p-4 mb-4"
          >
            <div className="flex gap-4">
              {/* Small Flyer - Clickable to enlarge */}
              <div
                onClick={() => setShowFlyerModal(true)}
                className="group relative w-24 h-32 sm:w-32 sm:h-44 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
              >
                <Image
                  src={eventDetails.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80"}
                  alt={eventDetails.name}
                  fill
                  sizes="128px"
                  className="object-cover transition-transform group-hover:scale-105"
                  priority
                />
                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Event Type Badge */}
                <div className="absolute top-1 left-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      eventDetails.eventType === "SAVE_THE_DATE"
                        ? "bg-warning text-white"
                        : eventDetails.eventType === "FREE_EVENT"
                          ? "bg-success text-white"
                          : "bg-primary text-white"
                    }`}
                  >
                    {eventDetails.eventType === "SAVE_THE_DATE"
                      ? "Soon"
                      : eventDetails.eventType === "FREE_EVENT"
                        ? "Free"
                        : "Tickets"}
                  </span>
                </div>
                {isPast && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Past</span>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-foreground mb-2 line-clamp-2">
                  {eventDetails.name}
                </h1>

                {/* Date & Time */}
                {eventDetails.startDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {formatEventDate(eventDetails.startDate, eventDetails.timezone)}
                      {" · "}
                      {formatEventTime(eventDetails.startDate, eventDetails.timezone)}
                    </span>
                  </div>
                )}

                {/* Location */}
                {eventDetails.location && typeof eventDetails.location === "object" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {eventDetails.location.venueName}, {eventDetails.location.city}
                    </span>
                  </div>
                )}

                {/* Organizer */}
                {(eventDetails.organizer || eventDetails.organizerName) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      By {eventDetails.organizer?.name || eventDetails.organizerName}
                    </span>
                  </div>
                )}

                {/* Categories */}
                {eventDetails.categories && eventDetails.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {eventDetails.categories.slice(0, 3).map((category) => (
                      <span
                        key={category}
                        className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Culture-Specific Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {eventDetails.eventSubType && (
                    <EventTypeBadge subType={eventDetails.eventSubType} size="sm" />
                  )}
                  {eventDetails.dressCode && (
                    <DressCodeBadge dressCode={eventDetails.dressCode} details={eventDetails.dressCodeDetails} size="sm" />
                  )}
                  {eventDetails.beginnerFriendly && (
                    <BeginnerBadge beginnerFriendly={true} hasLesson={eventDetails.hasBeginnerLesson} size="sm" variant="badge" />
                  )}
                </div>

                {/* Social Proof + Interested Button */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border">
                  <SocialProof eventId={eventId} variant="card" />
                  <InterestedButton eventId={eventId} variant="detail" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Selection Cards - User Friendly */}
          {(hasTickets || hasHotels || hasBundles) && (
            <div className="bg-card rounded-xl border border-border mb-4 overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-semibold text-foreground">What would you like?</h2>
                <p className="text-sm text-muted-foreground">Select an option to see choices</p>
              </div>

              {/* Selection Cards */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Tickets Card */}
                  {hasTickets && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("tickets")}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        activeTab === "tickets"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        activeTab === "tickets" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {activeTab === "tickets" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      <Ticket className={`w-8 h-8 mb-2 ${activeTab === "tickets" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`font-semibold ${activeTab === "tickets" ? "text-primary" : "text-foreground"}`}>
                        Tickets
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {eventDetails.ticketTiers?.length} option{(eventDetails.ticketTiers?.length || 0) !== 1 ? "s" : ""}
                      </span>
                      {eventDetails.ticketTiers && eventDetails.ticketTiers.length > 0 && (
                        <span className="text-xs font-medium text-success mt-1">
                          from ${(Math.min(...eventDetails.ticketTiers.map((t: TicketTier) => t.currentPrice || t.price)) / 100).toFixed(0)}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Hotels Card */}
                  {hasHotels && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("hotels")}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        activeTab === "hotels"
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        activeTab === "hotels" ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {activeTab === "hotels" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      <Hotel className={`w-8 h-8 mb-2 ${activeTab === "hotels" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`font-semibold ${activeTab === "hotels" ? "text-primary" : "text-foreground"}`}>
                        Hotel
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {hotelPackages?.length} hotel{(hotelPackages?.length || 0) !== 1 ? "s" : ""}
                      </span>
                      {hotelPackages && hotelPackages.length > 0 && (
                        <span className="text-xs font-medium text-success mt-1">
                          from ${(Math.min(...hotelPackages.flatMap((h: HotelPackage) => h.roomTypes.map((r: RoomType) => r.pricePerNightCents))) / 100).toFixed(0)}/night
                        </span>
                      )}
                    </button>
                  )}

                  {/* Bundles Card */}
                  {hasBundles && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("bundles")}
                      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                        activeTab === "bundles"
                          ? "border-success bg-success/5 shadow-md"
                          : "border-border hover:border-success/50 hover:bg-muted/50"
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        activeTab === "bundles" ? "border-success bg-success" : "border-muted-foreground"
                      }`}>
                        {activeTab === "bundles" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      <Package className={`w-8 h-8 mb-2 ${activeTab === "bundles" ? "text-success" : "text-muted-foreground"}`} />
                      <span className={`font-semibold ${activeTab === "bundles" ? "text-success" : "text-foreground"}`}>
                        Bundle
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Best value
                      </span>
                      <span className="text-xs font-bold text-success mt-1 px-2 py-0.5 bg-success/10 rounded">
                        SAVE {eventBundles?.[0]?.percentageSavings || 10}%
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Divider with selected label */}
              <div className="border-t border-border">
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {activeTab === "tickets" && <><Ticket className="w-4 h-4" /> Select your tickets:</>}
                    {activeTab === "hotels" && <><Hotel className="w-4 h-4" /> Choose your hotel:</>}
                    {activeTab === "bundles" && <><Package className="w-4 h-4" /> Pick a bundle deal:</>}
                  </p>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {/* TICKETS TAB */}
                  {activeTab === "tickets" && hasTickets && (
                    <motion.div
                      key="tickets"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {eventDetails.ticketTiers?.map((tier: TicketTier) => {
                        const isSoldOut =
                          tier.quantity !== undefined &&
                          tier.sold !== undefined &&
                          tier.quantity - tier.sold <= 0;
                        const available = (tier.quantity ?? 0) - (tier.sold ?? 0);
                        const qty = ticketQuantities[tier._id] || 0;

                        return (
                          <div
                            key={tier._id}
                            className={`border rounded-lg p-4 transition-all ${
                              isSoldOut
                                ? "border-border bg-muted/50 opacity-60"
                                : qty > 0
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">{tier.name}</h4>
                                  {tier.isEarlyBird && tier.currentTierName && (
                                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-warning text-white rounded font-medium">
                                      <Zap className="w-3 h-3" />
                                      {tier.currentTierName}
                                    </span>
                                  )}
                                </div>
                                {tier.description && (
                                  <p className="text-sm text-muted-foreground mb-1">{tier.description}</p>
                                )}
                                <p className={`text-xs ${isSoldOut ? "text-destructive" : "text-success"}`}>
                                  {isSoldOut ? "Sold out" : `${available} available`}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">
                                    ${((tier.currentPrice || tier.price) / 100).toFixed(2)}
                                  </p>
                                  {tier.isEarlyBird && tier.price !== tier.currentPrice && (
                                    <p className="text-xs text-muted-foreground line-through">
                                      ${(tier.price / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>

                                {/* Quantity Selector */}
                                {!isSoldOut && showTickets ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTicketQuantities((prev) => ({
                                          ...prev,
                                          [tier._id]: Math.max(0, (prev[tier._id] || 0) - 1),
                                        }))
                                      }
                                      disabled={qty === 0}
                                      className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-semibold">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTicketQuantities((prev) => ({
                                          ...prev,
                                          [tier._id]: Math.min(available, (prev[tier._id] || 0) + 1),
                                        }))
                                      }
                                      disabled={qty >= available}
                                      className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : isSoldOut ? (
                                  <button
                                    type="button"
                                    onClick={() => handleJoinWaitlist(tier._id)}
                                    className="px-3 py-1.5 bg-warning text-white rounded text-xs font-medium hover:bg-warning/90"
                                  >
                                    <Bell className="w-3 h-3 inline mr-1" />
                                    Waitlist
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Ticket selection summary */}
                      {Object.values(ticketQuantities).some((q) => q > 0) && (
                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {Object.values(ticketQuantities).reduce((sum, q) => sum + q, 0)} ticket(s) selected
                            </span>
                            <Link
                              href={`/events/${eventId}/checkout`}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                              Continue to Checkout
                            </Link>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* HOTELS TAB */}
                  {activeTab === "hotels" && hasHotels && (
                    <motion.div
                      key="hotels"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {hotelPackages?.map((hotel: HotelPackage) => {
                        const nights = Math.ceil(
                          (hotel.checkOutDate - hotel.checkInDate) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div key={hotel._id} className="border border-border rounded-lg overflow-hidden">
                            {/* Hotel Header */}
                            <div className="p-4 bg-muted/30">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-foreground">{hotel.hotelName}</h4>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {hotel.city}, {hotel.state}
                                  </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  <p>{format(new Date(hotel.checkInDate), "MMM d")} - {format(new Date(hotel.checkOutDate), "MMM d")}</p>
                                  <p className="text-xs">{nights} night{nights > 1 ? "s" : ""}</p>
                                </div>
                              </div>
                            </div>

                            {/* Room Types - ALL VISIBLE */}
                            <div className="p-4 space-y-3">
                              {hotel.roomTypes.map((room: RoomType) => {
                                const available = room.quantity - room.sold;
                                const isSoldOut = available <= 0;

                                return (
                                  <div
                                    key={room.id}
                                    className={`border rounded-lg p-3 ${
                                      isSoldOut ? "border-border bg-muted/30 opacity-60" : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground">{room.name}</p>
                                        {room.description && (
                                          <p className="text-sm text-muted-foreground">{room.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                          <Users className="w-3 h-3 inline mr-1" />
                                          Up to {room.maxGuests} guests
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-primary">
                                          ${(room.pricePerNightCents / 100).toFixed(0)}
                                          <span className="text-xs font-normal text-muted-foreground">/night</span>
                                        </p>
                                        <p className={`text-xs ${isSoldOut ? "text-destructive" : "text-success"}`}>
                                          {isSoldOut ? "Sold out" : `${available} left`}
                                        </p>
                                      </div>
                                      {!isSoldOut && (
                                        <Link
                                          href={`/events/${eventId}/hotels`}
                                          className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90"
                                        >
                                          Book
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* BUNDLES TAB */}
                  {activeTab === "bundles" && hasBundles && (
                    <motion.div
                      key="bundles"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {eventBundles?.map((bundle: EventBundle) => (
                        <div
                          key={bundle._id}
                          className="border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer"
                          onClick={() => router.push(`/bundles/${bundle._id}`)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground">{bundle.name}</h4>
                                <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-success text-white rounded font-bold">
                                  <TrendingDown className="w-3 h-3" />
                                  Save {bundle.percentageSavings}%
                                </span>
                              </div>
                              {bundle.description && (
                                <p className="text-sm text-muted-foreground mb-2">{bundle.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {bundle.includedTiersDetails?.map((tier: BundleTierDetail) => (
                                  <span
                                    key={tier.tierId}
                                    className="text-xs px-2 py-0.5 bg-muted rounded"
                                  >
                                    {tier.quantity}x {tier.tierName}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                ${(bundle.price / 100).toFixed(2)}
                              </p>
                              {bundle.regularPrice && (
                                <p className="text-sm text-muted-foreground line-through">
                                  ${(bundle.regularPrice / 100).toFixed(2)}
                                </p>
                              )}
                              <p className="text-xs text-success mt-1">
                                {bundle.available} available
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Door Price for FREE_EVENT */}
          {eventDetails.eventType === "FREE_EVENT" && eventDetails.doorPrice && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-success flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Pay at the Door
                    </p>
                    <p className="text-success font-bold text-lg">{eventDetails.doorPrice}</p>
                  </div>
                  {isUpcoming && (
                    <Link
                      href={`/events/${eventId}/register`}
                      className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90"
                    >
                      Register Free
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save the Date Message */}
          {eventDetails.eventType === "SAVE_THE_DATE" && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-warning font-semibold">Tickets Coming Soon!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Save this date. Tickets will be available for purchase soon.
                </p>
              </div>
            </div>
          )}

          {/* View Seating Chart Button */}
          {ENABLE_SEATING && seatingChart && seatingChart.sections.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSeatingModal(true)}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors"
            >
              <MapPin className="w-5 h-5 text-primary" />
              View Seating Chart
            </button>
          )}

          {/* About This Event - Collapsible */}
          {eventDetails.description && (
            <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground">About This Event</span>
                {showDescription ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {showDescription && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <p className="text-muted-foreground whitespace-pre-wrap">{eventDetails.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Dress Code Section */}
          {eventDetails.dressCode && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">👔</span>
                Dress Code
              </h3>
              <DressCodeBadge
                dressCode={eventDetails.dressCode}
                details={eventDetails.dressCodeDetails}
                size="lg"
              />
              {eventDetails.dressCodeDetails && (
                <p className="mt-3 text-muted-foreground text-sm">
                  {eventDetails.dressCodeDetails}
                </p>
              )}
            </div>
          )}

          {/* Beginner Info Section */}
          {eventDetails.beginnerFriendly && (
            <div className="mb-4">
              <BeginnerBadge
                beginnerFriendly={true}
                hasLesson={eventDetails.hasBeginnerLesson}
                lessonTime={eventDetails.beginnerLessonTime}
                variant="detail"
              />
            </div>
          )}

          {/* Hotel Block Section - For out-of-town guests */}
          {eventDetails.hotelBlock && (
            <div className="mb-4">
              <HotelBlock hotelBlock={eventDetails.hotelBlock} />
            </div>
          )}

          {/* Carpool/Ride Share Section - For out-of-town guests */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <CarpoolSection
              eventId={eventId}
              eventName={eventDetails.name}
            />
          </div>

          {/* Who's Going Section */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <WhosGoing
              eventId={eventId}
              eventName={eventDetails.name}
              onInviteFriends={handleShare}
            />
          </div>

          {/* Dine Before the Event - Restaurant Recommendations */}
          {eventDetails.location && typeof eventDetails.location === "object" && eventDetails.location.city && (
            <EventDiningSection eventCity={eventDetails.location.city} />
          )}

          {/* Related Classes - Help attendees prepare */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <RelatedClasses eventId={eventId} />
          </div>

          {/* Organizer + Share */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                {(eventDetails.organizer || eventDetails.organizerName) && (
                  <>
                    <p className="text-sm text-muted-foreground">Organized by</p>
                    <p className="font-medium text-foreground">
                      {eventDetails.organizer?.name || eventDetails.organizerName}
                    </p>
                    {eventDetails.organizer?.email && (
                      <a
                        href={`mailto:${eventDetails.organizer.email}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Contact
                      </a>
                    )}
                  </>
                )}
              </div>
              <SocialShareButtons
                eventName={eventDetails.name}
                eventUrl={typeof window !== "undefined" ? window.location.href : ""}
                eventDate={
                  eventDetails.startDate
                    ? formatEventDate(eventDetails.startDate, eventDetails.timezone)
                    : ""
                }
                hasTickets={showTickets}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seating Chart Modal */}
      <AnimatePresence>
        {ENABLE_SEATING && showSeatingModal && seatingChart && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Seating Chart</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSeatingModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Venue Image */}
              {seatingChart.venueImageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden border border-border relative aspect-video">
                  <Image
                    src={seatingChart.venueImageUrl}
                    alt="Venue Layout"
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-contain"
                  />
                </div>
              )}

              {/* Interactive Ballroom Chart for TABLE_BASED layouts */}
              {(seatingChart as SeatingChart).seatingStyle === "TABLE_BASED" ? (
                <div className="mb-6">
                  <InteractiveSeatingChart
                    eventId={eventId}
                    onSeatSelect={() => {}} // Read-only preview, no selection
                    onSeatDeselect={() => {}}
                    selectedSeats={[]}
                    className="min-h-[500px]"
                  />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Click "Buy Tickets" below to select your seats
                  </p>
                </div>
              ) : (
                /* Traditional Row/Section view for ROW_BASED layouts */
                <div className="space-y-6">
                  {seatingChart.sections.map((section: SeatingSection) => (
                    <div key={section.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: section.color || "#3B82F6" }}
                        ></div>
                        <h3 className="text-lg font-bold text-foreground">{section.name}</h3>
                      </div>

                      {/* Row-based seating */}
                      {section.rows && section.rows.length > 0 && (
                        <div className="space-y-2">
                          {section.rows.map((row: Row) => (
                            <div key={row.id} className="flex items-center gap-2">
                              <span className="w-8 text-sm font-medium text-muted-foreground text-right">
                                {row.label}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {row.seats.map((seat: Seat) => (
                                  <div
                                    key={seat.id}
                                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium border-2 ${
                                      seat.status === "RESERVED"
                                        ? "bg-muted text-muted-foreground border-border"
                                        : seat.status === "UNAVAILABLE"
                                          ? "bg-muted text-muted-foreground border-border"
                                          : "bg-card text-foreground border-foreground"
                                    }`}
                                    title={`Seat ${seat.number} - ${seat.status}`}
                                  >
                                    {seat.number}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Table-based seating */}
                      {section.tables && section.tables.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {section.tables.map((table: Table) => (
                            <div
                              key={table.id}
                              className="border border-border rounded-lg p-3 bg-muted"
                            >
                              <p className="font-semibold text-foreground mb-2">
                                Table {table.number}
                              </p>
                              <div className="flex gap-1 flex-wrap">
                                {table.seats.map((seat: Seat) => (
                                  <div
                                    key={seat.id}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                                      seat.status === "RESERVED"
                                        ? "bg-muted text-muted-foreground border-border"
                                        : "bg-card text-foreground border-foreground"
                                    }`}
                                    title={`Seat ${seat.number}`}
                                  >
                                    {seat.number}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legend - Only show for ROW_BASED layouts */}
              {(seatingChart as SeatingChart).seatingStyle !== "TABLE_BASED" && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Legend</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-card border-2 border-foreground rounded"></div>
                      <span className="text-foreground">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted border-2 border-border rounded"></div>
                      <span className="text-foreground">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted border-2 border-border rounded"></div>
                      <span className="text-foreground">Unavailable</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href={`/events/${eventId}/checkout`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  onClick={() => setShowSeatingModal(false)}
                >
                  <Ticket className="w-5 h-5" />
                  Buy Tickets
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-warning" />
                  <h2 className="text-xl font-bold text-foreground">Join Waitlist</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-muted-foreground mb-6">
                We'll notify you when tickets become available for this event.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="waitlist-email"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-warning"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="waitlist-name"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="waitlist-name"
                    type="text"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-warning"
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="waitlist-quantity"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Number of Tickets
                  </label>
                  <input
                    id="waitlist-quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={waitlistQuantity}
                    onChange={(e) => setWaitlistQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warning focus:border-warning"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleSubmitWaitlist}
                  disabled={isJoiningWaitlist}
                  className="flex-1 px-6 py-3 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors font-medium disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoiningWaitlist ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Join Waitlist
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Flyer Enlargement Modal */}
      <AnimatePresence>
        {showFlyerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFlyerModal(false)}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl max-h-[90vh] cursor-default"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowFlyerModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-muted-foreground transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Full-size flyer image */}
              <div className="relative max-w-full max-h-[90vh]">
                <Image
                  src={eventDetails.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80"}
                  alt={eventDetails.name}
                  width={1200}
                  height={1600}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  priority
                />
              </div>

              {/* Hint text */}
              <p className="absolute -bottom-10 left-0 right-0 text-center text-white text-sm opacity-75">
                Click outside or press ESC to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Cart Bar for event purchases */}
      <StickyCartBar eventId={eventId} />
    </div>
  );
}
