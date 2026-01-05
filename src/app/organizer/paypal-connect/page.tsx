"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PayPalAccountConnect } from "@/components/organizer/PayPalAccountConnect";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PayPalConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/organizer/events";
  const eventId = searchParams.get("eventId");

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const isLoading = currentUser === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground">Please log in to connect your PayPal account.</p>
          <Link href="/login" className="mt-4 inline-block text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleConnected = () => {
    if (eventId) {
      router.push(`/organizer/events/${eventId}/payment-setup`);
    } else {
      router.push(returnUrl);
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Link
          href={eventId ? `/organizer/events/${eventId}/payment-setup` : returnUrl}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Connect PayPal</h1>
          <p className="text-muted-foreground">
            Connect your PayPal account to receive payments from ticket sales
          </p>
        </div>

        <PayPalAccountConnect onConnected={handleConnected} />

        {currentUser.paypalMerchantId && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">PayPal Connected</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              You can now accept PayPal payments from customers.
            </p>
            {eventId && (
              <Link
                href={`/organizer/events/${eventId}/payment-setup`}
                className="mt-4 inline-block text-primary hover:underline"
              >
                Continue to Payment Setup →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayPalConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <PayPalConnectContent />
    </Suspense>
  );
}
