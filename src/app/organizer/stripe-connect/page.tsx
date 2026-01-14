"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Stripe Connect Onboarding Flow
 * Handles creating Stripe Connect accounts and processing onboarding redirects
 */
function StripeConnectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "creating" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveStripeAccount = useMutation(api.payments.mutations.saveStripeConnectAccount);

  useEffect(() => {
    const action = searchParams.get("action");
    const accountId = searchParams.get("accountId");
    const email = searchParams.get("email");

    // Handle successful return from Stripe onboarding
    if (action === "success" && accountId) {
      handleStripeSuccess(accountId);
      return;
    }

    // Handle creating new Stripe Connect account
    if (action === "create" && email) {
      handleCreateAccount(email);
      return;
    }

    // Handle refreshing account link
    if (action === "refresh" && accountId) {
      handleRefreshAccountLink(accountId);
      return;
    }

    // No action specified
    setStatus("error");
    setErrorMessage("Invalid request. Please try again from the payment setup page.");
  }, [searchParams]);

  const handleStripeSuccess = async (accountId: string) => {
    try {
      setStatus("loading");

      // Save account ID to user record
      await saveStripeAccount({ accountId });

      setStatus("success");

      // Redirect to settings after 2 seconds
      setTimeout(() => {
        router.push("/organizer/settings?stripe=connected");
      }, 2000);
    } catch (error) {
      console.error("[Stripe Connect] Failed to save account:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save Stripe account. Please contact support.");
    }
  };

  const handleCreateAccount = async (email: string) => {
    try {
      setStatus("creating");

      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          refreshUrl: `${window.location.origin}/organizer/stripe-connect?action=refresh`,
          returnUrl: `${window.location.origin}/organizer/stripe-connect?action=success`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Stripe account");
      }


      // Redirect to Stripe onboarding
      window.location.href = data.accountLinkUrl;
    } catch (error) {
      console.error("[Stripe Connect] Failed to create account:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to create Stripe Connect account.");
    }
  };

  const handleRefreshAccountLink = async (accountId: string) => {
    try {
      setStatus("creating");

      const response = await fetch("/api/stripe/create-connect-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          refreshUrl: `${window.location.origin}/organizer/stripe-connect?action=refresh&accountId=${accountId}`,
          returnUrl: `${window.location.origin}/organizer/stripe-connect?action=success&accountId=${accountId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh account link");
      }


      // Redirect to Stripe onboarding
      window.location.href = data.accountLinkUrl;
    } catch (error) {
      console.error("[Stripe Connect] Failed to refresh account link:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh Stripe onboarding link.");
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Processing...</h1>
            <p className="text-muted-foreground">Please wait while we process your request.</p>
          </>
        )}

        {status === "creating" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Creating Your Account</h1>
            <p className="text-muted-foreground">
              Setting up your Stripe Connect account...
              <br />
              You'll be redirected to Stripe to complete setup.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Account Connected!</h1>
            <p className="text-muted-foreground mb-6">
              Your Stripe account has been successfully connected.
              <br />
              Redirecting to settings...
            </p>
            <div className="animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something Went Wrong</h1>
            <p className="text-destructive mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/organizer/settings">Go to Settings</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/organizer/events">Back to Events</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StripeConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Loading...</h1>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      }
    >
      <StripeConnectContent />
    </Suspense>
  );
}
