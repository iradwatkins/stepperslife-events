import { redirect } from "next/navigation";

// Redirect old organizer/classes/create URLs to the new instructor routes
export default function OrganizerClassesCreateRedirect() {
  redirect("/instructor/classes/create");
}
