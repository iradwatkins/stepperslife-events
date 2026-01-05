"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DollarSign, Bell, Check, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function StaffSettingsPage() {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [acceptCash, setAcceptCash] = useState(false);
  const [notifyOnCashOrders, setNotifyOnCashOrders] = useState(true);
  const [notifyOnOnlineSales, setNotifyOnOnlineSales] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get staff positions - using getStaffEvents which returns eventId, eventName, staffId
  const staffPositions = useQuery(api.staff.queries.getStaffEvents);

  // Get staff member details
  const staffMember = useQuery(
    api.staff.queries.getStaffMember,
    selectedEventId && staffPositions && staffPositions.length > 0
      ? {
          staffId: staffPositions.find((pos) => pos.eventId === selectedEventId)
            ?.staffId as Id<"eventStaff">,
        }
      : "skip"
  );

  // Mutations
  const updateStaffCashSettings = useMutation(api.staff.mutations.updateCashSettings);
  const updateNotificationPreferences = useMutation(api.notifications.pushSubscriptions.updatePreferences);

  // Get notification preferences for current staff
  const notificationPrefs = useQuery(
    api.notifications.pushSubscriptions.getStaffPreferences,
    selectedEventId && staffPositions && staffPositions.length > 0
      ? {
          staffId: staffPositions.find((pos) => pos.eventId === selectedEventId)
            ?.staffId as Id<"eventStaff">,
        }
      : "skip"
  );

  // Auto-select first event if available
  useEffect(() => {
    if (staffPositions && staffPositions.length > 0 && !selectedEventId) {
      setSelectedEventId(staffPositions[0].eventId as Id<"events">);
    }
  }, [staffPositions, selectedEventId]);

  // Initialize state from staff member data
  useEffect(() => {
    if (staffMember) {
      setAcceptCash(staffMember.acceptCashInPerson ?? false);
    }
  }, [staffMember]);

  // Initialize notification preferences from query
  useEffect(() => {
    if (notificationPrefs) {
      setNotifyOnCashOrders(notificationPrefs.notifyOnCashOrders);
      setNotifyOnOnlineSales(notificationPrefs.notifyOnOnlineSales);
    }
  }, [notificationPrefs]);

  const handleSave = async () => {
    if (!selectedEventId || !staffPositions) return;

    const selectedPosition = staffPositions.find((pos) => pos.eventId === selectedEventId);
    if (!selectedPosition) return;

    setIsSaving(true);
    try {
      // Save cash settings
      await updateStaffCashSettings({
        staffId: selectedPosition.staffId as Id<"eventStaff">,
        acceptCashInPerson: acceptCash,
      });

      // Save notification preferences
      await updateNotificationPreferences({
        staffId: selectedPosition.staffId as Id<"eventStaff">,
        notifyOnCashOrders,
        notifyOnOnlineSales,
      });

      toast.success("Settings saved successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save settings: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (staffPositions === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!staffPositions || staffPositions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-warning mb-2">No Staff Positions Found</h3>
          <p className="text-warning-foreground">You are not assigned to any events as staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Staff Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your payment acceptance and notification preferences</p>
      </div>

      {/* Event Selector */}
      {staffPositions.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">Select Event:</label>
          <select
            value={selectedEventId || ""}
            onChange={(e) => setSelectedEventId(e.target.value as Id<"events">)}
            className="w-full px-4 py-3 border border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
          >
            {staffPositions.map((pos) => (
              <option key={pos.eventId} value={pos.eventId}>
                {pos.eventName} - {pos.role}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Payment Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Payment Settings</h2>
        </div>

        <div className="space-y-4">
          {/* Accept Cash In-Person */}
          <div className="flex items-start justify-between p-4 border border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Accept Cash In-Person</h3>
              <p className="text-sm text-muted-foreground">
                Enable this to receive and approve cash payment requests from customers. You'll be
                notified when a customer wants to pay cash.
              </p>
              <div className="bg-accent border border-primary/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-foreground">
                  <strong>How it works:</strong> Customers can reserve tickets with a 30-minute
                  hold. You'll receive a notification and can approve the order instantly or
                  generate a 4-digit activation code for the customer.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={acceptCash}
                onChange={(e) => setAcceptCash(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Push Notifications</h2>
        </div>

        <div className="bg-accent border border-primary/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-foreground">
            <strong>Enable browser notifications</strong> to receive real-time alerts when customers
            make purchases or cash payment requests. You'll need to grant permission when prompted.
          </p>
        </div>

        <div className="space-y-4">
          {/* Cash Orders */}
          <div className="flex items-start justify-between p-4 border border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Cash Payment Requests</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when a customer creates a cash payment order that needs your approval
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={notifyOnCashOrders}
                onChange={(e) => setNotifyOnCashOrders(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Online Sales */}
          <div className="flex items-start justify-between p-4 border border rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Online Ticket Sales</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when someone purchases tickets using your referral link
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={notifyOnOnlineSales}
                onChange={(e) => setNotifyOnOnlineSales(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
        >
          {isSaving ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
