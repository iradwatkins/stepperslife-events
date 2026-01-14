"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettlementDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | undefined>();
  const [expandedStaffId, setExpandedStaffId] = useState<Id<"eventStaff"> | null>(null);

  const settlement = useQuery(
    api.staff.settlement.getOrganizerSettlement,
    selectedEventId ? { eventId: selectedEventId } : {}
  );

  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const organizerEvents = useQuery(
    api.events.queries.getOrganizerEvents,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const markPaid = useMutation(api.staff.settlement.markSettlementPaid);
  const markPending = useMutation(api.staff.settlement.markSettlementPending);

  if (!settlement || !organizerEvents) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleMarkPaid = async (staffId: Id<"eventStaff">) => {
    try {
      await markPaid({ staffId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark as paid");
    }
  };

  const handleMarkPending = async (staffId: Id<"eventStaff">) => {
    try {
      await markPending({ staffId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark as pending");
    }
  };

  const exportToCSV = () => {
    const csv = [
      [
        "Staff Name",
        "Event",
        "Tickets Sold",
        "Commission Earned",
        "Cash Collected",
        "Net Settlement",
        "Status",
      ],
      ...settlement.settlements.map((s) => [
        s.staffName,
        s.eventName,
        s.totalTickets,
        `$${(s.commissionEarned / 100).toFixed(2)}`,
        `$${(s.cashCollected / 100).toFixed(2)}`,
        `$${(Math.abs(s.netSettlement) / 100).toFixed(2)} ${s.netSettlement > 0 ? "(Owed to staff)" : s.netSettlement < 0 ? "(Owed by staff)" : ""}`,
        s.settlementStatus,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Staff Settlement</h1>
        <p className="text-muted-foreground mt-1">Manage payments and reconciliation with your staff</p>
      </div>

      {/* Event Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="text-sm font-medium text-foreground">Filter by Event:</label>
        <select
          value={selectedEventId || "all"}
          onChange={(e) =>
            setSelectedEventId(
              e.target.value === "all" ? undefined : (e.target.value as Id<"events">)
            )
          }
          className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Events</option>
          {organizerEvents.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={exportToCSV}
          className="ml-auto px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {settlement.summary.activeStaff}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              / {settlement.summary.totalStaff}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${(settlement.summary.totalCommissionEarned / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Owed to Staff</p>
            <TrendingUp className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-destructive">
            ${(settlement.summary.totalOwedToStaff / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Owed by Staff</p>
            <TrendingDown className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-success">
            ${(settlement.summary.totalOwedByStaff / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Settlement List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted">
          <h2 className="text-lg font-semibold text-foreground">Staff Members</h2>
        </div>

        <div className="divide-y divide-border">
          {settlement.settlements.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p>No staff members found for the selected event</p>
            </div>
          ) : (
            settlement.settlements.map((staff) => (
              <div key={staff.staffId} className="px-6 py-4 hover:bg-muted transition-colors">
                {/* Staff Row */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">{staff.staffName}</h3>
                      {!staff.isActive && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                      {staff.hierarchyLevel && staff.hierarchyLevel > 1 && (
                        <span className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
                          Level {staff.hierarchyLevel} Sub-Seller
                        </span>
                      )}
                      {staff.settlementStatus === "PAID" ? (
                        <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {staff.eventName} • {staff.staffEmail}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tickets Sold:</span>
                        <span className="font-semibold text-foreground ml-2">
                          {staff.totalTickets}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commission:</span>
                        <span className="font-semibold text-success ml-2">
                          ${(staff.commissionEarned / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cash Collected:</span>
                        <span className="font-semibold text-primary ml-2">
                          ${(staff.cashCollected / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Settlement */}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Net Settlement</p>
                    {staff.netSettlement === 0 ? (
                      <p className="text-2xl font-bold text-muted-foreground">$0.00</p>
                    ) : staff.netSettlement > 0 ? (
                      <div>
                        <p className="text-2xl font-bold text-destructive">
                          ${(staff.netSettlement / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">You owe staff</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-success">
                          ${(Math.abs(staff.netSettlement) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Staff owes you</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      {staff.settlementStatus === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(staff.staffId)}
                          className="px-3 py-1 bg-success text-white text-sm rounded hover:bg-success/90 transition-colors"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkPending(staff.staffId)}
                          className="px-3 py-1 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                        >
                          Mark Unpaid
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStaffId(
                            expandedStaffId === staff.staffId ? null : staff.staffId
                          )
                        }
                        className="px-3 py-1 border border-border text-foreground text-sm rounded hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        Details
                        {expandedStaffId === staff.staffId ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStaffId === staff.staffId && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Commission Type</p>
                        <p className="font-semibold text-foreground">
                          {staff.commissionType === "PERCENTAGE"
                            ? `${staff.commissionValue}%`
                            : `$${(staff.commissionValue || 0) / 100}/ticket`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cash Sales</p>
                        <p className="font-semibold text-foreground">{staff.cashSalesCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Credit Sales</p>
                        <p className="font-semibold text-foreground">{staff.creditSalesCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Referral Code</p>
                        <p className="font-mono font-semibold text-foreground text-xs">
                          {staff.staffId}
                        </p>
                      </div>
                    </div>

                    {staff.settlementPaidAt && (
                      <div className="mt-3 p-3 bg-success/10 rounded-lg">
                        <p className="text-sm text-success">
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          Marked as paid on {new Date(staff.settlementPaidAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-accent border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">How Settlement Works</h3>
            <ul className="text-sm text-accent-foreground space-y-1">
              <li>
                • <strong>Commission Earned:</strong> Total commission from all ticket sales (cash +
                credit)
              </li>
              <li>
                • <strong>Cash Collected:</strong> Total cash received by staff for cash sales
              </li>
              <li>
                • <strong>Net Settlement = Commission - Cash Collected</strong>
              </li>
              <li>• If positive (red): You owe the staff member money</li>
              <li>• If negative (green): The staff member owes you money</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
