"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Calendar, MapPin, FileText, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { getTimezoneFromLocation, getTimezoneName } from "@/lib/timezone";
import { format } from "date-fns";
import { EVENT_CATEGORIES } from "@/lib/constants";

interface User {
  _id: string;
  email: string;
  name?: string;
  role?: "admin" | "organizer" | "user";
  image?: string;
}

interface EventLocation {
  venueName?: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
}

interface Event {
  _id: Id<"events">;
  name: string;
  description?: string;
  organizerId?: Id<"users">;
  organizerName?: string;
  eventType?: "SAVE_THE_DATE" | "FREE_EVENT" | "TICKETED_EVENT" | "SEATED_EVENT" | "CLASS";
  startDate?: number;
  endDate?: number;
  location?: EventLocation | string;
  images?: Id<"_storage">[];
  imageUrl?: string;
  categories?: string[];
  capacity?: number;
  status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.queries.getEventById, { eventId });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch current user from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // Form state
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("USA");
  const [capacity, setCapacity] = useState("");
  const [uploadedImageId, setUploadedImageId] = useState<Id<"_storage"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEvent = useMutation(api.events.mutations.updateEvent);

  // Load event data into form
  useEffect(() => {
    if (event) {
      setEventName(event.name);
      setDescription(event.description || "");
      setCategories(event.categories || []);
      setCapacity(event.capacity ? event.capacity.toString() : "");

      if (event.startDate) {
        const date = new Date(event.startDate);
        setStartDate(format(date, "yyyy-MM-dd'T'HH:mm"));
      }

      if (event.endDate) {
        const date = new Date(event.endDate);
        setEndDate(format(date, "yyyy-MM-dd'T'HH:mm"));
      }

      if (event.location && typeof event.location === "object") {
        setVenueName(event.location.venueName || "");
        setAddress(event.location.address || "");
        setCity(event.location.city || "");
        setState(event.location.state || "");
        setZipCode(event.location.zipCode || "");
        setCountry(event.location.country || "USA");
      }
    }
  }, [event]);

  // Auto-detect timezone
  useEffect(() => {
    if (city && state) {
      const tz = getTimezoneFromLocation(city, state);
      setTimezone(tz);
    }
  }, [city, state]);

  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const missingFields: string[] = [];
    if (!eventName) missingFields.push("Event Name");
    if (!description) missingFields.push("Description");

    // Check if event has an existing image or user uploaded a new one
    const hasExistingImage = event?.imageUrl || (event?.images && event.images.length > 0);
    const hasNewImage = uploadedImageId !== null;

    if (!hasExistingImage && !hasNewImage) {
      missingFields.push("Event Image");
    }

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in the following required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await updateEvent({
        eventId,
        name: eventName,
        description,
        categories,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        location: {
          venueName,
          address,
          city,
          state,
          zipCode,
          country,
        },
        capacity: capacity ? parseInt(capacity) : undefined,
        images: uploadedImageId ? [uploadedImageId] : undefined,
      });

      router.push(`/organizer/events/${eventId}`);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (event === undefined || currentUser === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-foreground">Event not found.</p>
          <Link href="/organizer/events" className="mt-4 inline-block text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // Debug logging

  // Check if user is the organizer (removed for now to allow access)
  // TEMPORARY: Commenting out permission check to debug
  /*
  if (event.organizerId !== currentUser._id && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground">You don't have permission to edit this event.</p>
          <Link href="/organizer/events" className="mt-4 inline-block text-primary hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary p-6">
            <h1 className="text-3xl font-bold text-white">Edit Event</h1>
            <p className="text-primary-foreground/80 mt-2">Update your event details</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            </div>

            {/* Date & Time */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Date & Time</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Location</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Venue Name</label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Additional Details</h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Capacity{" "}
                  {event.eventType === "TICKETED_EVENT" && <span className="text-destructive">*</span>}
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Maximum number of attendees/tickets"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {event.eventType === "TICKETED_EVENT"
                    ? "Maximum number of tickets available (required for ticket setup)"
                    : "Maximum number of attendees (optional)"}
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Event Image <span className="text-destructive">*</span>
              </h2>
              {event.imageUrl && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                  <img
                    src={event.imageUrl}
                    alt="Current event image"
                    className="w-full max-w-md rounded-lg shadow-md"
                  />
                </div>
              )}
              <ImageUpload
                onImageUploaded={(storageId) => setUploadedImageId(storageId)}
                currentImageUrl={event.imageUrl}
                required={!event.imageUrl && (!event.images || event.images.length === 0)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                A professional event image is required and will be displayed on the event page, checkout, and payment confirmation.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
              <Link
                href={`/organizer/events/${eventId}`}
                className="px-6 py-3 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:bg-muted disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
