"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, AlertCircle } from "lucide-react";

export default function StripeConnectRefreshPage() {
  const router = useRouter();
  const convex = useConvex();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Preparing your Stripe onboarding...");

  useEffect(() => {
    async function refreshOnboarding() {
      try {
        // Get Stripe account info from Convex
        const stripeInfo = await convex.query(api.users.queries.getStripeConnectAccount);

        if (!stripeInfo?.stripeConnectedAccountId) {
          setStatus("error");
          setMessage("No Stripe account found. Redirecting to settings...");
          setTimeout(() => {
            router.push("/organizer/settings?stripe=error");
          }, 2000);
          return;
        }

        // Generate new account link
        const response = await fetch("/api/stripe/create-connect-account", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: stripeInfo.stripeConnectedAccountId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate onboarding link");
        }

        const data = await response.json();

        if (!data.accountLinkUrl) {
          throw new Error("No account link URL received");
        }

        // Redirect to Stripe for continued onboarding
        window.location.href = data.accountLinkUrl;
      } catch (error) {
        console.error("[Stripe Connect] Refresh error:", error);
        setStatus("error");
        setMessage("Failed to resume onboarding. Redirecting to settings...");
        setTimeout(() => {
          router.push("/organizer/settings?stripe=error");
        }, 2000);
      }
    }

    refreshOnboarding();
  }, [convex, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-card p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Resuming Setup</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              You will be redirected to Stripe to continue your account setup...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Setup Error</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">
              If you continue to see this error, please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
