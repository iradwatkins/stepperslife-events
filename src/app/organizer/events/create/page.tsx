"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Calendar, MapPin, FileText, Users, Info, Ticket, Check, AlertCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { WelcomePopup } from "@/components/organizer/WelcomePopup";
import { FlyerUploadHero, ExtractedEventData } from "@/components/organizer/FlyerUploadHero";
import { ExtractedDataReview } from "@/components/organizer/ExtractedDataReview";
import { ScanFlyerButton } from "@/components/organizer/ScanFlyerButton";
import { toast } from "sonner";
import { getTimezoneFromLocation, getTimezoneName } from "@/lib/timezone";
import { Id } from "@/convex/_generated/dataModel";
import { format as formatDate } from "date-fns";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

type EventType = "TICKETED_EVENT" | "FREE_EVENT" | "SAVE_THE_DATE" | "SEATED_EVENT";

// Wizard phases for upload-first flow
type WizardPhase = "upload" | "review" | "wizard" | "manual";

// Step definitions for each event type
type StepId = "basic" | "datetime" | "location" | "seating" | "tickets" | "details" | "review";

interface StepConfig {
  id: StepId;
  title: string;
  description: string;
}

// Get steps based on event type - adaptive wizard flow
function getStepsForEventType(eventType: EventType, hasPrefilledData: boolean): StepConfig[] {
  const basicInfo: StepConfig = { id: "basic", title: "Basic Information", description: "Tell us about your event" };
  const dateTime: StepConfig = { id: "datetime", title: "Date & Time", description: "When is your event happening?" };
  const location: StepConfig = { id: "location", title: "Location", description: "Where is your event taking place?" };
  const seating: StepConfig = { id: "seating", title: "Seating Layout", description: "Design your table seating" };
  const tickets: StepConfig = { id: "tickets", title: "Tickets", description: "Set up your ticket tiers" };
  const details: StepConfig = { id: "details", title: "Details", description: "Final touches for your event" };
  const review: StepConfig = { id: "review", title: "Review & Launch", description: "Review and publish your event" };

  // When data is pre-filled from flyer scan, we can skip some steps
  if (hasPrefilledData) {
    switch (eventType) {
      case "SAVE_THE_DATE":
        // Minimal: just review (everything pre-filled)
        return [details, review];
      case "FREE_EVENT":
        // Skip basic info, go straight to details
        return [details, review];
      case "TICKETED_EVENT":
        // Need tickets still
        return [tickets, details, review];
      case "SEATED_EVENT":
        // Need seating and tickets
        return [seating, tickets, details, review];
      default:
        return [details, review];
    }
  }

  // Full wizard for manual entry
  switch (eventType) {
    case "SAVE_THE_DATE":
      return [basicInfo, dateTime, location, review];
    case "FREE_EVENT":
      return [basicInfo, dateTime, location, details, review];
    case "TICKETED_EVENT":
      return [basicInfo, dateTime, location, tickets, details, review];
    case "SEATED_EVENT":
      return [basicInfo, dateTime, location, seating, tickets, details, review];
    default:
      return [basicInfo, dateTime, location, details, review];
  }
}

interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
}

// Seating section interface for Quick Setup
interface SeatingSection {
  id: string;
  name: string;
  tableShape: "ROUND" | "RECTANGULAR" | "SQUARE";
  tableCount: number;
  seatsPerTable: number;
}

// Ticket tier with section linking for seated events
interface TicketTierForm {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  linkedSectionId?: string;
  sellMode?: "INDIVIDUAL" | "TABLE" | "BOTH";
  earlyBirdPrice?: string;
  earlyBirdUntil?: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  // Wizard phase state - starts with upload
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>("upload");
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [flyerPreviewUrl, setFlyerPreviewUrl] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(0);

  // Basic Information
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("TICKETED_EVENT");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Date & Time
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [detectedTimezone, setDetectedTimezone] = useState("");

  // Location
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("USA");

  // Details
  const [capacity, setCapacity] = useState("");
  const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(null);
  const [doorPrice, setDoorPrice] = useState("");

  // Culture-Specific Fields (Stepping community)
  const [eventSubType, setEventSubType] = useState<string>("");
  const [dressCode, setDressCode] = useState<string>("");
  const [dressCodeDetails, setDressCodeDetails] = useState("");
  const [beginnerFriendly, setBeginnerFriendly] = useState(false);
  const [hasBeginnerLesson, setHasBeginnerLesson] = useState(false);
  const [beginnerLessonTime, setBeginnerLessonTime] = useState("");

  // Hotel Block (for out-of-town guests)
  const [showHotelBlock, setShowHotelBlock] = useState(false);
  const [hotelName, setHotelName] = useState("");
  const [hotelBookingUrl, setHotelBookingUrl] = useState("");
  const [hotelGroupCode, setHotelGroupCode] = useState("");
  const [hotelRate, setHotelRate] = useState("");
  const [hotelCutoffDate, setHotelCutoffDate] = useState("");
  const [hotelNotes, setHotelNotes] = useState("");

  // Seating sections (for SEATED_EVENT)
  const [seatingSections, setSeatingSections] = useState<SeatingSection[]>([
    { id: "1", name: "VIP Section", tableShape: "ROUND", tableCount: 10, seatsPerTable: 8 }
  ]);
  const [skipSeatingSetup, setSkipSeatingSetup] = useState(false);

  // Ticket Tiers (for TICKETED_EVENT and SEATED_EVENT)
  const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([
    { id: "1", name: "", description: "", price: "", quantity: "", sellMode: "BOTH" }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Compute steps based on event type and whether data is pre-filled
  const steps = useMemo(() => getStepsForEventType(eventType, hasPrefilledData), [eventType, hasPrefilledData]);
  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  // Calculate total seating capacity
  const totalSeatingCapacity = seatingSections.reduce(
    (sum, section) => sum + section.tableCount * section.seatsPerTable,
    0
  );

  // Queries for welcome popup logic
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const myEvents = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const creditBalance = useQuery(api.payments.queries.getCreditBalance);
  const markWelcomePopupShown = useMutation(api.users.mutations.markWelcomePopupShown);

  // All users can create ticketed events by default (restrictions handled by middleware)
  const canCreateTicketedEvents = true;

  // Show welcome popup if this is their first event and they haven't seen it
  useEffect(() => {
    if (myEvents !== undefined && creditBalance !== undefined) {
      const isFirstEvent = myEvents.length === 0;
      const hasNoCredits = !creditBalance || creditBalance.creditsRemaining === 0;

      if (isFirstEvent && hasNoCredits) {
        setShowWelcomePopup(true);
      }
    }
  }, [myEvents, creditBalance]);

  const handleWelcomePopupClose = async () => {
    setShowWelcomePopup(false);
    try {
      await markWelcomePopupShown();
    } catch (error) {
      console.error("[CreateEvent] Failed to mark welcome popup as shown:", error);
    }
  };

  // Auto-detect timezone when city or state changes
  useEffect(() => {
    if (city && state) {
      const tz = getTimezoneFromLocation(city, state);
      setTimezone(tz);
      setDetectedTimezone(getTimezoneName(tz));
    }
  }, [city, state]);

  const createEvent = useMutation(api.events.mutations.createEvent);

  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  // Handler for flyer data extraction from FlyerUploadHero
  const handleFlyerDataExtracted = (data: ExtractedEventData) => {
    // Auto-fill form fields from extracted data
    if (data.eventName) setEventName(data.eventName);
    if (data.description) setDescription(data.description);
    if (data.venueName) setVenueName(data.venueName);
    if (data.address) setAddress(data.address);
    if (data.city) setCity(data.city);
    if (data.state) setState(data.state);
    if (data.zipCode) setZipCode(data.zipCode);
    if (data.categories && data.categories.length > 0) {
      const validCategories = data.categories.filter((cat) =>
        EVENT_CATEGORIES.includes(cat as typeof EVENT_CATEGORIES[number])
      );
      if (validCategories.length > 0) {
        setCategories(validCategories);
      }
    }
    if (data.eventType) {
      setEventType(data.eventType);
    }

    // Set start date/time if extracted
    if (data.eventDate && data.eventTime) {
      const dateTime = `${data.eventDate}T${data.eventTime}`;
      setStartDate(dateTime);
    } else if (data.eventDate) {
      setStartDate(`${data.eventDate}T19:00`);
    }

    // Set end date/time if extracted
    if (data.eventEndDate && data.eventEndTime) {
      const dateTime = `${data.eventEndDate}T${data.eventEndTime}`;
      setEndDate(dateTime);
    } else if (data.eventDate && data.eventEndTime) {
      setEndDate(`${data.eventDate}T${data.eventEndTime}`);
    }

    // Set the uploaded image
    if (data.imageStorageId) {
      setUploadedImageId(data.imageStorageId);
    }

    // Move to review phase
    setHasPrefilledData(true);
    setWizardPhase("review");

    toast.success("Flyer scanned successfully!", {
      description: "Review the extracted details below.",
    });
  };

  // Handler for review confirmation
  const handleReviewConfirm = (data: ExtractedEventData & { eventType: EventType }) => {
    // Update all fields with reviewed data
    setEventName(data.eventName);
    setDescription(data.description);
    setVenueName(data.venueName);
    if (data.address) setAddress(data.address);
    setCity(data.city);
    setState(data.state);
    if (data.zipCode) setZipCode(data.zipCode);
    setCategories(data.categories);
    setEventType(data.eventType);

    // Set dates
    if (data.eventDate && data.eventTime) {
      setStartDate(`${data.eventDate}T${data.eventTime}`);
    }
    if (data.eventEndDate && data.eventEndTime) {
      setEndDate(`${data.eventEndDate}T${data.eventEndTime}`);
    }

    if (data.imageStorageId) {
      setUploadedImageId(data.imageStorageId);
    }

    // Move to wizard phase with reduced steps
    setHasPrefilledData(true);
    setStepIndex(0);
    setWizardPhase("wizard");

    toast.success("Event details confirmed!", {
      description: `Continuing with ${data.eventType === "TICKETED_EVENT" ? "ticket setup" : data.eventType === "SEATED_EVENT" ? "seating setup" : "final details"}.`,
    });
  };

  // Handler for rescan (go back to upload)
  const handleRescan = () => {
    setWizardPhase("upload");
    setHasPrefilledData(false);
    // Clear the uploaded image to allow new upload
    setUploadedImageId(null);
    setFlyerPreviewUrl(null);
  };

  // Handler for skipping upload and going to manual entry
  const handleSkipUpload = () => {
    setWizardPhase("manual");
    setHasPrefilledData(false);
    setStepIndex(0);
  };

  // Handler for flyer OCR extraction in manual mode (from ScanFlyerButton)
  const handleManualFlyerDataExtracted = (data: {
    eventName: string;
    description: string;
    eventDate: string;
    eventEndDate?: string | null;
    eventTime: string;
    eventEndTime?: string | null;
    venueName: string;
    address?: string | null;
    city: string;
    state: string;
    zipCode?: string | null;
    categories: string[];
    eventType: "FREE_EVENT" | "TICKETED_EVENT" | "SAVE_THE_DATE";
    imageStorageId?: Id<"_storage">;
  }) => {
    // Auto-fill form fields from extracted data
    if (data.eventName) setEventName(data.eventName);
    if (data.description) setDescription(data.description);
    if (data.venueName) setVenueName(data.venueName);
    if (data.address) setAddress(data.address);
    if (data.city) setCity(data.city);
    if (data.state) setState(data.state);
    if (data.zipCode) setZipCode(data.zipCode);
    if (data.categories && data.categories.length > 0) {
      const validCategories = data.categories.filter((cat) =>
        EVENT_CATEGORIES.includes(cat as typeof EVENT_CATEGORIES[number])
      );
      if (validCategories.length > 0) {
        setCategories(validCategories);
      }
    }
    if (data.eventType) {
      const mappedType = data.eventType === "FREE_EVENT"
        ? "FREE_EVENT"
        : data.eventType === "SAVE_THE_DATE"
        ? "SAVE_THE_DATE"
        : "TICKETED_EVENT";
      setEventType(mappedType);
    }

    if (data.eventDate && data.eventTime) {
      const dateTime = `${data.eventDate}T${data.eventTime}`;
      setStartDate(dateTime);
    } else if (data.eventDate) {
      setStartDate(`${data.eventDate}T19:00`);
    }

    if (data.eventEndDate && data.eventEndTime) {
      const dateTime = `${data.eventEndDate}T${data.eventEndTime}`;
      setEndDate(dateTime);
    } else if (data.eventDate && data.eventEndTime) {
      setEndDate(`${data.eventDate}T${data.eventEndTime}`);
    }

    if (data.imageStorageId) {
      setUploadedImageId(data.imageStorageId);
    }

    toast.success("Flyer scanned successfully!", {
      description: "Event details have been auto-filled. Review and adjust as needed.",
    });
  };

  const handleFlyerScanError = (error: string) => {
    toast.error("Scan failed", {
      description: error,
    });
  };

  const handleSubmit = async () => {
    // Validation - Check each field individually for better error messages
    const missingFields: string[] = [];

    if (!eventName) missingFields.push("Event Name");
    if (!description) missingFields.push("Description");
    if (!startDate) missingFields.push("Start Date & Time");
    if (!city) missingFields.push("City");
    if (!state) missingFields.push("State");
    if (!uploadedImageId) missingFields.push("Event Image");

    // Validate capacity for ticketed events
    if (eventType === "TICKETED_EVENT" && (!capacity || parseInt(capacity) <= 0)) {
      toast.error("Please set an event capacity for ticketed events");
      return;
    }

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateObj = new Date(startDate);
      const endDateObj = endDate ? new Date(endDate) : startDateObj;

      const startDateUTC = startDateObj.getTime();
      const endDateUTC = endDateObj.getTime();

      const eventDateLiteral = formatDate(startDateObj, "MMMM d, yyyy");
      const eventTimeLiteral = formatDate(startDateObj, "h:mm a");

      const eventData = {
        name: eventName,
        eventType,
        description,
        categories,
        startDate: startDateUTC,
        endDate: endDateUTC,
        timezone,
        eventDateLiteral,
        eventTimeLiteral,
        eventTimezone: timezone,
        location: {
          venueName: venueName || undefined,
          address: address || undefined,
          city,
          state,
          zipCode: zipCode || undefined,
          country,
        },
        capacity: capacity ? parseInt(capacity) : undefined,
        doorPrice: doorPrice || undefined,
        imageUrl: undefined,
        images: uploadedImageId ? [uploadedImageId] : [],
        eventSubType: eventSubType as "weekender" | "set" | "ball" | "workshop" | "social" | undefined || undefined,
        dressCode: dressCode as "all_white" | "black_tie" | "stepping_attire" | "casual" | "theme" | undefined || undefined,
        dressCodeDetails: dressCode === "theme" ? dressCodeDetails : undefined,
        beginnerFriendly: beginnerFriendly || undefined,
        hasBeginnerLesson: beginnerFriendly && hasBeginnerLesson ? true : undefined,
        beginnerLessonTime: beginnerFriendly && hasBeginnerLesson ? beginnerLessonTime : undefined,
        hotelBlock: showHotelBlock && hotelName && hotelBookingUrl ? {
          hotelName,
          bookingUrl: hotelBookingUrl,
          groupCode: hotelGroupCode || undefined,
          rate: hotelRate || undefined,
          cutoffDate: hotelCutoffDate ? new Date(hotelCutoffDate).getTime() : undefined,
          notes: hotelNotes || undefined,
        } : undefined,
      };

      const eventId = await createEvent(eventData);

      if (!eventId) {
        throw new Error("No event ID returned from server");
      }

      router.push("/organizer/events");

      setTimeout(() => setIsSubmitting(false), 2000);
    } catch (error) {
      console.error("[CREATE EVENT] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create event");
      setIsSubmitting(false);
    }
  };

  // Helper functions for seating and tickets
  const addSeatingSection = () => {
    const newId = String(seatingSections.length + 1);
    setSeatingSections([
      ...seatingSections,
      { id: newId, name: `Section ${newId}`, tableShape: "ROUND", tableCount: 5, seatsPerTable: 8 }
    ]);
  };

  const removeSeatingSection = (id: string) => {
    if (seatingSections.length > 1) {
      setSeatingSections(seatingSections.filter(s => s.id !== id));
    }
  };

  const updateSeatingSection = (id: string, updates: Partial<SeatingSection>) => {
    setSeatingSections(seatingSections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addTicketTier = () => {
    const newId = String(ticketTiers.length + 1);
    setTicketTiers([
      ...ticketTiers,
      { id: newId, name: "", description: "", price: "", quantity: "", sellMode: "BOTH" }
    ]);
  };

  const removeTicketTier = (id: string) => {
    if (ticketTiers.length > 1) {
      setTicketTiers(ticketTiers.filter(t => t.id !== id));
    }
  };

  const updateTicketTier = (id: string, updates: Partial<TicketTierForm>) => {
    setTicketTiers(ticketTiers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Validation for review step
  const getValidationChecks = () => {
    const checks: { label: string; passed: boolean; required: boolean }[] = [];

    checks.push({ label: "Event name", passed: !!eventName, required: true });
    checks.push({ label: "Event date", passed: !!startDate, required: true });
    checks.push({ label: "City and state", passed: !!(city && state), required: true });

    if (eventType !== "SAVE_THE_DATE") {
      checks.push({ label: "Venue address", passed: !!(venueName || address), required: false });
    }

    if (eventType !== "SAVE_THE_DATE") {
      checks.push({ label: "Event image", passed: !!uploadedImageId, required: eventType !== "FREE_EVENT" });
    }

    if (eventType === "TICKETED_EVENT" || eventType === "SEATED_EVENT") {
      const hasValidTier = ticketTiers.some(t => t.name && t.price && parseFloat(t.price) > 0);
      checks.push({ label: "At least one ticket tier", passed: hasValidTier, required: true });
    }

    if (eventType === "SEATED_EVENT") {
      const hasSeating = skipSeatingSetup || seatingSections.some(s => s.tableCount > 0);
      checks.push({ label: "Seating layout configured", passed: hasSeating, required: true });

      if (!skipSeatingSetup) {
        const unlinkedSections = seatingSections.filter(
          s => !ticketTiers.some(t => t.linkedSectionId === s.id)
        );
        checks.push({
          label: "All sections linked to ticket tiers",
          passed: unlinkedSections.length === 0,
          required: false
        });
      }
    }

    return checks;
  };

  const canPublish = () => {
    const checks = getValidationChecks();
    return checks.filter(c => c.required).every(c => c.passed);
  };

  // Build the extracted data object for review phase
  const extractedDataForReview: ExtractedEventData = {
    eventName,
    description,
    eventDate: startDate ? startDate.split("T")[0] : "",
    eventEndDate: endDate ? endDate.split("T")[0] : null,
    eventTime: startDate ? startDate.split("T")[1] || "" : "",
    eventEndTime: endDate ? endDate.split("T")[1] || "" : null,
    venueName,
    address,
    city,
    state,
    zipCode,
    categories,
    eventType,
    imageStorageId: uploadedImageId || undefined,
  };

  // ===============================
  // RENDER: Upload Phase
  // ===============================
  if (wizardPhase === "upload") {
    return (
      <div className="min-h-screen bg-muted">
        {/* Minimal Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/organizer/events"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <FlyerUploadHero
            onDataExtracted={handleFlyerDataExtracted}
            onSkip={handleSkipUpload}
            onError={handleFlyerScanError}
          />
        </main>

        {/* Welcome Popup */}
        {creditBalance && (
          <WelcomePopup
            open={showWelcomePopup}
            onClose={handleWelcomePopupClose}
            creditsRemaining={1000}
          />
        )}
      </div>
    );
  }

  // ===============================
  // RENDER: Review Phase
  // ===============================
  if (wizardPhase === "review") {
    return (
      <div className="min-h-screen bg-muted">
        {/* Minimal Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/organizer/events"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <ExtractedDataReview
            extractedData={extractedDataForReview}
            flyerPreviewUrl={flyerPreviewUrl || undefined}
            onConfirm={handleReviewConfirm}
            onRescan={handleRescan}
          />
        </main>
      </div>
    );
  }

  // ===============================
  // RENDER: Wizard Phase (after review) or Manual Phase
  // ===============================
  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <h1 className="text-3xl font-bold text-foreground">
            {hasPrefilledData ? "Complete Your Event" : "Create New Event"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {stepIndex + 1} of {totalSteps}: {currentStep?.title}
          </p>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => idx < stepIndex && setStepIndex(idx)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  idx === stepIndex
                    ? "bg-primary text-white"
                    : idx < stepIndex
                    ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                disabled={idx > stepIndex}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow-md p-6 md:p-8">
          {/* Step: Basic Information (Manual mode only) */}
          {currentStep?.id === "basic" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Basic Information</h2>
                <p className="text-muted-foreground">Tell us about your event</p>
              </div>

              {/* AI Flyer Scanner */}
              <ScanFlyerButton
                onDataExtracted={handleManualFlyerDataExtracted}
                onError={handleFlyerScanError}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or fill in manually</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Name *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Chicago Summer Steppers Set 2025"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Event Type *</label>

                {!canCreateTicketedEvents && (
                  <div className="mb-4 bg-warning/10 border border-warning rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">Account Restriction</p>
                        <p className="text-muted-foreground mt-1">
                          Your account can only create <strong>Save The Date</strong> and{" "}
                          <strong>Free Events</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    canCreateTicketedEvents
                      ? { type: "TICKETED_EVENT" as EventType, label: "Ticketed Event", desc: "Sell tickets online", icon: "🎫" }
                      : null,
                    canCreateTicketedEvents
                      ? { type: "SEATED_EVENT" as EventType, label: "Seated Event", desc: "Table seating & tickets", icon: "🪑" }
                      : null,
                    { type: "FREE_EVENT" as EventType, label: "Pay at the Door", desc: "Pay at the door", icon: "🎉" },
                    { type: "SAVE_THE_DATE" as EventType, label: "Save the Date", desc: "Announcement only", icon: "📅" },
                  ]
                    .filter(Boolean)
                    .map((item) => {
                      if (!item) return null;
                      const { type, label, desc, icon } = item;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEventType(type)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            eventType === type
                              ? "border-primary bg-accent"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <p className="font-semibold text-foreground">
                            <span className="mr-2">{icon}</span>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows={6}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        categories.includes(category)
                          ? "bg-primary text-white"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Date & Time */}
          {currentStep?.id === "datetime" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Date & Time</h2>
                <p className="text-muted-foreground">When is your event happening?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>
              </div>

              {detectedTimezone && (
                <div className="bg-accent border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Timezone: {detectedTimezone}</p>
                      <p className="text-xs text-primary mt-1">Auto-detected from {city}, {state}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Location */}
          {currentStep?.id === "location" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Location</h2>
                <p className="text-muted-foreground">Where is your event taking place?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Venue Name</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., The Grand Ballroom"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chicago"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="IL"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="60601"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="USA"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step: Seating Layout (SEATED_EVENT only) */}
          {currentStep?.id === "seating" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Seating Layout</h2>
                <p className="text-muted-foreground">Design your table seating arrangement</p>
              </div>

              <div className="bg-accent border border-border rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipSeatingSetup}
                    onChange={(e) => setSkipSeatingSetup(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border"
                  />
                  <div>
                    <p className="font-medium text-foreground">I'll design the layout later</p>
                    <p className="text-sm text-muted-foreground">
                      Skip this step and use the full seating builder after event creation
                    </p>
                  </div>
                </label>
              </div>

              {!skipSeatingSetup && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Table Sections</h3>
                      <button
                        type="button"
                        onClick={addSeatingSection}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        <Plus className="w-4 h-4" /> Add Section
                      </button>
                    </div>

                    {seatingSections.map((section) => (
                      <div key={section.id} className="border border-border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateSeatingSection(section.id, { name: e.target.value })}
                            placeholder="Section Name"
                            className="text-lg font-medium bg-transparent border-none focus:outline-none text-foreground"
                          />
                          {seatingSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeatingSection(section.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Table Shape</label>
                            <select
                              value={section.tableShape}
                              onChange={(e) => updateSeatingSection(section.id, { tableShape: e.target.value as SeatingSection["tableShape"] })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            >
                              <option value="ROUND">Round</option>
                              <option value="RECTANGULAR">Rectangle</option>
                              <option value="SQUARE">Square</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Number of Tables</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={section.tableCount}
                              onChange={(e) => updateSeatingSection(section.id, { tableCount: parseInt(e.target.value) || 1 })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Seats per Table</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={section.seatsPerTable}
                              onChange={(e) => updateSeatingSection(section.id, { seatsPerTable: parseInt(e.target.value) || 1 })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Section Capacity</label>
                            <div className="px-3 py-2 bg-muted rounded-lg text-sm font-medium text-foreground">
                              {section.tableCount * section.seatsPerTable} seats
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Total Seating Capacity</span>
                      <span className="text-2xl font-bold text-primary">{totalSeatingCapacity} seats</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Tickets */}
          {currentStep?.id === "tickets" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ticket Tiers</h2>
                <p className="text-muted-foreground">Set up your ticket pricing and options</p>
              </div>

              <div className="space-y-4">
                {ticketTiers.map((tier, index) => (
                  <div key={tier.id} className="border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-foreground">Ticket Tier {index + 1}</h3>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketTier(tier.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Tier Name *</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updateTicketTier(tier.id, { name: e.target.value })}
                          placeholder="e.g., VIP Table, General Admission"
                          className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Price *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updateTicketTier(tier.id, { price: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                      <textarea
                        value={tier.description}
                        onChange={(e) => updateTicketTier(tier.id, { description: e.target.value })}
                        placeholder="What's included with this ticket?"
                        rows={2}
                        className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
                      />
                    </div>

                    {eventType === "SEATED_EVENT" && !skipSeatingSetup && seatingSections.length > 0 && (
                      <div className="bg-accent rounded-lg p-4 space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!tier.linkedSectionId}
                            onChange={(e) => updateTicketTier(tier.id, {
                              linkedSectionId: e.target.checked ? seatingSections[0].id : undefined
                            })}
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="text-sm font-medium text-foreground">Link to seating section</span>
                        </label>

                        {tier.linkedSectionId && (
                          <>
                            <select
                              value={tier.linkedSectionId}
                              onChange={(e) => updateTicketTier(tier.id, { linkedSectionId: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            >
                              {seatingSections.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.tableCount} tables, {s.tableCount * s.seatsPerTable} seats)
                                </option>
                              ))}
                            </select>

                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">Sell as</label>
                              <div className="flex gap-2">
                                {[
                                  { value: "INDIVIDUAL", label: "Individual seats" },
                                  { value: "TABLE", label: "Whole tables" },
                                  { value: "BOTH", label: "Both" },
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTicketTier(tier.id, { sellMode: option.value as TicketTierForm["sellMode"] })}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      tier.sellMode === option.value
                                        ? "bg-primary text-white"
                                        : "bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {(eventType === "TICKETED_EVENT" || !tier.linkedSectionId) && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Quantity Available {eventType === "TICKETED_EVENT" && "*"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={tier.quantity}
                          onChange={(e) => updateTicketTier(tier.id, { quantity: e.target.value })}
                          placeholder="e.g., 100"
                          className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
                        />
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!tier.earlyBirdPrice}
                          onChange={(e) => updateTicketTier(tier.id, {
                            earlyBirdPrice: e.target.checked ? tier.price : "",
                            earlyBirdUntil: e.target.checked ? "" : undefined
                          })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm font-medium text-foreground">Add early bird pricing</span>
                      </label>

                      {tier.earlyBirdPrice !== undefined && tier.earlyBirdPrice !== "" && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Early Bird Price</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tier.earlyBirdPrice}
                                onChange={(e) => updateTicketTier(tier.id, { earlyBirdPrice: e.target.value })}
                                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-foreground"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Until</label>
                            <input
                              type="date"
                              value={tier.earlyBirdUntil || ""}
                              onChange={(e) => updateTicketTier(tier.id, { earlyBirdUntil: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTicketTier}
                  className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Ticket Tier
                </button>
              </div>
            </div>
          )}

          {/* Step: Additional Details */}
          {currentStep?.id === "details" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Additional Details</h2>
                <p className="text-muted-foreground">Final touches for your event</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Capacity{" "}
                  {eventType === "TICKETED_EVENT" && <span className="text-destructive">*</span>}
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 500"
                  min="1"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>

              {eventType === "FREE_EVENT" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Door Price (Optional)</label>
                  <input
                    type="text"
                    value={doorPrice}
                    onChange={(e) => setDoorPrice(e.target.value)}
                    placeholder="e.g., $20 at the door, Free, Donation"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Image {!uploadedImageId && <span className="text-destructive">*</span>}
                  {uploadedImageId && <span className="text-green-600 text-xs ml-2">(From flyer scan)</span>}
                </label>
                <ImageUpload
                  onImageUploaded={(storageId) => setUploadedImageId(storageId)}
                  onImageRemoved={() => setUploadedImageId(null)}
                  required={true}
                  currentImageId={uploadedImageId ?? undefined}
                />
              </div>

              {/* Culture-Specific Fields */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Stepping Community Details</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Event Style (Optional)</label>
                  <select
                    value={eventSubType}
                    onChange={(e) => setEventSubType(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                  >
                    <option value="">Select event style...</option>
                    <option value="weekender">🎭 Weekender</option>
                    <option value="set">🌙 Set</option>
                    <option value="ball">🏆 Ball</option>
                    <option value="workshop">📚 Workshop</option>
                    <option value="social">🤝 Social</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Dress Code (Optional)</label>
                  <select
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
                  >
                    <option value="">No specific dress code</option>
                    <option value="all_white">👔 All White</option>
                    <option value="black_tie">🎩 Black Tie</option>
                    <option value="stepping_attire">✨ Stepping Attire</option>
                    <option value="casual">👟 Casual</option>
                    <option value="theme">🎭 Theme</option>
                  </select>
                </div>

                {dressCode === "theme" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Theme Details</label>
                    <input
                      type="text"
                      value={dressCodeDetails}
                      onChange={(e) => setDressCodeDetails(e.target.value)}
                      placeholder="e.g., 70s Disco, Red and Black"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beginnerFriendly}
                      onChange={(e) => setBeginnerFriendly(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-medium text-foreground">🌟 Beginner Friendly</span>
                      <p className="text-xs text-muted-foreground">Welcomes newcomers to stepping</p>
                    </div>
                  </label>
                </div>

                {beginnerFriendly && (
                  <div className="ml-8 space-y-4 border-l-2 border-primary/20 pl-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBeginnerLesson}
                        onChange={(e) => setHasBeginnerLesson(e.target.checked)}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-foreground">Free Beginner Lesson</span>
                    </label>

                    {hasBeginnerLesson && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Lesson Time</label>
                        <input
                          type="text"
                          value={beginnerLessonTime}
                          onChange={(e) => setBeginnerLessonTime(e.target.value)}
                          placeholder="e.g., 7:00 PM - 8:00 PM"
                          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hotel Block Section */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">🏨 Hotel Group Rate</h3>

                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHotelBlock}
                      onChange={(e) => setShowHotelBlock(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">Add Hotel Group Rate</span>
                  </label>
                </div>

                {showHotelBlock && (
                  <div className="ml-8 space-y-4 border-l-2 border-primary/20 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Hotel Name *</label>
                      <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g., Marriott Downtown"
                        className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Booking URL *</label>
                      <input
                        type="url"
                        value={hotelBookingUrl}
                        onChange={(e) => setHotelBookingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Group Rate</label>
                        <input
                          type="text"
                          value={hotelRate}
                          onChange={(e) => setHotelRate(e.target.value)}
                          placeholder="$119/night"
                          className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Group Code</label>
                        <input
                          type="text"
                          value={hotelGroupCode}
                          onChange={(e) => setHotelGroupCode(e.target.value)}
                          placeholder="STEPPIN2025"
                          className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Cutoff Date</label>
                      <input
                        type="date"
                        value={hotelCutoffDate}
                        onChange={(e) => setHotelCutoffDate(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                      <textarea
                        value={hotelNotes}
                        onChange={(e) => setHotelNotes(e.target.value)}
                        placeholder="Mention 'SteppersLife Event' for group rate"
                        rows={2}
                        className="w-full px-4 py-3 border border-border rounded-lg text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Review & Launch */}
          {currentStep?.id === "review" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Review & Launch</h2>
                <p className="text-muted-foreground">Review your event details before publishing</p>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Event Summary</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event Name</span>
                    <span className="font-medium text-foreground">{eventName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event Type</span>
                    <span className="font-medium text-foreground">
                      {eventType === "SAVE_THE_DATE" && "Save the Date"}
                      {eventType === "FREE_EVENT" && "Pay at the Door"}
                      {eventType === "TICKETED_EVENT" && "Ticketed Event"}
                      {eventType === "SEATED_EVENT" && "Seated Event"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">
                      {startDate ? formatDate(new Date(startDate), "MMMM d, yyyy 'at' h:mm a") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">
                      {city && state ? `${city}, ${state}` : "—"}
                    </span>
                  </div>
                  {(eventType === "TICKETED_EVENT" || eventType === "SEATED_EVENT") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ticket Tiers</span>
                      <span className="font-medium text-foreground">
                        {ticketTiers.filter(t => t.name && t.price).length} tier(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Pre-Launch Checklist</h3>
                </div>
                <div className="p-4 space-y-2">
                  {getValidationChecks().map((check, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {check.passed ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : check.required ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      )}
                      <span className={check.passed ? "text-foreground" : check.required ? "text-destructive" : "text-warning"}>
                        {check.label}
                        {!check.required && !check.passed && " (optional)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!canPublish() && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Cannot publish yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please complete all required items before publishing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {canPublish() && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Ready to launch!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your event is ready. Click "Create Event" to go live.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
            <button
              type="button"
              onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                stepIndex === 0 ? "text-muted-foreground cursor-not-allowed" : "text-foreground hover:bg-muted"
              }`}
            >
              Previous
            </button>

            {stepIndex < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex(stepIndex + 1)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canPublish()}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSubmitting || !canPublish()
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? "Creating Event..." : "Create Event"}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Welcome Popup */}
      {creditBalance && (
        <WelcomePopup
          open={showWelcomePopup}
          onClose={handleWelcomePopupClose}
          creditsRemaining={1000}
        />
      )}
    </div>
  );
}
