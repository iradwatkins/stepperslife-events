"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Mail,
  BookOpen,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatEventDate, formatEventTime } from "@/lib/date-format";

interface EnrollmentTier {
  _id: string;
  name: string;
  description?: string;
  priceCents: number;
  quantity: number;
  sold: number;
  available: number;
  isAvailable: boolean;
}

export default function ClassCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as Id<"events">;

  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(null);

  // Use the class-specific query
  const classDetails = useQuery(api.public.queries.getPublicClassDetails, { classId });
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const createOrder = useMutation(api.tickets.mutations.createOrder);
  const completeOrder = useMutation(api.tickets.mutations.completeOrder);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setBuyerEmail(currentUser.email);
      if (currentUser.name) setBuyerName(currentUser.name);
    }
  }, [currentUser]);

  // Auto-select first tier if only one available
  useEffect(() => {
    if (classDetails?.enrollmentTiers && classDetails.enrollmentTiers.length === 1) {
      const tier = classDetails.enrollmentTiers[0];
      if (tier.isAvailable) {
        setSelectedTierId(tier._id as Id<"ticketTiers">);
      }
    }
  }, [classDetails]);

  const isLoading = classDetails === undefined;

  const selectedTier = classDetails?.enrollmentTiers?.find(
    (tier: EnrollmentTier) => tier._id === selectedTierId
  );

  const subtotal = selectedTier ? selectedTier.priceCents * quantity : 0;
  const isFree = subtotal === 0;

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handleEnroll = async () => {
    if (!selectedTierId || !buyerEmail || !buyerName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate order totals (free classes have 0 fees)
      const subtotalCents = selectedTier ? selectedTier.priceCents * quantity : 0;
      const platformFeeCents = 0; // No platform fee for classes
      const processingFeeCents = 0; // No processing fee for free classes
      const totalCents = subtotalCents + platformFeeCents + processingFeeCents;

      // Create the order - returns orderId directly
      const orderId = await createOrder({
        eventId: classId,
        ticketTierId: selectedTierId,
        quantity,
        buyerEmail: buyerEmail.trim().toLowerCase(),
        buyerName: buyerName.trim(),
        subtotalCents,
        platformFeeCents,
        processingFeeCents,
        totalCents,
      });

      if (!orderId) {
        throw new Error("Failed to create enrollment");
      }

      // For free classes, complete the order immediately with FREE payment method
      const completeResult = await completeOrder({
        orderId: orderId,
        paymentId: isFree ? "FREE_ENROLLMENT" : "CASH_PAYMENT",
        paymentMethod: isFree ? "FREE" : "CASH",
      });

      // completeOrder returns { success: true, ticketCount }
      if (completeResult?.success) {
        // Generate a simple confirmation code from the order ID
        const confirmationCode = `ENR-${orderId.slice(-8).toUpperCase()}`;
        setEnrollmentCode(confirmationCode);
      }

      setIsSuccess(true);
      toast.success("Successfully enrolled in class!");
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error(error.message || "Failed to complete enrollment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading || currentUser === undefined) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading class details...</p>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Require login to enroll
  if (!currentUser) {
    const redirectUrl = encodeURIComponent(`/classes/${classId}/checkout`);
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg p-8 text-center border border-border">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">Sign In to Continue</h1>
              <p className="text-muted-foreground mb-8">
                Please sign in to enroll in this class.
              </p>
              <Link
                href={`/login?redirect=${redirectUrl}`}
                className="block w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <Link href={`/register?redirect=${redirectUrl}`} className="text-primary hover:underline">
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

  // Class not found
  if (!classDetails) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Class Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This class doesn't exist or is no longer available for enrollment.
            </p>
            <Link href="/classes">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Classes
              </Button>
            </Link>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // No enrollment tiers available
  if (!classDetails.enrollmentTiers || classDetails.enrollmentTiers.length === 0) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Enrollment Not Available</h1>
            <p className="text-muted-foreground mb-6">
              This class doesn't have any enrollment options available yet.
            </p>
            <Link href={`/classes/${classId}`}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
              </Button>
            </Link>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-muted py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl shadow-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                You're Enrolled!
              </h1>
              <p className="text-muted-foreground mb-6">
                You've successfully enrolled in {classDetails.name}
              </p>

              {enrollmentCode && (
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Your Enrollment Code</p>
                  <p className="text-2xl font-mono font-bold text-primary">{enrollmentCode}</p>
                </div>
              )}

              <div className="text-left bg-muted rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-3">Class Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {classDetails.startDate
                        ? formatEventDate(classDetails.startDate, classDetails.timezone)
                        : "Date TBD"}
                    </span>
                  </div>
                  {classDetails.location && typeof classDetails.location === "object" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {classDetails.location.venueName || classDetails.location.city},{" "}
                        {classDetails.location.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                A confirmation email has been sent to {buyerEmail}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/my-classes">
                  <Button>View My Classes</Button>
                </Link>
                <Link href="/classes">
                  <Button variant="outline">Browse More Classes</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  // Main checkout form
  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/classes/${classId}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to class details
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Form - Left Side */}
            <div className="md:col-span-2 space-y-6">
              {/* Class Info Card */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  Enroll in Class
                </h1>
                <div className="flex gap-4">
                  {classDetails.imageUrl ? (
                    <img
                      src={classDetails.imageUrl}
                      alt={classDetails.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {classDetails.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {classDetails.organizerName}
                    </p>
                    {classDetails.startDate && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatEventDate(classDetails.startDate, classDetails.timezone)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Options */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Select Enrollment Option
                </h3>
                <div className="space-y-3">
                  {classDetails.enrollmentTiers.map((tier: EnrollmentTier) => (
                    <label
                      key={tier._id}
                      className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTierId === tier._id
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      } ${!tier.isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="enrollmentTier"
                            value={tier._id}
                            checked={selectedTierId === tier._id}
                            onChange={() => tier.isAvailable && setSelectedTierId(tier._id as Id<"ticketTiers">)}
                            disabled={!tier.isAvailable}
                            className="w-4 h-4 text-primary"
                          />
                          <div>
                            <p className="font-medium text-foreground">{tier.name}</p>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground">{tier.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatPrice(tier.priceCents)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tier.available} spots left
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Your Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="buyerName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="buyerName"
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerEmail" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="buyerEmail"
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Confirmation and class details will be sent to this email
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary - Right Side */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Order Summary
                </h3>

                {selectedTier ? (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{selectedTier.name}</span>
                        <span className="text-foreground">{formatPrice(selectedTier.priceCents)}</span>
                      </div>
                      {/* Show series info if available */}
                      {classDetails.numberOfSessions && classDetails.numberOfSessions > 1 ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Full Series ({classDetails.numberOfSessions} classes)
                          </span>
                          <span className="text-foreground">
                            {classDetails.classFrequency === "weekly" && "Weekly"}
                            {classDetails.classFrequency === "bi-weekly" && "Bi-weekly"}
                            {classDetails.classFrequency === "monthly" && "Monthly"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Single Class</span>
                          <span className="text-foreground">x 1</span>
                        </div>
                      )}
                      {/* Door price info */}
                      {classDetails.doorPriceCents != null && classDetails.doorPriceCents > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2">
                          Drop-in available at {formatPrice(classDetails.doorPriceCents)}/class (cash at door)
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-3 mb-6">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(subtotal)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleEnroll}
                      disabled={!buyerEmail || !buyerName || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : isFree ? (
                        "Complete Enrollment"
                      ) : (
                        `Pay ${formatPrice(subtotal)}`
                      )}
                    </Button>

                    {isFree && (
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        This is a free class. No payment required.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Select an enrollment option to continue
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
