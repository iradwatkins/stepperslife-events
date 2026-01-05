"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BusinessSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main settings page (which has business tab)
    router.replace("/organizer/settings");
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
