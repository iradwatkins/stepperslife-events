import { redirect } from "next/navigation";

/**
 * Staff root page - redirects to staff dashboard
 */
export default function StaffRootPage() {
  redirect("/staff/dashboard");
}
