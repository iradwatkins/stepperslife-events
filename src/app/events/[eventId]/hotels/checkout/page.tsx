"use client";

/**
 * Hotel Checkout Page
 *
 * Simple checkout flow for hotel reservations:
 * - Left: Guest info
 * - Right: Booking summary + Payment
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StripeCheckout } from "@/components/checkout/StripeCheckout";
import { PayPalPayment } from "@/components/checkout/PayPalPayment";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Hotel,
  UserCheck,
  CreditCard,
  Calendar,
  Users,
  Bed,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { toast } from "sonner";

interface BookingDetails {
  packageId: string;
  eventId: string;
  roomTypeId: string;
  roomTypeName: string;
  hotelName: string;
  checkInDate: number;
  checkOutDate: number;
  numberOfRooms: number;
  numberOfGuests: number;
  pricePerNightCents: number;
  nights: number;
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
}

export default function HotelCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  // Booking details from sessionStorage
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  // Guest info
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "PAYPAL">("STRIPE");
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });

  // Mutations
  const createReservation = useMutation(api.hotels.bookings.createReservation);
  const confirmReservation = useMutation(api.hotels.bookings.confirmReservation);

  // Load booking details from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("hotelBookingDetails");
    if (stored) {
      try {
        const details = JSON.parse(stored);
        // Use queueMicrotask to avoid synchronous setState during render
        queueMicrotask(() => {
          setBookingDetails(details);
        });
      } catch {
        console.error("Failed to parse booking details");
        router.push(`/events/${eventId}`);
      }
    } else {
      // No booking details, redirect back
      router.push(`/events/${eventId}`);
    }
  }, [eventId, router]);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (currentUser) {
      // Use queueMicrotask to avoid synchronous setState during render
      queueMicrotask(() => {
        setGuestName(currentUser.name || "");
        setGuestEmail(currentUser.email || "");
      });
    }
  }, [currentUser]);

  // Payment config
  const hasStripeConfigured = !!paymentConfig?.stripeConnectAccountId;
  const hasPayPalConfigured = !!paymentConfig?.paypalMerchantId;

  const isLoading = eventDetails === undefined || !bookingDetails;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const canCheckout = guestName.trim() && guestEmail.trim();

  // Create reservation and proceed to payment
  const handleCreateReservation = async () => {
    if (!bookingDetails || !canCheckout) return;

    setIsProcessing(true);
    try {
      const result = await createReservation({
        packageId: bookingDetails.packageId as Id<"hotelPackages">,
        roomTypeId: bookingDetails.roomTypeId,
        checkInDate: bookingDetails.checkInDate,
        checkOutDate: bookingDetails.checkOutDate,
        numberOfRooms: bookingDetails.numberOfRooms,
        numberOfGuests: bookingDetails.numberOfGuests,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        specialRequests: specialRequests || undefined,
        paymentMethod,
      });

      setReservationId(result.reservationId);
      setConfirmationNumber(result.confirmationNumber);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reservation");
      setIsProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentId: string) => {
    if (!reservationId) return;

    try {
      await confirmReservation({
        reservationId: reservationId as Id<"hotelReservations">,
        stripePaymentIntentId: paymentMethod === "STRIPE" ? paymentId : undefined,
        paypalOrderId: paymentMethod === "PAYPAL" ? paymentId : undefined,
      });

      // Clear session storage
      sessionStorage.removeItem("hotelBookingDetails");
      setIsSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm reservation");
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast.error(error);
    setReservationId(null);
    setIsProcessing(false);
  };

  // Success View
  if (isSuccess && confirmationNumber) {
    return (
      <div className="min-h-screen bg-muted">
        <PublicHeader />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Reservation Confirmed!
            </h1>
            <p className="text-muted-foreground mb-2">
              Your hotel reservation has been successfully booked.
            </p>
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {confirmationNumber}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to {guestEmail}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/events/${eventId}`}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Back to Event
              </Link>
              <Link
                href="/account/bookings"
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                View My Bookings
              </Link>
            </div>
          </motion.div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <PublicHeader />

      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${eventId}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Hotel Checkout</h1>
              <p className="text-sm text-muted-foreground">{eventDetails?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8">
          {/* Left: Guest Info */}
          <div className="md:col-span-3 space-y-6">
            {/* Booking Summary Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {bookingDetails.hotelName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {bookingDetails.roomTypeName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {format(new Date(bookingDetails.checkInDate), "MMM d")} -{" "}
                    {format(new Date(bookingDetails.checkOutDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {bookingDetails.numberOfRooms} room
                    {bookingDetails.numberOfRooms > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {bookingDetails.numberOfGuests} guest
                    {bookingDetails.numberOfGuests > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {bookingDetails.nights} night{bookingDetails.nights > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Guest Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    placeholder="john@example.com"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    placeholder="+1 (555) 123-4567"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Special Requests
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    rows={3}
                    placeholder="Early check-in, late check-out, room preferences..."
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Payment */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ${(bookingDetails.pricePerNightCents / 100).toFixed(2)} x{" "}
                    {bookingDetails.nights} nights x {bookingDetails.numberOfRooms} rooms
                  </span>
                  <span>${(bookingDetails.subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (5%)</span>
                  <span>${(bookingDetails.platformFeeCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">
                    ${(bookingDetails.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Payment</h3>
              </div>

              {/* Payment Method Selection */}
              {!reservationId && (
                <div className="space-y-3 mb-6">
                  {hasStripeConfigured && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("STRIPE")}
                      className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        paymentMethod === "STRIPE"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Credit/Debit Card</span>
                    </button>
                  )}

                  {hasPayPalConfigured && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PAYPAL")}
                      className={`w-full flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        paymentMethod === "PAYPAL"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      disabled={isProcessing}
                    >
                      <span className="text-blue-600 font-bold">PayPal</span>
                    </button>
                  )}
                </div>
              )}

              {/* Create Reservation Button */}
              {!reservationId && (
                <button
                  type="button"
                  onClick={handleCreateReservation}
                  disabled={!canCheckout || isProcessing}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    canCheckout && !isProcessing
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Continue to Payment - $${(bookingDetails.totalCents / 100).toFixed(2)}`
                  )}
                </button>
              )}

              {/* Payment Forms */}
              {reservationId && paymentMethod === "STRIPE" && (
                <StripeCheckout
                  total={bookingDetails.totalCents / 100}
                  connectedAccountId=""
                  platformFee={bookingDetails.platformFeeCents}
                  orderId={reservationId}
                  orderNumber={`HOTEL-${reservationId}`}
                  billingContact={{
                    givenName: guestName.split(" ")[0],
                    familyName: guestName.split(" ").slice(1).join(" "),
                    email: guestEmail,
                  }}
                  onPaymentSuccess={(result) => handlePaymentSuccess(result.paymentIntentId)}
                  onPaymentError={handlePaymentError}
                  onBack={() => setPaymentMethod("STRIPE")}
                />
              )}

              {reservationId && paymentMethod === "PAYPAL" && (
                <PayPalPayment
                  amount={bookingDetails.totalCents}
                  description={`Hotel: ${bookingDetails.hotelName} - ${bookingDetails.roomTypeName}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {/* Warning */}
              {!hasStripeConfigured && !hasPayPalConfigured && (
                <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Payment Not Configured</p>
                    <p className="text-sm text-muted-foreground">
                      The organizer has not set up payment processing for this event.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Your payment is secure and encrypted.</p>
              <p className="mt-1">
                By completing this reservation, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
