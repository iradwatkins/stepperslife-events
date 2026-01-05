import { redirect } from "next/navigation";

// Redirect old organizer/classes URLs to the new instructor routes
export default function OrganizerClassesRedirect() {
  redirect("/instructor/classes");
}
