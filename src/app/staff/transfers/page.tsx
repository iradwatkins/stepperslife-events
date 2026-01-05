"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Package,
} from "lucide-react";
import { format } from "date-fns";

export default function StaffTransfersPage() {
  const [selectedEvent, setSelectedEvent] = useState<Id<"events"> | null>(null);
  const [showNewTransferDialog, setShowNewTransferDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Id<"eventStaff"> | null>(null);
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Queries
  const myTransfers = useQuery(api.staff.transfers.getMyTransfers, {
    eventId: selectedEvent || undefined,
    type: selectedTab as "sent" | "received" | "all",
  });

  const pendingCounts = useQuery(api.staff.transfers.getPendingTransfers, {});
  const availableRecipients = useQuery(
    api.staff.transfers.getAvailableRecipients,
    selectedEvent ? { eventId: selectedEvent } : "skip"
  );

  // Get user's events (where they are staff)
  const myStaffEvents = useQuery(api.staff.queries.getStaffEvents, {});

  // Mutations
  const requestTransfer = useMutation(api.staff.transfers.requestTransfer);
  const acceptTransfer = useMutation(api.staff.transfers.acceptTransfer);
  const rejectTransfer = useMutation(api.staff.transfers.rejectTransfer);
  const cancelTransfer = useMutation(api.staff.transfers.cancelTransfer);

  // Get current user's balance for selected event
  const myStaffRecord = myStaffEvents?.find((e) => e.eventId === selectedEvent);
  const myBalance = myStaffRecord?.allocatedTickets || 0;

  const handleRequestTransfer = async () => {
    if (!selectedEvent || !selectedRecipient || !transferQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantity = parseInt(transferQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (quantity > myBalance) {
      toast.error(`You only have ${myBalance} tickets available`);
      return;
    }

    try {
      const result = await requestTransfer({
        eventId: selectedEvent,
        toStaffId: selectedRecipient,
        ticketQuantity: quantity,
        reason: transferReason || undefined,
        notes: transferNotes || undefined,
      });

      toast.success(result.message);
      setShowNewTransferDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAcceptTransfer = async (transferId: Id<"staffTicketTransfers">) => {
    try {
      const result = await acceptTransfer({ transferId });
      toast.success(
        `Received ${result.ticketsReceived} tickets. New balance: ${result.newBalance}`
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRejectTransfer = async (transferId: Id<"staffTicketTransfers">, reason?: string) => {
    try {
      await rejectTransfer({ transferId, reason });
      toast.success("Transfer rejected");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelTransfer = async (transferId: Id<"staffTicketTransfers">) => {
    try {
      await cancelTransfer({ transferId });
      toast.success("Transfer cancelled");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setSelectedRecipient(null);
    setTransferQuantity("");
    setTransferReason("");
    setTransferNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-warning/10">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-muted">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "AUTO_EXPIRED":
        return (
          <Badge variant="outline" className="bg-muted">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ticket Transfers</h1>
        {selectedEvent && myBalance > 0 && (
          <Button onClick={() => setShowNewTransferDialog(true)}>
            <Package className="w-4 h-4 mr-2" />
            New Transfer
          </Button>
        )}
      </div>

      {/* Event Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose an event to manage ticket transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedEvent || ""}
            onValueChange={(value) => setSelectedEvent(value as Id<"events">)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {myStaffEvents?.map((event) => (
                <SelectItem key={event.eventId} value={event.eventId}>
                  <div className="flex justify-between items-center w-full">
                    <span>{event.eventName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {event.allocatedTickets || 0} tickets
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEvent && myStaffRecord && (
            <div className="mt-4 p-4 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-primary" />
                  <span className="font-medium">Your Balance:</span>
                </div>
                <span className="text-xl font-bold text-primary">{myBalance} tickets</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <span>Sold: {myStaffRecord.ticketsSold || 0}</span>
                <span className="mx-2">•</span>
                <span>Available: {myBalance - (myStaffRecord.ticketsSold || 0)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfers Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>
            {pendingCounts && (
              <div className="flex gap-4 mt-2">
                {pendingCounts.incoming > 0 && (
                  <Badge variant="default">{pendingCounts.incoming} incoming pending</Badge>
                )}
                {pendingCounts.outgoing > 0 && (
                  <Badge variant="outline">{pendingCounts.outgoing} outgoing pending</Badge>
                )}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="received">
                <ArrowDownLeft className="w-4 h-4 mr-1" />
                Received
              </TabsTrigger>
              <TabsTrigger value="sent">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Sent
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                {myTransfers?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No transfers found</div>
                ) : (
                  myTransfers?.map((transfer) => (
                    <div
                      key={transfer._id}
                      className="border rounded-lg p-4 hover:bg-muted transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {transfer.direction === "sent" ? (
                              <ArrowUpRight className="w-4 h-4 text-destructive" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4 text-success" />
                            )}
                            <span className="font-medium">
                              {transfer.direction === "sent"
                                ? `To: ${transfer.toName}`
                                : `From: ${transfer.fromName}`}
                            </span>
                            {getStatusBadge(transfer.status)}
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">{transfer.ticketQuantity} tickets</span>
                              <span className="mx-2">•</span>
                              <span>{transfer.eventName}</span>
                            </div>
                            {transfer.reason && <div>Reason: {transfer.reason}</div>}
                            {transfer.notes && (
                              <div className="italic">Notes: {transfer.notes}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Requested:{" "}
                              {format(new Date(transfer.requestedAt), "MMM d, yyyy h:mm a")}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {transfer.status === "PENDING" && transfer.direction === "received" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptTransfer(transfer._id)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectTransfer(transfer._id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {transfer.status === "PENDING" && transfer.direction === "sent" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelTransfer(transfer._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Transfer Dialog */}
      <Dialog open={showNewTransferDialog} onOpenChange={setShowNewTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Tickets</DialogTitle>
            <DialogDescription>
              Send tickets to another staff member for this event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipient Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Recipient</label>
              <Select
                value={selectedRecipient || ""}
                onValueChange={(value) => setSelectedRecipient(value as Id<"eventStaff">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {availableRecipients?.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-muted-foreground">{staff.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={staff.role === "STAFF" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {staff.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {staff.allocatedTickets || 0} tickets
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Show recipient's current balance after selection */}
              {selectedRecipient &&
                availableRecipients &&
                (() => {
                  const recipient = availableRecipients.find((s) => s._id === selectedRecipient);
                  const recipientBalance = recipient?.allocatedTickets || 0;
                  const transferQty = parseInt(transferQuantity) || 0;
                  const newRecipientBalance = recipientBalance + transferQty;

                  return (
                    <div className="mt-3 p-3 bg-accent rounded-lg border border-border">
                      <div className="text-sm font-medium text-foreground mb-2">
                        Recipient Balance Preview
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary">Current Balance:</span>
                        <span className="font-semibold text-foreground">
                          {recipientBalance} tickets
                        </span>
                      </div>
                      {transferQty > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-primary">After Transfer:</span>
                          <span className="font-bold text-success">
                            {newRecipientBalance} tickets
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity (Max: {myBalance})</label>
              <Input
                type="number"
                min="1"
                max={myBalance}
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                placeholder="Number of tickets to transfer"
              />

              {/* Your balance after transfer */}
              {transferQuantity && parseInt(transferQuantity) > 0 && (
                <div className="mt-2 p-2 bg-warning/10 rounded border border-warning">
                  <div className="text-xs font-medium text-warning mb-1">
                    Your Balance After Transfer
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warning">Current:</span>
                    <span className="font-semibold">{myBalance} tickets</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warning">After:</span>
                    <span
                      className={`font-bold ${myBalance - parseInt(transferQuantity) < 10 ? "text-destructive" : "text-warning"}`}
                    >
                      {myBalance - parseInt(transferQuantity)} tickets
                      {myBalance - parseInt(transferQuantity) < 10 && " ⚠️"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
              <Input
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g., Need more tickets for weekend sales"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <Textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Any additional notes for the recipient"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestTransfer}>Send Transfer Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
