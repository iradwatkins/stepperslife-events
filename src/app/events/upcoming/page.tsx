import { redirect } from "next/navigation";

/**
 * /events/upcoming redirects to /events
 * The main events page already shows upcoming events by default
 * (filters by startTime >= now)
 */
export default function UpcomingEventsPage() {
  redirect("/events");
}
