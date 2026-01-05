"use client";

/**
 * Single-Page Hotel Booking
 *
 * All-in-one page for browsing and booking event hotel packages:
 * - View all hotels for the event
 * - Select room type and dates
 * - Enter guest information
 * - Complete payment
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
  MapPin,
  Users,
  Bed,
  Star,
  Wifi,
  Car,
  Coffee,
  Waves,
  Dumbbell,
  Utensils,
  Minus,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { toast } from "sonner";

// Amenity display helpers
const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  pool: Waves,
  gym: Dumbbell,
  restaurant: Utensils,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  parking: "Parking",
  breakfast: "Breakfast",
  pool: "Pool",
  gym: "Gym",
  restaurant: "Restaurant",
};

interface RoomType {
  id: string;
  name: string;
  pricePerNightCents: number;
  quantity: number;
  sold: number;
  maxGuests: number;
  description?: string;
}

export default function HotelBookingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  // Queries
  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const hotelPackages = useQuery(api.hotels.queries.getHotelPackagesForEvent, { eventId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const paymentConfig = useQuery(api.events.queries.getPaymentConfig, { eventId });

  // Selection state
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

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

  // Mutations
  const createReservation = useMutation(api.hotels.bookings.createReservation);
  const confirmReservation = useMutation(api.hotels.bookings.confirmReservation);

  // Check availability
  const selectedHotel = hotelPackages?.find((h) => h._id === selectedHotelId);
  const selectedRoomType = selectedHotel?.roomTypes.find((rt) => rt.id === selectedRoomTypeId);

  const availability = useQuery(
    api.hotels.queries.checkAvailability,
    selectedHotelId && selectedRoomTypeId && checkInDate && checkOutDate
      ? {
          packageId: selectedHotelId as Id<"hotelPackages">,
          roomTypeId: selectedRoomTypeId,
          checkInDate: new Date(checkInDate).getTime(),
          checkOutDate: new Date(checkOutDate).getTime(),
          numberOfRooms,
        }
      : "skip"
  );

  // Initialize dates and user info
  useEffect(() => {
    if (selectedHotel && !checkInDate) {
      setCheckInDate(format(new Date(selectedHotel.checkInDate), "yyyy-MM-dd"));
      setCheckOutDate(format(new Date(selectedHotel.checkOutDate), "yyyy-MM-dd"));
    }
  }, [selectedHotel, checkInDate]);

  useEffect(() => {
    if (currentUser) {
      setGuestName(currentUser.name || "");
      setGuestEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // Calculate room constraints
  const maxRoomsAvailable = selectedRoomType
    ? selectedRoomType.quantity - selectedRoomType.sold
    : 0;
  const maxGuests = selectedRoomType ? selectedRoomType.maxGuests * numberOfRooms : 0;

  // Payment config
  const hasStripeConfigured = !!paymentConfig?.stripeConnectAccountId;
  const hasPayPalConfigured = !!paymentConfig?.paypalMerchantId;
  const hasPaymentMethod = hasStripeConfigured || hasPayPalConfigured;
  const canCheckout = guestName.trim() && guestEmail.trim() && availability?.available && hasPaymentMethod;

  // Loading state
  const isLoading = eventDetails === undefined || hotelPackages === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading hotels...</p>
        </div>
      </div>
    );
  }

  // No hotels available
  if (!hotelPackages || hotelPackages.length === 0) {
    return (
      <div className="min-h-screen bg-muted">
        <PublicHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <Hotel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Hotels Available</h1>
            <p className="text-muted-foreground mb-6">
              There are no hotel packages available for this event yet.
            </p>
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Event
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // Create reservation
  const handleCreateReservation = async () => {
    if (!selectedHotelId || !selectedRoomTypeId || !availability?.available || !canCheckout) return;

    setIsProcessing(true);
    try {
      const result = await createReservation({
        packageId: selectedHotelId as Id<"hotelPackages">,
        roomTypeId: selectedRoomTypeId,
        checkInDate: new Date(checkInDate).getTime(),
        checkOutDate: new Date(checkOutDate).getTime(),
        numberOfRooms,
        numberOfGuests,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        specialRequests: specialRequests || undefined,
        paymentMethod,
      });

      setReservationId(result.reservationId);
      setConfirmationNumber(result.confirmationNumber);
    } catch (error: any) {
      toast.error(error.message || "Failed to create reservation");
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

      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm reservation");
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
              <h1 className="text-xl font-bold text-foreground">Book Your Stay</h1>
              <p className="text-sm text-muted-foreground">{eventDetails?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Select Hotel */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-semibold">Select a Hotel</h2>
            </div>

            <div className="space-y-6">
              {hotelPackages.map((hotel) => {
                const isSelected = selectedHotelId === hotel._id;
                const hasAvailability = hotel.roomTypes.some((rt) => rt.quantity - rt.sold > 0);
                const nights = Math.ceil(
                  (hotel.checkOutDate - hotel.checkInDate) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={hotel._id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary"
                        : "border-border"
                    }`}
                  >
                    {/* Hotel Header */}
                    <div className="flex gap-4 p-4 bg-muted/30">
                      {/* Hotel Image Thumbnail */}
                      {hotel.images && hotel.images.length > 0 ? (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={hotel.images[0]}
                            alt={hotel.hotelName}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center">
                          <Hotel className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}

                      {/* Hotel Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{hotel.hotelName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {hotel.city}, {hotel.state}
                        </p>
                        {hotel.starRating && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: hotel.starRating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(hotel.checkInDate), "MMM d")} - {format(new Date(hotel.checkOutDate), "MMM d, yyyy")}
                          <span className="text-xs">({nights} night{nights > 1 ? "s" : ""})</span>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-border bg-muted/10">
                        {hotel.amenities.map((amenityId) => {
                          const Icon = AMENITY_ICONS[amenityId] || Hotel;
                          const label = AMENITY_LABELS[amenityId] || amenityId;
                          return (
                            <span
                              key={amenityId}
                              className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                            >
                              <Icon className="w-3 h-3" />
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* ALL ROOM TYPES VISIBLE */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Available Room Types:</p>
                      {hotel.roomTypes.map((rt) => {
                        const available = rt.quantity - rt.sold;
                        const isSoldOut = available <= 0;
                        const isRoomSelected = selectedHotelId === hotel._id && selectedRoomTypeId === rt.id;
                        const totalForStay = (rt.pricePerNightCents * nights) / 100;

                        return (
                          <button
                            key={rt.id}
                            type="button"
                            onClick={() => {
                              if (!isSoldOut) {
                                setSelectedHotelId(hotel._id);
                                setSelectedRoomTypeId(rt.id);
                                setCheckInDate(format(new Date(hotel.checkInDate), "yyyy-MM-dd"));
                                setCheckOutDate(format(new Date(hotel.checkOutDate), "yyyy-MM-dd"));
                              }
                            }}
                            disabled={isSoldOut}
                            className={`w-full text-left border rounded-lg p-3 transition-all ${
                              isRoomSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : isSoldOut
                                  ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                                  : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Bed className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium">{rt.name}</p>
                                </div>
                                {rt.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{rt.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Users className="w-3 h-3" />
                                  Up to {rt.maxGuests} guests
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary text-lg">
                                  ${(rt.pricePerNightCents / 100).toFixed(0)}
                                  <span className="text-xs font-normal text-muted-foreground">/night</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${totalForStay.toFixed(0)} total
                                </p>
                                <p className={`text-xs mt-1 ${isSoldOut ? "text-destructive" : "text-success"}`}>
                                  {isSoldOut ? "Sold Out" : `${available} left`}
                                </p>
                              </div>
                              {!isSoldOut && (
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                  isRoomSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}>
                                  {isRoomSelected && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 2: Room Details & Quantity */}
          {selectedRoomType && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-semibold">Room Details</h2>
              </div>

              {/* Selected Room Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedHotel?.hotelName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRoomType.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${(selectedRoomType.pricePerNightCents / 100).toFixed(0)}/night</p>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={selectedHotel ? format(new Date(selectedHotel.checkInDate), "yyyy-MM-dd") : ""}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Rooms</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNumberOfRooms(Math.max(1, numberOfRooms - 1))}
                      disabled={numberOfRooms <= 1}
                      className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{numberOfRooms}</span>
                    <button
                      type="button"
                      onClick={() => setNumberOfRooms(Math.min(maxRoomsAvailable, numberOfRooms + 1))}
                      disabled={numberOfRooms >= maxRoomsAvailable}
                      className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      ({maxRoomsAvailable} available)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Guests</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                      disabled={numberOfGuests <= 1}
                      className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{numberOfGuests}</span>
                    <button
                      type="button"
                      onClick={() => setNumberOfGuests(Math.min(maxGuests, numberOfGuests + 1))}
                      disabled={numberOfGuests >= maxGuests}
                      className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">(max {maxGuests})</span>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              {availability && (
                <div className="mt-6 pt-6 border-t border-border">
                  {availability.available ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          ${((selectedRoomType?.pricePerNightCents || 0) / 100).toFixed(2)} x{" "}
                          {availability.nights ?? 0} night{(availability.nights ?? 0) > 1 ? "s" : ""} x{" "}
                          {numberOfRooms} room{numberOfRooms > 1 ? "s" : ""}
                        </span>
                        <span>${((availability.subtotalCents ?? 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform fee (5%)</span>
                        <span>${((availability.platformFeeCents ?? 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">${((availability.totalCents ?? 0) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{availability.reason}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          )}

          {/* Step 3: Guest Information */}
          {selectedRoomType && availability?.available && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-semibold">Guest Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Special Requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    rows={2}
                    placeholder="Early check-in, late check-out, room preferences..."
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 4: Payment */}
          {selectedRoomType && availability?.available && guestName && guestEmail && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h2 className="text-lg font-semibold">Payment</h2>
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

              {/* Booking Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hotel</span>
                    <span>{selectedHotel?.hotelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span>{selectedRoomType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span>
                      {format(new Date(checkInDate), "MMM d")} -{" "}
                      {format(new Date(checkOutDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rooms & Guests</span>
                    <span>
                      {numberOfRooms} room{numberOfRooms > 1 ? "s" : ""}, {numberOfGuests} guest
                      {numberOfGuests > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">
                      ${((availability.totalCents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Not Configured Warning - Show instead of button */}
              {!hasPaymentMethod && (
                <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Payment Not Available</p>
                    <p className="text-sm text-muted-foreground">
                      The organizer has not set up payment processing for this event. Please contact the organizer to complete your booking.
                    </p>
                    <Link
                      href={`/events/${eventId}`}
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      Go to event page for contact info →
                    </Link>
                  </div>
                </div>
              )}

              {/* Create Reservation Button - Only show when payment is configured */}
              {!reservationId && hasPaymentMethod && (
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
                    `Complete Booking - $${((availability.totalCents ?? 0) / 100).toFixed(2)}`
                  )}
                </button>
              )}

              {/* Payment Forms */}
              {reservationId && paymentMethod === "STRIPE" && (
                <StripeCheckout
                  total={(availability.totalCents ?? 0) / 100}
                  connectedAccountId=""
                  platformFee={availability.platformFeeCents ?? 0}
                  orderId={reservationId}
                  orderNumber={`HOTEL-${Date.now()}`}
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
                  amount={availability.totalCents ?? 0}
                  description={`Hotel: ${selectedHotel?.hotelName} - ${selectedRoomType?.name}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </motion.section>
          )}

          {/* Security Notice */}
          <div className="text-center text-xs text-muted-foreground pb-8">
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

      <PublicFooter />
    </div>
  );
}
