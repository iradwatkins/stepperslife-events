"use client";

/**
 * Simplified Single-Page Checkout
 *
 * All steps visible at once:
 * - Left: Ticket selection + Buyer info
 * - Right: Order summary + Payment
 */

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StripeCheckout } from "@/components/checkout/StripeCheckout";
import { PayPalPayment } from "@/components/checkout/PayPalPayment";
import { TicketSelector } from "@/components/checkout/TicketSelector";
import type { SelectedSeat } from "@/components/checkout/SeatSelection";
import type { SelectedSeat as BallroomSeat } from "@/components/seating/InteractiveSeatingChart";
import dynamic from "next/dynamic";

// Dynamic imports for heavy seating components
const SeatSelection = dynamic(() => import("@/components/checkout/SeatSelection"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
  ssr: false,
});

const InteractiveSeatingChart = dynamic(
  () => import("@/components/seating/InteractiveSeatingChart"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    ),
    ssr: false,
  }
);

import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  UserCheck,
  Tag,
  X,
  LogIn,
  CreditCard,
  Banknote,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { toast } from "sonner";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as Id<"events">;
  const ENABLE_SEATING = process.env.NEXT_PUBLIC_ENABLE_SEATING_CHARTS === "true";

  // Selection state
  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<Id<"ticketBundles"> | null>(null);
  const [purchaseType, setPurchaseType] = useState<"tier" | "bundle">("tier");
  const [quantity, setQuantity] = useState(1);

  // Buyer info
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "cash">("cash");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extras
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    _id: Id<"discountCodes">;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    discountAmountCents: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

  // Queries
  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const seatingChart = useQuery(
    api.seating.queries.getPublicSeatingChart,
    ENABLE_SEATING ? { eventId } : "skip"
  );
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });
  const staffMemberInfo = useQuery(
    api.staff.queries.getStaffByReferralCode,
    referralCode ? { referralCode } : "skip"
  );

  // Mutations
  const createOrder = useMutation(api.tickets.mutations.createOrder);
  const createBundleOrder = useMutation(api.tickets.mutations.createBundleOrder);
  const completeOrder = useMutation(api.tickets.mutations.completeOrder);
  const completeBundleOrder = useMutation(api.tickets.mutations.completeBundleOrder);
  const getOrderDetails = useQuery(
    api.tickets.queries.getOrderDetails,
    orderId ? { orderId: orderId as Id<"orders"> } : "skip"
  );

  // Check for referral code in URL
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) setReferralCode(refParam);
  }, [searchParams]);

  // Auto-select payment method
  useEffect(() => {
    if (paymentConfig === undefined) return;

    const hasStripe = !!paymentConfig?.stripeConnectAccountId &&
      (paymentConfig?.customerPaymentMethods?.includes("STRIPE") ?? false);
    const hasPayPal = !!paymentConfig?.paypalMerchantId &&
      (paymentConfig?.customerPaymentMethods?.includes("PAYPAL") ?? false);
    const hasCash = paymentConfig?.customerPaymentMethods?.includes("CASH") ?? true;

    if (hasCash) setPaymentMethod("cash");
    else if (hasStripe) setPaymentMethod("card");
    else if (hasPayPal) setPaymentMethod("paypal");
  }, [paymentConfig]);

  // Reset seats when tier/quantity changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [selectedTierId, quantity]);

  const isLoading = eventDetails === undefined;

  const selectedTier = eventDetails?.ticketTiers?.find((tier: any) => tier._id === selectedTierId);
  const selectedBundle = eventDetails?.bundles?.find((bundle: any) => bundle._id === selectedBundleId);

  // Payment config
  const paymentModel = paymentConfig?.paymentModel || "PREPAY";
  const hasStripeConfigured = !!paymentConfig?.stripeConnectAccountId &&
    (paymentConfig?.customerPaymentMethods?.includes("STRIPE") ?? false);
  const hasPayPalConfigured = !!paymentConfig?.paypalMerchantId &&
    (paymentConfig?.customerPaymentMethods?.includes("PAYPAL") ?? false);
  const hasCashConfigured = paymentConfig?.customerPaymentMethods?.includes("CASH") ?? true;

  // Price calculations
  const subtotal =
    purchaseType === "bundle" && selectedBundle
      ? selectedBundle.price * quantity
      : purchaseType === "tier" && selectedTier
        ? (selectedTier as any).currentPrice * quantity
        : 0;
  const discountAmount = appliedDiscount?.discountAmountCents || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  let platformFee = 0;
  let processingFee = 0;

  if (paymentModel === "PREPAY" || subtotalAfterDiscount === 0) {
    platformFee = 0;
    processingFee = 0;
  } else {
    platformFee = Math.round((subtotalAfterDiscount * 3.7) / 100) + 179;
    processingFee = Math.round(((subtotalAfterDiscount + platformFee) * 2.9) / 100) + 30;
  }

  const total = subtotalAfterDiscount + platformFee + processingFee;

  // Check if form is complete
  const hasSelection = selectedTierId || selectedBundleId;
  const hasBuyerInfo = buyerName.trim() && buyerEmail.trim();
  const requiresSeats = purchaseType === "tier" && (seatingChart?.sections?.length ?? 0) > 0;
  const hasRequiredSeats = !requiresSeats || selectedSeats.length === quantity;
  const canCheckout = hasSelection && hasBuyerInfo && hasRequiredSeats;

  // Handlers
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }
    if (!buyerEmail) {
      setDiscountError("Please enter your email first");
      return;
    }
    if (!selectedTierId) {
      setDiscountError("Please select a ticket tier first");
      return;
    }

    try {
      setDiscountError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "discounts/queries:validateDiscountCode",
          args: {
            eventId,
            code: discountCode.trim().toUpperCase(),
            userEmail: buyerEmail,
            orderTotalCents: subtotal,
            selectedTierIds: [selectedTierId],
          },
        }),
      });

      const result = await response.json();
      if (result.value.valid) {
        setAppliedDiscount({
          _id: result.value.discountCode._id,
          code: result.value.discountCode.code,
          discountType: result.value.discountCode.discountType,
          discountValue: result.value.discountCode.discountValue,
          discountAmountCents: result.value.discountCode.discountAmountCents,
        });
        setDiscountCode("");
      } else {
        setDiscountError(result.value.error || "Invalid discount code");
      }
    } catch {
      setDiscountError("Failed to validate discount code");
    }
  };

  const handleSeatsSelected = (seats: SelectedSeat[]) => setSelectedSeats(seats);

  const handleBallroomSeatSelect = (seat: BallroomSeat) => {
    setSelectedSeats((prev) => [...prev, seat as any]);
  };

  const handleBallroomSeatDeselect = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seatId));
  };

  const handleCreateOrder = async () => {
    if (orderId) return orderId; // Already created

    if (paymentMethod === "cash" && !currentUser) {
      toast.error("Please sign in to complete a cash payment purchase.");
      router.push(`/login?redirect=/events/${eventId}/checkout`);
      return null;
    }

    try {
      let newOrderId;

      if (purchaseType === "bundle" && selectedBundleId) {
        newOrderId = await createBundleOrder({
          eventId,
          bundleId: selectedBundleId,
          quantity,
          buyerEmail,
          buyerName,
          subtotalCents: subtotal,
          platformFeeCents: platformFee,
          processingFeeCents: processingFee,
          totalCents: total,
          referralCode: referralCode || undefined,
          discountCodeId: appliedDiscount?._id,
          discountAmountCents: appliedDiscount?.discountAmountCents,
        });
      } else if (purchaseType === "tier" && selectedTierId) {
        newOrderId = await createOrder({
          eventId,
          ticketTierId: selectedTierId,
          quantity,
          buyerEmail,
          buyerName,
          subtotalCents: subtotal,
          platformFeeCents: platformFee,
          processingFeeCents: processingFee,
          totalCents: total,
          referralCode: referralCode || undefined,
          discountCodeId: appliedDiscount?._id,
          discountAmountCents: appliedDiscount?.discountAmountCents,
          selectedSeats: requiresSeats ? selectedSeats : undefined,
        });
      }

      setOrderId(newOrderId ?? null);
      return newOrderId ?? null;
    } catch (error: any) {
      toast.error(error.message || "Failed to create order");
      return null;
    }
  };

  const handlePaymentSuccess = async (result: Record<string, unknown>) => {
    const currentOrderId = orderId || await handleCreateOrder();
    if (!currentOrderId) return;

    try {
      let usedPaymentMethod: "STRIPE" | "PAYPAL" = "STRIPE";
      let paymentId: string;

      if (result.paymentIntentId) {
        usedPaymentMethod = "STRIPE";
        paymentId = result.paymentIntentId as string;
      } else if (result.paymentId) {
        usedPaymentMethod = "PAYPAL";
        paymentId = result.paymentId as string;
      } else {
        throw new Error("No payment ID received");
      }

      if (purchaseType === "bundle") {
        await completeBundleOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId,
          paymentMethod: usedPaymentMethod,
        });
      } else {
        await completeOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId,
          paymentMethod: usedPaymentMethod,
        });
      }

      setIsSuccess(true);

      // Send confirmation email
      setTimeout(async () => {
        try {
          await fetch("/api/send-ticket-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: buyerEmail,
              orderDetails: getOrderDetails?.order,
              tickets: getOrderDetails?.tickets,
              event: getOrderDetails?.event,
            }),
          });
        } catch {}
      }, 2000);
    } catch (error) {
      toast.error("Payment successful but order completion failed. Please contact support.");
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setIsProcessing(false);
  };

  const handleCashPayment = async () => {
    setIsProcessing(true);
    const currentOrderId = orderId || await handleCreateOrder();
    if (!currentOrderId) {
      setIsProcessing(false);
      return;
    }

    try {
      if (purchaseType === "bundle") {
        await completeBundleOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId: "CASH_PENDING",
          paymentMethod: "CASH",
        });
      } else {
        await completeOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId: "CASH_PENDING",
          paymentMethod: "CASH",
        });
      }
      setIsSuccess(true);
      toast.success("Cash order created! Pay organizer within 30 minutes to activate tickets.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create cash order");
    }
    setIsProcessing(false);
  };

  const handleFreeOrder = async () => {
    setIsProcessing(true);
    const currentOrderId = orderId || await handleCreateOrder();
    if (!currentOrderId) {
      setIsProcessing(false);
      return;
    }

    try {
      if (purchaseType === "bundle") {
        await completeBundleOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId: "FREE_ORDER_NO_PAYMENT",
          paymentMethod: "FREE",
        });
      } else {
        await completeOrder({
          orderId: currentOrderId as Id<"orders">,
          paymentId: "FREE_ORDER_NO_PAYMENT",
          paymentMethod: "FREE",
        });
      }
      setIsSuccess(true);
      toast.success("Order completed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    }
    setIsProcessing(false);
  };

  // Render states
  if (isLoading || !eventDetails || currentUser === undefined) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-8">
            {/* Back button skeleton */}
            <div className="h-6 w-32 bg-muted-foreground/20 rounded animate-pulse mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event header skeleton */}
                <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted-foreground/20 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-3/4 bg-muted-foreground/20 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Ticket selection skeleton */}
                <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
                  <div className="h-6 w-40 bg-muted-foreground/20 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted-foreground/10 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Buyer info skeleton */}
                <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
                  <div className="h-6 w-48 bg-muted-foreground/20 rounded animate-pulse mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-12 bg-muted-foreground/10 rounded-lg animate-pulse" />
                    <div className="h-12 bg-muted-foreground/10 rounded-lg animate-pulse" />
                    <div className="h-12 bg-muted-foreground/10 rounded-lg animate-pulse md:col-span-2" />
                  </div>
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-2xl shadow-lg p-6 border border-border sticky top-24">
                  <div className="h-6 w-32 bg-muted-foreground/20 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-muted-foreground/10 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-muted-foreground/10 rounded animate-pulse" />
                    <div className="h-px bg-border my-4" />
                    <div className="flex justify-between">
                      <div className="h-5 w-16 bg-muted-foreground/20 rounded animate-pulse" />
                      <div className="h-5 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-6 h-12 bg-muted-foreground/20 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (currentUser === null) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">Sign In to Continue</h1>
              <p className="text-muted-foreground mb-8">Please sign in to purchase tickets.</p>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/events/${eventId}/checkout`)}`}
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <Link href={`/register?redirect=${encodeURIComponent(`/events/${eventId}/checkout`)}`} className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted flex items-center justify-center p-4" data-testid="payment-success">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl shadow-lg p-8 max-w-md text-center"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {paymentMethod === "cash" ? "Order Created!" : "Payment Successful!"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {paymentMethod === "cash"
                ? "Pay the organizer to activate your tickets."
                : "Your tickets have been purchased. Check your email for confirmation."}
            </p>
            <div className="space-y-3">
              <Link
                href="/my-tickets"
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                View My Tickets
              </Link>
              <Link
                href={`/events/${eventId}`}
                className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Back to Event
              </Link>
            </div>
          </motion.div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Show helpful error states when tickets aren't available
  const ticketingStatus = eventDetails?.ticketingStatus;
  if (ticketingStatus && ticketingStatus.status !== "available") {
    const statusConfig: Record<string, { icon: React.ReactNode; title: string; color: string }> = {
      event_ended: {
        icon: <Calendar className="w-10 h-10 text-muted-foreground" />,
        title: "Event Has Ended",
        color: "bg-muted-foreground/10",
      },
      hidden: {
        icon: <Clock className="w-10 h-10 text-warning" />,
        title: "Tickets Coming Soon",
        color: "bg-warning/10",
      },
      payment_not_configured: {
        icon: <AlertCircle className="w-10 h-10 text-warning" />,
        title: "Tickets Unavailable",
        color: "bg-warning/10",
      },
      sold_out: {
        icon: <Ticket className="w-10 h-10 text-destructive" />,
        title: "Sold Out",
        color: "bg-destructive/10",
      },
    };

    const config = statusConfig[ticketingStatus.status] || statusConfig.hidden;

    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl shadow-lg p-8 max-w-md text-center border border-border"
          >
            <div className={`w-16 h-16 ${config.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {config.icon}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{config.title}</h2>
            <p className="text-muted-foreground mb-6">{ticketingStatus.message}</p>
            <div className="space-y-3">
              <Link
                href={`/events/${eventId}`}
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Back to Event
              </Link>
              {ticketingStatus.status === "sold_out" && (
                <button
                  type="button"
                  className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Join Waitlist
                </button>
              )}
              {(ticketingStatus.status === "payment_not_configured" || ticketingStatus.status === "hidden") && eventDetails?.organizer?.email && (
                <a
                  href={`mailto:${eventDetails.organizer.email}?subject=Question about ${eventDetails.name}`}
                  className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Contact Organizer
                </a>
              )}
            </div>
          </motion.div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <div className="flex items-center justify-between">
              <Link
                href={`/events/${eventId}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Event</span>
              </Link>
              <h1 className="font-semibold text-foreground">Checkout</h1>
              <div className="w-20" /> {/* Spacer */}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column: Event + Tickets + Buyer Info (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Event Card */}
              <div className="bg-card rounded-xl shadow-md overflow-hidden">
                <div className="flex gap-4 p-4">
                  <img
                    src={eventDetails.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80"}
                    alt={eventDetails.name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-bold text-foreground text-lg truncate">{eventDetails.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {eventDetails.startDate && format(new Date(eventDetails.startDate), "EEE, MMM d 'at' h:mm a")}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {typeof eventDetails.location === "object"
                        ? `${eventDetails.location.venueName ?? ""}, ${eventDetails.location.city}`
                        : eventDetails.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral Banner */}
              {referralCode && staffMemberInfo && (
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Referred by {staffMemberInfo.name}</p>
                      <p className="text-sm text-primary">Your purchase supports this seller</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ticket Selection */}
              <div className="bg-card rounded-xl shadow-md p-6">
                <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Select Tickets
                </h3>
                <TicketSelector
                  tiers={eventDetails.ticketTiers || []}
                  bundles={eventDetails.bundles || []}
                  selectedTierId={selectedTierId}
                  selectedBundleId={selectedBundleId}
                  purchaseType={purchaseType}
                  quantity={quantity}
                  onTierSelect={(id) => {
                    setSelectedTierId(id);
                    setSelectedBundleId(null);
                  }}
                  onBundleSelect={(id) => {
                    setSelectedBundleId(id);
                    setSelectedTierId(null);
                  }}
                  onPurchaseTypeChange={(type) => {
                    setPurchaseType(type);
                    if (type === "tier") setSelectedBundleId(null);
                    else setSelectedTierId(null);
                  }}
                  onQuantityChange={setQuantity}
                />
              </div>

              {/* Seat Selection */}
              {ENABLE_SEATING && selectedTierId && purchaseType === "tier" && (seatingChart?.sections?.length ?? 0) > 0 && (
                <div className="bg-card rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-foreground text-lg mb-4">Select Your Seats</h3>
                  {(seatingChart as any).seatingStyle === "TABLE_BASED" ? (
                    <InteractiveSeatingChart
                      eventId={eventId}
                      onSeatSelect={handleBallroomSeatSelect}
                      onSeatDeselect={handleBallroomSeatDeselect}
                      selectedSeats={selectedSeats as any}
                      className="min-h-[400px]"
                    />
                  ) : (
                    <SeatSelection
                      eventId={eventId}
                      ticketTierId={selectedTierId}
                      requiredSeats={quantity}
                      onSeatsSelected={handleSeatsSelected}
                    />
                  )}
                </div>
              )}

              {/* Buyer Info */}
              {hasSelection && (
                <div className="bg-card rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-foreground text-lg mb-4">Your Information</h3>

                  {paymentMethod === "cash" && currentUser && (
                    <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Signed in as <strong>{currentUser.email}</strong>
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="John Doe"
                        data-testid="buyer-name"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="john@example.com"
                        data-testid="buyer-email"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Summary + Payment (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <div className="bg-card rounded-xl shadow-md p-6 sticky top-20">
                <h3 className="font-bold text-foreground text-lg mb-4">Order Summary</h3>

                {hasSelection ? (
                  <div className="space-y-4">
                    {/* Line item */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {purchaseType === "bundle" ? selectedBundle?.name : selectedTier?.name} x {quantity}
                      </span>
                      <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                    </div>

                    {/* Discount */}
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm bg-success/10 -mx-2 px-2 py-2 rounded">
                        <span className="text-success flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {appliedDiscount.code}
                        </span>
                        <span className="text-success">-${(discountAmount / 100).toFixed(2)}</span>
                      </div>
                    )}

                    {/* Fees */}
                    {(platformFee > 0 || processingFee > 0) && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fees</span>
                          <span className="font-medium">${((platformFee + processingFee) / 100).toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">${(total / 100).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Discount Code Input */}
                    {!appliedDiscount && (
                      <div className="pt-4 border-t">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              setDiscountError(null);
                            }}
                            placeholder="Discount code"
                            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm uppercase"
                          />
                          <button
                            type="button"
                            onClick={handleApplyDiscount}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                          >
                            Apply
                          </button>
                        </div>
                        {discountError && (
                          <p className="text-sm text-destructive mt-1">{discountError}</p>
                        )}
                      </div>
                    )}

                    {appliedDiscount && (
                      <button
                        type="button"
                        onClick={() => setAppliedDiscount(null)}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove discount
                      </button>
                    )}

                    {/* Payment Section */}
                    {hasBuyerInfo && hasRequiredSeats && (
                      <div className="pt-4 border-t space-y-4">
                        <h4 className="font-semibold text-foreground">Payment Method</h4>

                        {/* Free order */}
                        {total === 0 ? (
                          <button
                            type="button"
                            onClick={handleFreeOrder}
                            disabled={isProcessing}
                            className="w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Complete Free Order"}
                          </button>
                        ) : (
                          <>
                            {/* Payment method selector */}
                            <div className="grid grid-cols-3 gap-2">
                              {hasStripeConfigured && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod("card")}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    paymentMethod === "card"
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                  <span className="text-xs">Card</span>
                                </button>
                              )}
                              {hasPayPalConfigured && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod("paypal")}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    paymentMethod === "paypal"
                                      ? "border-[#0070BA] bg-blue-50"
                                      : "border-border hover:border-[#0070BA]/50"
                                  }`}
                                >
                                  <span className="text-[#003087] font-bold text-sm">Pay</span>
                                  <span className="text-[#0070BA] font-bold text-sm">Pal</span>
                                </button>
                              )}
                              {hasCashConfigured && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod("cash")}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    paymentMethod === "cash"
                                      ? "border-success bg-success/5"
                                      : "border-border hover:border-success/50"
                                  }`}
                                >
                                  <Banknote className="w-5 h-5 mx-auto mb-1" />
                                  <span className="text-xs">Cash</span>
                                </button>
                              )}
                            </div>

                            {/* Payment Form */}
                            {paymentMethod === "card" && hasStripeConfigured && (
                              <StripeCheckout
                                total={total / 100}
                                connectedAccountId={paymentConfig?.stripeConnectAccountId || ""}
                                platformFee={platformFee + processingFee}
                                orderId={orderId || undefined}
                                orderNumber={`ORD-${Date.now()}`}
                                billingContact={{
                                  givenName: buyerName.split(" ")[0],
                                  familyName: buyerName.split(" ").slice(1).join(" "),
                                  email: buyerEmail,
                                }}
                                onPaymentSuccess={(result) => handlePaymentSuccess({ paymentIntentId: result.paymentIntentId })}
                                onPaymentError={handlePaymentError}
                                onBack={() => setPaymentMethod("cash")}
                              />
                            )}

                            {paymentMethod === "paypal" && hasPayPalConfigured && (
                              <PayPalPayment
                                amount={total}
                                platformFee={platformFee + processingFee}
                                orderId={orderId || undefined}
                                description={`${eventDetails.name} - ${selectedTier?.name || selectedBundle?.name} x ${quantity}`}
                                organizerPaypalMerchantId={paymentConfig?.paypalMerchantId}
                                onSuccess={(paypalOrderId) => handlePaymentSuccess({ paymentId: paypalOrderId })}
                                onError={handlePaymentError}
                              />
                            )}

                            {paymentMethod === "cash" && (
                              <div className="space-y-3">
                                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                                  <p className="text-sm text-foreground flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                    Payment must be verified by staff before tickets are activated.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCashPayment}
                                  disabled={isProcessing}
                                  className="w-full px-6 py-4 bg-success text-white rounded-xl font-semibold hover:bg-success/90 disabled:opacity-50"
                                >
                                  {isProcessing ? "Processing..." : "Confirm Cash Payment"}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Missing requirements message */}
                    {!canCheckout && hasSelection && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                          {!hasBuyerInfo && "Enter your name and email to continue"}
                          {hasBuyerInfo && !hasRequiredSeats && `Select ${quantity} seat${quantity > 1 ? "s" : ""} to continue`}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select tickets to see your order summary
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
