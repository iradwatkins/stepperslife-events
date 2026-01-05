"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Instructor Catch-All Page
 *
 * This page catches unknown /instructor/* routes and redirects to the instructor dashboard.
 * This prevents 404 errors for mistyped URLs and provides a better user experience.
 */
export default function InstructorCatchAllPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Always redirect to instructor dashboard for unknown paths
    const timer = setTimeout(() => {
      router.replace("/instructor/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-amber-100 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The instructor page you&apos;re looking for doesn&apos;t exist.
          You&apos;ll be redirected to your dashboard.
        </p>

        <div className="flex items-center justify-center gap-2 text-primary mb-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Redirecting to dashboard...</span>
        </div>

        <div className="bg-card border rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Requested: <code className="bg-muted px-1 rounded">{pathname}</code>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/instructor/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>
          <Link
            href="/instructor/classes"
            className="inline-flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-muted"
          >
            View Classes
          </Link>
        </div>
      </div>
    </div>
  );
}
