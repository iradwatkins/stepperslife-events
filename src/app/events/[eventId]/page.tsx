import { Metadata } from "next";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import EventDetailClient from "./EventDetailClient";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// Fetch event data directly from Convex HTTP API for metadata
async function getEventData(eventId: string) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }

    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "public/queries:getPublicEventDetails",
        args: { eventId },
        format: "json",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching event data:", error);
    return null;
  }
}

function formatEventDate(timestamp: number, timezone?: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone || "America/New_York",
  });
}

// Generate BreadcrumbList JSON-LD for navigation structure
function generateBreadcrumbJsonLd(eventDetails: { _id: string; name: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://stepperslife.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: "https://stepperslife.com/events",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: eventDetails.name,
        item: `https://stepperslife.com/events/${eventDetails._id}`,
      },
    ],
  };
}

// Generate JSON-LD structured data for SEO rich snippets
function generateEventJsonLd(eventDetails: {
  _id: string;
  name: string;
  description?: string;
  startDate?: number;
  endDate?: number;
  location?: {
    venueName?: string;
    city?: string;
    state?: string;
    address?: string;
  };
  organizer?: {
    name?: string;
    _id?: string;
  };
  organizerName?: string;
  organizerId?: string;
  ticketTiers?: Array<{
    name: string;
    price: number;
    soldOut?: boolean;
    saleStartDate?: number;
  }>;
  eventType?: string;
  ticketsVisible?: boolean;
  paymentConfigured?: boolean;
  imageUrl?: string;
  _creationTime?: number;
}) {
  const baseUrl = "https://stepperslife.com";
  const eventUrl = `${baseUrl}/events/${eventDetails._id}`;
  const imageUrl = eventDetails.imageUrl
    ? `${baseUrl}/api/og-image/${eventDetails._id}`
    : `${baseUrl}/og-default.png`;

  // Build offers array from ticket tiers
  const offers = eventDetails.ticketTiers?.map((tier) => ({
    "@type": "Offer",
    name: tier.name,
    price: tier.price,
    priceCurrency: "USD",
    availability: tier.soldOut
      ? "https://schema.org/SoldOut"
      : "https://schema.org/InStock",
    url: eventUrl,
    validFrom: tier.saleStartDate
      ? new Date(tier.saleStartDate).toISOString()
      : eventDetails._creationTime
        ? new Date(eventDetails._creationTime).toISOString()
        : undefined,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventDetails.name,
    description: eventDetails.description?.substring(0, 500),
    startDate: eventDetails.startDate
      ? new Date(eventDetails.startDate).toISOString()
      : undefined,
    endDate: eventDetails.endDate
      ? new Date(eventDetails.endDate).toISOString()
      : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: eventDetails.location
      ? {
          "@type": "Place",
          name: eventDetails.location.venueName || eventDetails.location.city,
          address: {
            "@type": "PostalAddress",
            streetAddress: eventDetails.location.address,
            addressLocality: eventDetails.location.city,
            addressRegion: eventDetails.location.state,
            addressCountry: "US",
          },
        }
      : undefined,
    image: imageUrl,
    url: eventUrl,
    organizer: {
      "@type": "Organization",
      name:
        eventDetails.organizer?.name ||
        eventDetails.organizerName ||
        "Event Organizer",
      url: eventDetails.organizer?._id || eventDetails.organizerId
        ? `${baseUrl}/organizer/${eventDetails.organizer?._id || eventDetails.organizerId}`
        : undefined,
    },
    offers: offers && offers.length > 0 ? offers : undefined,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;

  if (!eventId) {
    return {
      title: "Event | SteppersLife Events",
      description: "Discover amazing stepping events at SteppersLife.com",
    };
  }

  const eventDetails = await getEventData(eventId);

  if (!eventDetails) {
    return {
      title: "Event Not Found | SteppersLife Events",
      description: "This event doesn't exist or is no longer available.",
    };
  }

  // Format event date for description
  const eventDateStr = eventDetails.startDate
    ? formatEventDate(eventDetails.startDate, eventDetails.timezone)
    : "";

  // Check if tickets are available
  const hasTickets =
    eventDetails.eventType === "TICKETED_EVENT" &&
    eventDetails.ticketsVisible &&
    eventDetails.paymentConfigured &&
    eventDetails.ticketTiers &&
    eventDetails.ticketTiers.length > 0;

  // Create description with event title and call to action
  const callToAction = hasTickets
    ? "Buy Tickets on SteppersLife.com"
    : "Find more events on SteppersLife.com";

  const description = `${eventDetails.name}${eventDateStr ? " - " + eventDateStr : ""}. ${callToAction}`;

  // Use OG image API route for properly sized images
  const imageUrl = eventDetails.imageUrl
    ? `https://events.stepperslife.com/api/og-image/${eventId}`
    : "https://events.stepperslife.com/og-default.png";

  // Get the event URL
  const eventUrl = `https://events.stepperslife.com/events/${eventId}`;

  return {
    title: `${eventDetails.name} | SteppersLife Events`,
    description: description,

    // Open Graph metadata for Facebook, LinkedIn, etc.
    openGraph: {
      type: "website",
      url: eventUrl,
      title: "Discover Amazing Steppin Events Nationwide",
      description: description,
      siteName: "SteppersLife Events",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: eventDetails.name,
          type: "image/jpeg",
        },
      ],
      locale: "en_US",
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      title: eventDetails.name,
      description: description,
      images: [imageUrl],
      creator: "@SteppersLife",
      site: "@SteppersLife",
    },

    // Additional metadata
    keywords: [
      "steppin events",
      "steppers",
      "dance events",
      eventDetails.name,
      ...(eventDetails.categories || []),
      ...(eventDetails.location ? [eventDetails.location.city, eventDetails.location.state] : []),
    ],

    authors: [
      {
        name: eventDetails.organizer?.name || eventDetails.organizerName || "Event Organizer",
      },
    ],

    // Canonical URL
    alternates: {
      canonical: eventUrl,
    },

    // Other metadata
    other: {
      "event:start_time": eventDetails.startDate
        ? new Date(eventDetails.startDate).toISOString()
        : "",
      "event:end_time": eventDetails.endDate ? new Date(eventDetails.endDate).toISOString() : "",
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  // Check if event exists - if not, return 404
  const eventDetails = await getEventData(eventId);
  if (!eventDetails) {
    notFound();
  }

  const typedEventId = eventId as Id<"events">;

  // Generate JSON-LD structured data for SEO
  const eventJsonLd = generateEventJsonLd(eventDetails);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(eventDetails);

  return (
    <>
      {/* JSON-LD structured data for search engine rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      {/* Breadcrumb JSON-LD for navigation structure */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <EventDetailClient eventId={typedEventId} />
    </>
  );
}
