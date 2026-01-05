import { redirect } from "next/navigation";
import { Metadata } from "next";

interface TicketsPageProps {
  params: Promise<{ eventId: string }>;
}

/**
 * Story 3.4: Fix 404 Routes
 *
 * This page redirects /events/[eventId]/tickets to /events/[eventId]#tickets
 * The event detail page handles ticket selection inline.
 */
export async function generateMetadata({ params }: TicketsPageProps): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: "Get Tickets | SteppersLife Events",
    description: "Purchase tickets for this event",
    robots: {
      index: false, // Don't index redirect pages
      follow: true,
    },
  };
}

export default async function TicketsRedirectPage({ params }: TicketsPageProps) {
  const { eventId } = await params;

  // Redirect to event detail page with #tickets hash to scroll to ticket section
  redirect(`/events/${eventId}#tickets`);
}
