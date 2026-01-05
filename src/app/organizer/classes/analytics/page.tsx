import { redirect } from "next/navigation";

// Redirect old organizer/classes/analytics URLs to the new instructor routes
export default function OrganizerClassesAnalyticsRedirect() {
  redirect("/instructor/analytics");
}
