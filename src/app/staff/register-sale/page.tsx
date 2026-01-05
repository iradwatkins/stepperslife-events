"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, DollarSign, CheckCircle2, Ticket, CreditCard, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterSalePage() {
  const [selectedStaffId, setSelectedStaffId] = useState<Id<"eventStaff"> | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<Id<"ticketTiers"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CASH_APP">("CASH");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    success: boolean;
    orderId: Id<"orders">;
    ticketIds: Id<"tickets">[];
    activationCodes: string[];
    totalPrice: number;
    commission: number;
  } | null>(null);

  const staffPositions = useQuery(api.staff.queries.getStaffDashboard);
  const eventDetails = useQuery(
    api.public.queries.getPublicEventDetails,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  );

  const createCashSale = useMutation(api.staff.mutations.createCashSale);

  if (!staffPositions) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const selectedPosition = staffPositions.find((p) => p._id === selectedStaffId);
  const selectedTier = eventDetails?.ticketTiers?.find((t) => t._id === selectedTierId);

  const handleSubmit = async () => {
    if (!selectedStaffId || !selectedEventId || !selectedTierId || !buyerName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createCashSale({
        staffId: selectedStaffId,
        eventId: selectedEventId,
        ticketTierId: selectedTierId,
        quantity,
        buyerName,
        buyerEmail: buyerEmail || undefined,
        paymentMethod,
      });

      setSuccessData(result);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Cash sale error:", error);
      toast.error(error.message || "Failed to register sale");
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSuccessData(null);
    setBuyerName("");
    setBuyerEmail("");
    setQuantity(1);
    setSelectedTierId(null);
  };

  if (isSuccess && successData) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Sale Registered!</h2>
          <p className="text-muted-foreground mb-6">
            {quantity} ticket{quantity > 1 ? "s" : ""} sold successfully
          </p>

          {/* ACTIVATION CODES - Most Important Section */}
          {successData.activationCodes && successData.activationCodes.length > 0 && (
            <div className="bg-accent border-2 border-primary rounded-lg p-6 mb-6">
              <div className="bg-warning/20 border border-warning rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-warning mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-foreground">
                    <p className="font-semibold mb-1">
                      IMPORTANT: Customer Must Receive These Codes!
                    </p>
                    <p>
                      These are temporary activation codes. Customers need them to claim their
                      tickets online.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3">Customer Activation Codes</h3>
              <p className="text-sm text-foreground mb-4">
                Write these codes on the receipt or text them to the customer:
              </p>

              <div className="space-y-3">
                {successData.activationCodes.map((code: string, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-2 border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Ticket {index + 1} of {successData.activationCodes.length}
                    </div>
                    <div className="text-5xl font-bold tracking-widest text-primary font-mono">
                      {code}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-white rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Instructions for Customer:
                </p>
                <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
                  <li>
                    Visit{" "}
                    <span className="font-mono font-semibold text-primary">
                      events.stepperslife.com/activate
                    </span>
                  </li>
                  <li>Enter your 4-digit activation code</li>
                  <li>Provide your email address</li>
                  <li>Receive your official QR code ticket via email</li>
                </ol>
                <div className="mt-3 p-2 bg-card rounded text-xs text-muted-foreground">
                  <strong>Note:</strong> Each code can only be used once. The customer will receive
                  their permanent QR ticket after activation.
                </div>
              </div>
            </div>
          )}

          {/* Sale Details */}
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">${(successData.totalPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Commission:</span>
                <span className="font-bold text-success">
                  ${(successData.commission / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Register Another Sale
            </button>
            <Link
              href="/staff/dashboard"
              className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Register Cash Sale</h1>
        <p className="text-muted-foreground mt-1">Record an in-person ticket sale</p>
      </div>

      <div>
        <div className="space-y-6">
          {/* Select Staff Position */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-foreground mb-4">Select Your Position</h3>
            <div className="space-y-3">
              {staffPositions
                .filter((p) => p.event && (p.event as any).eventType !== "CLASS")
                .map((position) => (
                  <button
                    type="button"
                    key={position._id}
                    onClick={() => {
                      setSelectedStaffId(position._id);
                      setSelectedEventId(position.event!._id);
                      setSelectedTierId(null);
                    }}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedStaffId === position._id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{position.event!.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {position.ticketsSold} sold • ${(position.commissionEarned / 100).toFixed(2)}{" "}
                      earned
                    </p>
                  </button>
                ))}
              {staffPositions.filter((p) => p.event && (p.event as any).eventType !== "CLASS").length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No events available. Classes are managed separately.
                </p>
              )}
            </div>
          </div>

          {/* Select Ticket Tier */}
          {selectedEventId && eventDetails && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-foreground mb-4">Select Ticket Type</h3>
              <div className="space-y-3">
                {eventDetails.ticketTiers?.map((tier) => (
                  <button
                    type="button"
                    key={tier._id}
                    onClick={() => setSelectedTierId(tier._id)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      selectedTierId === tier._id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{tier.name}</p>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        ${(tier.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {selectedTierId && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-foreground mb-4">Quantity</h3>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Buyer Info */}
          {selectedTierId && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-foreground mb-4">Buyer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {selectedTierId && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === "CASH"
                      ? "border-success bg-success/10"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <p className="font-semibold text-foreground">Cash</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH_APP")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === "CASH_APP"
                      ? "border-success bg-success/10"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <Wallet className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <p className="font-semibold text-foreground">Cash App</p>
                </button>
              </div>
            </div>
          )}

          {/* Summary and Submit */}
          {selectedTier && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Sale Summary
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedTier.name} x {quantity}
                  </span>
                  <span className="font-medium">
                    ${((selectedTier.price * quantity) / 100).toFixed(2)}
                  </span>
                </div>
                {selectedPosition && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Commission</span>
                    <span className="font-medium text-success">
                      {selectedPosition.commissionType === "PERCENTAGE"
                        ? `${selectedPosition.commissionValue}%`
                        : `$${((selectedPosition.commissionValue || 0) / 100).toFixed(2)}/ticket`}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">
                      ${((selectedTier.price * quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Box - What Happens Next */}
              <div className="bg-accent border border-border rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                  <div className="text-sm text-accent-foreground">
                    <p className="font-medium mb-1">What happens after you register this sale:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>System generates activation codes for each ticket</li>
                      <li>You give these codes to the customer</li>
                      <li>Customer activates tickets online using the codes</li>
                      <li>Customer receives QR ticket via email</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!buyerName}
                className={`w-full px-6 py-4 rounded-lg font-semibold transition-all ${
                  buyerName
                    ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Register Sale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
