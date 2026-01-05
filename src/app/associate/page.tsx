import { redirect } from "next/navigation";

/**
 * Associate root page - redirects to associate dashboard
 */
export default function AssociateRootPage() {
  redirect("/associate/dashboard");
}
