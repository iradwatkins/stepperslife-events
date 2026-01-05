"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TicketDistributionPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main team page (ticket distribution feature coming soon)
    router.replace("/organizer/team");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
