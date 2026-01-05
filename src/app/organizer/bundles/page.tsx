"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BundlesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/organizer/events");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-6">
            <Package className="w-10 h-10 text-primary" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ticket Bundles Moved
          </h1>

          {/* Description */}
          <div className="text-lg text-muted-foreground mb-8 space-y-4">
            <p>Ticket bundles are now managed within each event's settings.</p>
            <p className="text-base">To create or manage ticket bundles:</p>
          </div>

          {/* Steps */}
          <div className="bg-accent rounded-lg p-6 mb-8 text-left">
            <ol className="space-y-3 text-foreground">
              <li className="flex items-start">
                <span className="font-semibold text-primary mr-2">1.</span>
                <span>Go to your event</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-primary mr-2">2.</span>
                <span>Navigate to the Tickets section</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-primary mr-2">3.</span>
                <span>Create your ticket types (e.g., Friday, Saturday, Sunday, VIP)</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-primary mr-2">4.</span>
                <span>
                  Bundle multiple tickets together (e.g., "Weekend Pass" = Friday + Saturday +
                  Sunday)
                </span>
              </li>
            </ol>
          </div>

          {/* Redirect Message */}
          <p className="text-sm text-muted-foreground mb-6">
            You'll be redirected to your events in a few seconds...
          </p>

          {/* Action Button */}
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Go to My Events
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
