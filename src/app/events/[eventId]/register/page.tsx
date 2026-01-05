"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Ticket,
  Mail,
  User,
  Loader2,
  Download,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

export default function FreeEventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.eventId as Id<"events">;

  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const eventDetails = useQuery(api.public.queries.getPublicEventDetails, { eventId });
  const staffMemberInfo = useQuery(
    api.staff.queries.getStaffByReferralCode,
    referralCode ? { referralCode } : "skip"
  );

  const registerFreeEvent = useMutation(api.tickets.mutations.registerFreeEvent);

  // Check for referral code in URL
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!attendeeName || !attendeeEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerFreeEvent({
        eventId,
        attendeeName,
        attendeeEmail,
        referralCode: referralCode || undefined,
      });

      setRegistrationData(result);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Verify event is free
  if (eventDetails.eventType !== "FREE_EVENT") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <p className="text-muted-foreground mb-4">
            This is not a free event. Please use the checkout page to purchase tickets.
          </p>
          <Link
            href={`/events/${eventId}/checkout`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Checkout
          </Link>
        </div>
      </div>
    );
  }

  // Success Screen
  if (isSuccess && registrationData) {
    const ticketUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/ticket/${registrationData.ticketCode}`;

    return (
      <div className="min-h-screen bg-primary py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-xl overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-primary p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-12 h-12 text-success" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">You're Registered!</h1>
              <p className="text-white/80">Your free ticket has been confirmed</p>
            </div>

            {/* Event Details */}
            <div className="p-8 border-b">
              <h2 className="text-2xl font-bold text-foreground mb-4">{eventDetails.name}</h2>
              <div className="space-y-3 text-foreground">
                {eventDetails.startDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>
                      {format(new Date(eventDetails.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
                {eventDetails.location && typeof eventDetails.location === "object" && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>
                      {eventDetails.location.venueName && `${eventDetails.location.venueName}, `}
                      {eventDetails.location.city}, {eventDetails.location.state}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket QR Code */}
            <div className="p-8 bg-muted">
              <h3 className="text-lg font-bold text-foreground mb-4 text-center">Your Ticket</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-4 border-border">
                    <QRCodeSVG value={ticketUrl} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 font-mono">
                    {registrationData.ticketCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Show this QR code at the event entrance
                  </p>
                </div>
              </div>
            </div>

            {/* Attendee Info */}
            <div className="p-8 border-t">
              <h3 className="text-lg font-bold text-foreground mb-4">Registration Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{attendeeName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{attendeeEmail}</span>
                </div>
              </div>
            </div>

            {/* Staff Attribution */}
            {referralCode && staffMemberInfo && (
              <div className="p-8 bg-accent border-t border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Referred by {staffMemberInfo.name}
                    </p>
                    <p className="text-sm text-primary">Thanks for using their referral code!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-8 bg-muted border-t space-y-3">
              <Link
                href="/my-tickets"
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <Ticket className="w-5 h-5" />
                  View in My Tickets
                </div>
              </Link>
              <Link
                href={`/events/${eventId}`}
                className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-card transition-colors text-center"
              >
                Back to Event Page
              </Link>
              <p className="text-sm text-muted-foreground text-center mt-4">
                A confirmation email will be sent to {attendeeEmail}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-8 text-center">
            <Ticket className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Register for Free</h1>
            <p className="text-white/80">No payment required</p>
          </div>

          {/* Event Info */}
          <div className="p-8 border-b bg-background">
            <h2 className="text-2xl font-bold text-foreground mb-4">{eventDetails.name}</h2>
            <div className="space-y-3 text-foreground">
              {eventDetails.startDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>
                    {format(new Date(eventDetails.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
              {eventDetails.location && typeof eventDetails.location === "object" && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>
                    {eventDetails.location.venueName && `${eventDetails.location.venueName}, `}
                    {eventDetails.location.city}, {eventDetails.location.state}
                  </span>
                </div>
              )}
            </div>

            {/* Door Price Info */}
            {eventDetails.doorPrice && (
              <div className="mt-4 p-4 bg-success/10 border border-success rounded-lg">
                <p className="text-sm font-semibold text-success">
                  Door Price: {eventDetails.doorPrice}
                </p>
                <p className="text-xs text-success mt-1">Payment accepted at venue</p>
              </div>
            )}
          </div>

          {/* Referral Code Banner */}
          {referralCode && staffMemberInfo && (
            <div className="p-6 bg-accent border-b border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Referred by {staffMemberInfo.name}
                  </h4>
                  <p className="text-sm text-primary">
                    Your registration will be credited to this staff member
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Your ticket will be sent to this email</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Free Registration
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By registering, you agree to receive event updates via email
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
