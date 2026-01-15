"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Gift,
  Users,
  Calendar,
  Ticket,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TicketDistributionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | "">("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<Id<"users"> | "">("");
  const [selectedTicketTierId, setSelectedTicketTierId] = useState<Id<"ticketTiers"> | "">("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const events = useQuery(
    api.events.queries.getOrganizerEvents,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );
  const teamMembers = useQuery(api.staff.queries.getGlobalStaffWithPerformance);
  const ticketTiers = useQuery(
    api.events.queries.getEventTicketTiers,
    selectedEventId ? { eventId: selectedEventId as Id<"events"> } : "skip"
  );
  const distributionHistory = useQuery(
    api.tickets.queries.getDistributionHistory,
    selectedEventId ? { eventId: selectedEventId as Id<"events"> } : {}
  );

  // Mutations
  const distributeTickets = useMutation(api.tickets.mutations.distributeTicketsToStaff);
  const revokeTicket = useMutation(api.tickets.mutations.revokeDistributedTicket);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId || !selectedTeamMemberId || !selectedTicketTierId) {
      toast.error("Please select an event, team member, and ticket type");
      return;
    }

    if (quantity < 1 || quantity > 10) {
      toast.error("Quantity must be between 1 and 10");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await distributeTickets({
        eventId: selectedEventId as Id<"events">,
        staffUserId: selectedTeamMemberId as Id<"users">,
        ticketTypeId: selectedTicketTierId as Id<"ticketTiers">,
        quantity,
        notes: notes || undefined,
      });

      toast.success(
        `Successfully distributed ${result.count} ticket${result.count > 1 ? "s" : ""} to ${result.recipientName}`
      );

      // Reset form
      setSelectedTeamMemberId("");
      setSelectedTicketTierId("");
      setQuantity(1);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to distribute tickets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeTicket = async (ticketId: Id<"tickets">) => {
    try {
      await revokeTicket({ ticketId });
      toast.success("Ticket revoked successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke ticket");
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Gift className="w-8 h-8" />
          Ticket Distribution
        </h1>
        <p className="text-muted-foreground mt-1">
          Distribute comp tickets to your team members working the event.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-accent border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-accent-foreground">
            <p className="font-semibold mb-1">About Comp Tickets:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Distributed tickets are free and do not count as sales</li>
              <li>Staff receives a valid ticket with QR code for event entry</li>
              <li>Maximum 10 tickets per distribution for safety</li>
              <li>You can revoke tickets that haven&apos;t been scanned yet</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Distribute Tickets
          </h2>

          <form onSubmit={handleDistribute} className="space-y-6">
            {/* Event Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedEventId}
                onValueChange={(value) => {
                  setSelectedEventId(value as Id<"events">);
                  setSelectedTicketTierId(""); // Reset ticket tier when event changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{event.name}</span>
                        {event.startDate && (
                          <span className="text-xs text-muted-foreground">
                            ({new Date(event.startDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Member Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Team Member <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedTeamMemberId}
                onValueChange={(value) => setSelectedTeamMemberId(value as Id<"users">)}
                disabled={!teamMembers || teamMembers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member._id} value={member.staffUserId}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{member.name}</span>
                        <span className="text-xs text-muted-foreground">({member.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  No team members found. Add team members first.
                </p>
              )}
            </div>

            {/* Ticket Type Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ticket Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedTicketTierId}
                onValueChange={(value) => setSelectedTicketTierId(value as Id<"ticketTiers">)}
                disabled={!selectedEventId || !ticketTiers || ticketTiers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  {ticketTiers?.map((tier) => (
                    <SelectItem key={tier._id} value={tier._id}>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                        <span>{tier.name}</span>
                        <span className="text-xs text-muted-foreground">
                          (${(tier.price / 100).toFixed(2)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEventId && (!ticketTiers || ticketTiers.length === 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  No ticket types found for this event.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantity <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum 10 tickets per distribution</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Door staff, Stage crew, VIP host..."
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedEventId || !selectedTeamMemberId || !selectedTicketTierId}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Distributing...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Distribute {quantity} Ticket{quantity > 1 ? "s" : ""}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Distribution History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Distribution History
          </h2>

          {!distributionHistory ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="Loading history..." />
            </div>
          ) : distributionHistory.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tickets have been distributed yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the form to distribute comp tickets to your team.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {distributionHistory.map((distribution) => (
                <div
                  key={distribution.bundleId}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {distribution.recipient?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {distribution.recipient?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {distribution.ticketCount} ticket{distribution.ticketCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">{distribution.event?.name || "Unknown Event"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Ticket className="w-4 h-4" />
                      <span>{distribution.tier?.name || "General"}</span>
                    </div>
                  </div>

                  {distribution.notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      &quot;{distribution.notes}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        {distribution.validCount} valid
                      </span>
                      {distribution.scannedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-primary" />
                          {distribution.scannedCount} scanned
                        </span>
                      )}
                      {distribution.cancelledCount > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-destructive" />
                          {distribution.cancelledCount} revoked
                        </span>
                      )}
                    </div>
                    <span>{formatDate(distribution.createdAt)}</span>
                  </div>

                  {/* Individual tickets with revoke buttons */}
                  {distribution.validCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Active Tickets:
                      </p>
                      <div className="space-y-2">
                        {distribution.tickets
                          .filter((t) => t.status === "VALID")
                          .map((ticket) => (
                            <div
                              key={ticket._id}
                              className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                            >
                              <span className="font-mono">{ticket.ticketCode}</span>
                              <button
                                type="button"
                                onClick={() => handleRevokeTicket(ticket._id as Id<"tickets">)}
                                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                                title="Revoke ticket"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
