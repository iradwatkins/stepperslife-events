"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Ticket,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

interface TicketDetail {
  tierId: Id<"ticketTiers">;
  tierName: string;
  quantity: number;
  price: number;
}

interface PendingOrder {
  _id: Id<"orders">;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  totalCents: number;
  ticketCount: number;
  createdAt: number;
  holdExpiresAt?: number;
  orderNumber?: string;
  tickets?: TicketDetail[];
  timeRemaining: number;
  isExpired: boolean;
  expiresIn: number;
}

export default function CashOrdersPage() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [activatingOrderId, setActivatingOrderId] = useState<Id<"orders"> | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{
    orderId: Id<"orders">;
    code: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get staff positions (to select which event to view)
  const staffPositions = useQuery(api.staff.queries.getStaffDashboard);

  // Get pending cash orders for selected event
  const pendingOrders = useQuery(
    api.orders.cashPayments.getPendingCashOrders,
    selectedEventId ? { eventId: selectedEventId } : "skip"
  ) as PendingOrder[] | undefined;

  // Mutations
  const approveCashOrder = useMutation(api.orders.cashPayments.approveCashOrder);
  const generateCode = useMutation(api.orders.cashPayments.generateCashActivationCode);

  // Auto-select first event if available
  useEffect(() => {
    if (staffPositions && staffPositions.length > 0 && !selectedEventId) {
      setSelectedEventId(staffPositions[0].event?._id as Id<"events">);
    }
  }, [staffPositions, selectedEventId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle approve order
  const handleApprove = async (orderId: Id<"orders">, staffId: Id<"eventStaff">) => {
    try {
      setActivatingOrderId(orderId);
      await approveCashOrder({ orderId, staffId });
      setActivatingOrderId(null);
    } catch (error: any) {
      toast.error(`Failed to approve order: ${error.message}`);
      setActivatingOrderId(null);
    }
  };

  // Handle generate activation code
  const handleGenerateCode = async (orderId: Id<"orders">, staffId: Id<"eventStaff">) => {
    try {
      const result = await generateCode({ orderId, staffId });
      setGeneratedCode({ orderId, code: result.activationCode });

      // Clear after 5 minutes
      setTimeout(
        () => {
          setGeneratedCode(null);
        },
        5 * 60 * 1000
      );
    } catch (error: any) {
      toast.error(`Failed to generate code: ${error.message}`);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (holdExpiresAt: number) => {
    const now = Date.now();
    const diff = holdExpiresAt - now;

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get color based on time remaining
  const getTimeColor = (holdExpiresAt: number) => {
    const now = Date.now();
    const diff = holdExpiresAt - now;
    const minutes = diff / 1000 / 60;

    if (minutes <= 5) return "text-destructive";
    if (minutes <= 15) return "text-warning";
    return "text-success";
  };

  if (staffPositions === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading cash orders...</p>
        </div>
      </div>
    );
  }

  if (!staffPositions || staffPositions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-warning/10 border border-warning rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-warning mb-2">No Staff Positions Found</h3>
          <p className="text-warning">You are not assigned to any events as staff.</p>
        </div>
      </div>
    );
  }

  // Find selected event details
  const selectedEvent = staffPositions.find((pos) => pos.event?._id === selectedEventId);
  const selectedStaffId = selectedEvent?._id as Id<"eventStaff"> | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cash Orders</h1>
            <p className="text-muted-foreground mt-1">Approve in-person cash payments</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Event Selector */}
        {staffPositions.length > 1 && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-foreground">Select Event:</label>
            <select
              value={selectedEventId || ""}
              onChange={(e) => setSelectedEventId(e.target.value as Id<"events">)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {staffPositions.map((pos) => (
                <option key={pos.event?._id} value={pos.event?._id}>
                  {pos.event?.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-accent border border-primary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">How Cash Orders Work:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Customers reserve tickets with a 30-minute hold</li>
                <li>
                  <strong>Instant Approval:</strong> Tap "Approve Order" after receiving cash
                </li>
                <li>
                  <strong>Activation Code:</strong> Generate a 4-digit code for the customer to
                  activate later
                </li>
                <li>Orders expire automatically if not approved within 30 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders List */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">
          Pending Cash Payments
          {pendingOrders && pendingOrders.length > 0 && (
            <span className="ml-2 text-warning">({pendingOrders.length})</span>
          )}
        </h2>

        {pendingOrders === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending cash orders</p>
            <p className="text-sm text-muted-foreground mt-1">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const isGeneratedCode = generatedCode?.orderId === order._id;
              const timeRemaining = order.holdExpiresAt ? getTimeRemaining(order.holdExpiresAt) : "Expired";
              const timeColor = order.holdExpiresAt ? getTimeColor(order.holdExpiresAt) : "text-destructive";

              return (
                <div
                  key={order._id}
                  className="bg-card border-2 border-warning rounded-lg p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{order.buyerName}</h3>
                        <span className="px-3 py-1 bg-warning/10 text-warning text-xs font-semibold rounded-full">
                          CASH PENDING
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {order.buyerPhone}
                        </div>
                        {order.buyerEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {order.buyerEmail}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(order.createdAt, "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        ${(order.totalCents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">{order.ticketCount} tickets</p>
                    </div>
                  </div>

                  {/* Time Remaining */}
                  <div className={`flex items-center gap-2 mb-4 font-semibold ${timeColor}`}>
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">
                      {timeRemaining === "Expired"
                        ? "⚠️ Expired"
                        : `Time remaining: ${timeRemaining}`}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Order Details:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <strong>Order #:</strong> {order.orderNumber}
                      </p>
                      {order.tickets && order.tickets.map((ticket: TicketDetail, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          <span>
                            {ticket.quantity}x {ticket.tierName} @ $
                            {(ticket.price / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generated Code Display */}
                  {isGeneratedCode && generatedCode && (
                    <div className="bg-success/10 border-2 border-success rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Key className="w-6 h-6 text-success" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-success mb-1">
                            Activation Code Generated
                          </p>
                          <p className="text-3xl font-mono font-bold text-success tracking-wider">
                            {generatedCode.code}
                          </p>
                          <p className="text-xs text-success mt-2">
                            Share this code with the customer to activate their tickets
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedStaffId && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleApprove(order._id, selectedStaffId)}
                        disabled={activatingOrderId === order._id}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                      >
                        {activatingOrderId === order._id ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Approve Order (Instant)
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(order._id, selectedStaffId)}
                        disabled={activatingOrderId === order._id || isGeneratedCode}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                      >
                        <Key className="w-5 h-5" />
                        {isGeneratedCode ? "Code Generated" : "Generate Code"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
