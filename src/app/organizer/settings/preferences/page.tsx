"use client";

import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function PreferencesSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Manage how and when you receive notifications
        </p>
      </div>

      <NotificationPreferencesPanel />
    </div>
  );
}
