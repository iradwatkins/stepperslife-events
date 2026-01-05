"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Check, Info, CreditCard, Zap, ArrowLeft, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { OrganizerPrepayment } from "@/components/organizer/OrganizerPrepayment";

type PaymentModel = "PREPAY" | "CREDIT_CARD";

export default function PaymentSetupPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const [selectedModel, setSelectedModel] = useState<PaymentModel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrepayment, setShowPrepayment] = useState(false);

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const event = useQuery(api.events.queries.getEventById, { eventId });
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });
  const creditBalance = useQuery(api.payments.queries.getCreditBalance);

  const configurePayment = useMutation(api.events.mutations.configurePayment);
  const createStripeConnectAccount = useMutation(api.payments.mutations.createStripeConnectAccount);

  const isLoading = event === undefined || currentUser === undefined;

  // Check if user has payment accounts connected
  const hasStripeConnected = currentUser?.stripeAccountSetupComplete === true;
  const hasPayPalConnected = !!currentUser?.paypalMerchantId;
  const hasAnyPaymentMethod = hasStripeConnected || hasPayPalConnected;

  // Check if user is the organizer
  if (!isLoading && event && event.organizerId !== currentUser?._id) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleModelSelection = async (model: PaymentModel) => {
    setSelectedModel(model);
  };

  const handleUseCredits = async () => {
    setIsProcessing(true);
    try {
      // Configure PREPAY model using free credits (no payment required)
      await configurePayment({
        eventId,
        model: "PREPAY",
        ticketPrice: 0.3,
      });

      toast.success("Payment configured successfully using your free credits!");
      router.push(`/organizer/events/${eventId}`);
    } catch (error) {
      console.error("Payment configuration error:", error);
      toast.error("Failed to configure payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedModel) return;

    setIsProcessing(true);
    try {
      if (selectedModel === "PREPAY") {
        // Check if user has enough free credits
        if (creditBalance && creditBalance.creditsRemaining >= 100) {
          // Use free credits automatically
          await handleUseCredits();
        } else {
          // Show prepayment flow if no credits
          setShowPrepayment(true);
          setIsProcessing(false);
        }
      } else {
        // Configure credit card model (CREDIT_CARD)
        // Requires at least one payment method connected
        if (!hasAnyPaymentMethod) {
          toast.error("Please connect at least one payment method (Stripe or PayPal) to continue.");
          setIsProcessing(false);
          return;
        }

        await configurePayment({
          eventId,
          model: "CREDIT_CARD",
          platformFeePercent: 3.7,
          platformFeeFixed: 1.79,
          stripeFeePercent: 2.9,
          stripeFeeFixed: 0.3,
        });

        toast.success("Payment configured successfully!");
        router.push(`/organizer/events/${eventId}`);
      }
    } catch (error) {
      console.error("Payment setup error:", error);
      toast.error("Failed to configure payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePrepaymentSuccess = async () => {
    try {
      // Configure pre-purchase model after payment
      await configurePayment({
        eventId,
        model: "PREPAY",
        ticketPrice: 0.3,
      });

      toast.success("Payment configured successfully! Redirecting to dashboard...");
      router.push("/organizer/events");
    } catch (error) {
      console.error("Payment configuration error:", error);
      toast.error("Failed to configure payment. Please contact support.");
    }
  };

  const handlePrepaymentCancel = () => {
    setShowPrepayment(false);
    setSelectedModel(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If already configured, show current setup
  if (paymentConfig) {
    return (
      <div className="min-h-screen bg-card">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link
            href={`/organizer/events/${eventId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-6 h-6 text-success" />
              <h1 className="text-2xl font-bold text-foreground">Payment Configured</h1>
            </div>

            <p className="text-muted-foreground mb-6">
              Your payment model is already set up for this event.
            </p>

            <div className="bg-accent border border-border rounded-lg p-4">
              <p className="font-semibold text-foreground">Current Model:</p>
              <p className="text-lg text-primary font-bold mt-1">
                {paymentConfig.paymentModel === "PREPAY"
                  ? "Pre-Purchase Credits"
                  : paymentConfig.paymentModel === "CREDIT_CARD"
                    ? "Credit Card (Pay-As-You-Sell)"
                    : "Consignment"}
              </p>

              {paymentConfig.paymentModel === "PREPAY" && (
                <p className="text-sm text-muted-foreground mt-2">Cost: $0.30 per ticket</p>
              )}

              {paymentConfig.paymentModel === "CREDIT_CARD" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Platform Fee: 3.7% + $1.79 + Stripe processing (2.9% + $0.30)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate example costs for a $50 ticket
  const exampleTicketPrice = 50;
  const prePurchaseCost = 0.3;
  const payAsSellPlatformFee = exampleTicketPrice * 0.037 + 1.79;
  const payAsSellStripeFee = exampleTicketPrice * 0.029 + 0.3;
  const payAsSellTotalFee = payAsSellPlatformFee + payAsSellStripeFee;
  const payAsSellNetAmount = exampleTicketPrice - payAsSellTotalFee;

  // Show prepayment flow if selected
  if (showPrepayment) {
    return (
      <div className="min-h-screen bg-card">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/organizer/events/${eventId}/payment-setup`}
            onClick={(e) => {
              e.preventDefault();
              handlePrepaymentCancel();
            }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Selection
          </Link>

          <OrganizerPrepayment
            eventId={eventId}
            eventName={event?.name || "Event"}
            estimatedTickets={100} // Default estimate, could be made configurable
            pricePerTicket={0.3}
            onPaymentSuccess={handlePrepaymentSuccess}
            onCancel={handlePrepaymentCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href={`/organizer/events/${eventId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Payment Model</h1>
          <p className="text-muted-foreground">
            Select how you want to handle ticket sales for "{event?.name || "your event"}"
          </p>

          {creditBalance && creditBalance.creditsRemaining > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-lg">
              <Check className="w-5 h-5 text-success" />
              <span className="text-sm font-semibold text-success">
                You have {creditBalance.creditsRemaining.toLocaleString()} free tickets available!
              </span>
            </div>
          )}
        </div>

        {/* Payment Model Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pre-Purchase Model */}
          <button
            onClick={() => handleModelSelection("PREPAY")}
            className={`relative bg-white rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg ${
              selectedModel === "PREPAY" ? "border-primary shadow-lg" : "border"
            }`}
          >
            {selectedModel === "PREPAY" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Pre-Purchase</h3>
                <p className="text-sm text-primary font-semibold">Lowest Cost</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-foreground">$0.30</p>
              <p className="text-sm text-muted-foreground">per ticket sold</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">1000 free tickets</span> for new organizers
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Pay upfront with <span className="font-semibold">Card</span>,{" "}
                  <span className="font-semibold">Cash App Pay</span>, or{" "}
                  <span className="font-semibold">PayPal</span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">No percentage-based fees</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">Best for high-volume events</p>
              </div>
            </div>

            <div className="bg-accent border border-border rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-accent-foreground">
                  <span className="font-semibold">How it works:</span> Pay platform fee upfront,
                  then collect 100% of ticket sales
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Example: ${exampleTicketPrice} ticket</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You receive:</span>
                <span className="text-lg font-bold text-foreground">
                  ${(exampleTicketPrice - prePurchaseCost).toFixed(2)}
                </span>
              </div>
            </div>
          </button>

          {/* Pay-As-Sell Model */}
          <button
            onClick={() => handleModelSelection("CREDIT_CARD")}
            className={`relative bg-white rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg ${
              selectedModel === "CREDIT_CARD"
                ? "border-primary shadow-lg"
                : "border"
            }`}
          >
            {selectedModel === "CREDIT_CARD" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Pay-As-You-Sell</h3>
                <p className="text-sm text-primary font-semibold">No Upfront Cost</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-foreground">3.7% + $1.79</p>
              <p className="text-sm text-muted-foreground">+ processing fees (2.9% + $0.30)</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">No upfront payment</span> required
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">Fees auto-deducted from each sale</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Accept <span className="font-semibold">Stripe</span> and/or <span className="font-semibold">PayPal</span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">Best for trying out the platform</p>
              </div>
            </div>

            {/* Payment Method Connection Status */}
            <div className="space-y-2 mb-4">
              {/* Stripe Status */}
              <div className={`flex items-center justify-between p-2 rounded-lg ${
                hasStripeConnected ? "bg-success/10 border border-success/20" : "bg-muted border border-border"
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${hasStripeConnected ? "text-success" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">Stripe</span>
                </div>
                {hasStripeConnected ? (
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <Link
                    href={`/organizer/stripe-connect?action=create&email=${currentUser?.email || ""}&eventId=${eventId}`}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Connect →
                  </Link>
                )}
              </div>

              {/* PayPal Status */}
              <div className={`flex items-center justify-between p-2 rounded-lg ${
                hasPayPalConnected ? "bg-success/10 border border-success/20" : "bg-muted border border-border"
              }`}>
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 ${hasPayPalConnected ? "text-success" : "text-muted-foreground"}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .76-.654h6.536c2.96 0 4.95 1.585 4.95 4.202 0 3.538-3.196 5.707-6.545 5.707H8.188a.641.641 0 0 0-.633.543l-.479 3.59-.436 2.974a.39.39 0 0 1-.385.329h-.68a.39.39 0 0 1-.385-.329l-.114-.745zm6.17-14.404c0 1.614-1.312 2.925-2.93 2.925H7.972l.706-5.274h2.344c1.214 0 2.224.99 2.224 2.349z"/>
                  </svg>
                  <span className="text-sm font-medium">PayPal</span>
                </div>
                {hasPayPalConnected ? (
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <Link
                    href={`/organizer/paypal-connect?eventId=${eventId}`}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Connect →
                  </Link>
                )}
              </div>
            </div>

            {!hasAnyPaymentMethod && (
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">Connect at least one:</span> Connect Stripe and/or PayPal to receive payments from customers
                  </p>
                </div>
              </div>
            )}

            {hasAnyPaymentMethod && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">Ready to accept payments!</span>{" "}
                    {hasStripeConnected && hasPayPalConnected
                      ? "Customers can pay with card or PayPal"
                      : hasStripeConnected
                        ? "Customers can pay with card via Stripe"
                        : "Customers can pay with PayPal"}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Example: ${exampleTicketPrice} ticket</p>
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Platform fee:</span>
                  <span className="text-foreground">-${payAsSellPlatformFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Processing fee:</span>
                  <span className="text-foreground">-${payAsSellStripeFee.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">You receive:</span>
                <span className="text-lg font-bold text-foreground">
                  ${payAsSellNetAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-accent border border-border rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground">
                <span className="font-semibold">Need help deciding?</span> Pre-Purchase is best for
                established events expecting high sales. Pay-As-You-Sell is perfect for new events
                or when you want to test the platform with no upfront cost.
              </p>
            </div>
          </div>
        </div>

        {/* Current Credit Balance (if Pre-Purchase selected) */}
        {selectedModel === "PREPAY" && creditBalance !== undefined && creditBalance !== null && (
          <div className="bg-white rounded-lg border border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Credit Balance</p>
                <p className="text-2xl font-bold text-foreground">{creditBalance.creditsRemaining} credits</p>
              </div>
              {creditBalance.creditsRemaining < 100 && (
                <div className="text-right">
                  <p className="text-sm text-primary font-medium">Low balance</p>
                  <p className="text-xs text-muted-foreground">You'll be prompted to purchase more</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link
            href={`/organizer/events/${eventId}`}
            className="px-6 py-3 text-foreground hover:text-foreground font-medium"
          >
            Cancel
          </Link>

          <button
            onClick={handleConfirm}
            disabled={!selectedModel || isProcessing}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedModel && !isProcessing
                ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
