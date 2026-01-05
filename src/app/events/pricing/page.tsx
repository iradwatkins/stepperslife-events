import { redirect } from "next/navigation";

// Events pricing is handled at the main /pricing page
export default function EventsPricingPage() {
  redirect("/pricing");
}
