"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  ShoppingCart,
  Calendar,
  Ticket,
  GraduationCap,
  Wallet,
  Star,
  MessageSquare,
  Settings,
  Gift,
  Loader2,
} from "lucide-react";

const CATEGORY_CONFIG = {
  order: {
    label: "Order Updates",
    description: "Order confirmations and status updates",
    icon: ShoppingCart,
  },
  event: {
    label: "Event Reminders",
    description: "Event reminders and schedule changes",
    icon: Calendar,
  },
  ticket: {
    label: "Ticket Notifications",
    description: "Ticket purchases and transfer notifications",
    icon: Ticket,
  },
  class: {
    label: "Class Updates",
    description: "Class schedule and reminder notifications",
    icon: GraduationCap,
  },
  payout: {
    label: "Payout Alerts",
    description: "Payout and earnings notifications",
    icon: Wallet,
  },
  review: {
    label: "Reviews",
    description: "Review requests and responses",
    icon: Star,
  },
  message: {
    label: "Messages",
    description: "Direct messages from organizers or attendees",
    icon: MessageSquare,
  },
  system: {
    label: "System Updates",
    description: "Platform updates and announcements",
    icon: Settings,
  },
  promotion: {
    label: "Promotions",
    description: "Promotional offers and discounts",
    icon: Gift,
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

// Expected preferences type
interface NotificationPreferences {
  enablePush: boolean;
  enableEmail: boolean;
  categories: Record<CategoryKey, boolean>;
}

// Note: After running `npx convex dev`, update these imports to:
// import { api } from "@/../convex/_generated/api";
// And use api.notificationPreferences.queries.getMyNotificationPreferences directly

// For now, using type assertions until API is regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPreferencesQuery = (api as any)?.notificationPreferences?.queries?.getMyNotificationPreferences;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const savePrefsMutation = (api as any)?.notificationPreferences?.mutations?.saveNotificationPreferences;

export function NotificationPreferencesPanel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPreferences = useQuery(getPreferencesQuery as any);
  const preferences = rawPreferences as NotificationPreferences | null | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savePreferencesMutation = useMutation(savePrefsMutation || ((() => {}) as any));

  const savePreferences = async (args: NotificationPreferences) => {
    if (!savePrefsMutation) {
      toast.error("Please run 'npx convex dev' to regenerate API types");
      return;
    }
    await savePreferencesMutation(args);
  };

  const [localPrefs, setLocalPrefs] = useState<{
    enablePush: boolean;
    enableEmail: boolean;
    categories: Record<CategoryKey, boolean>;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when preferences load
  useEffect(() => {
    if (preferences && !localPrefs) {
      setLocalPrefs({
        enablePush: preferences.enablePush,
        enableEmail: preferences.enableEmail,
        categories: preferences.categories as Record<CategoryKey, boolean>,
      });
    }
  }, [preferences, localPrefs]);

  // Track changes
  useEffect(() => {
    if (localPrefs && preferences) {
      const hasChanged =
        localPrefs.enablePush !== preferences.enablePush ||
        localPrefs.enableEmail !== preferences.enableEmail ||
        Object.keys(CATEGORY_CONFIG).some(
          (key) =>
            localPrefs.categories[key as CategoryKey] !==
            preferences.categories[key as CategoryKey]
        );
      setHasChanges(hasChanged);
    }
  }, [localPrefs, preferences]);

  if (preferences === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences || !localPrefs) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please sign in to manage notification preferences.
      </div>
    );
  }

  const handleMasterToggle = (type: "push" | "email", enabled: boolean) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev;
      return type === "push"
        ? { ...prev, enablePush: enabled }
        : { ...prev, enableEmail: enabled };
    });
  };

  const handleCategoryToggle = (category: CategoryKey, enabled: boolean) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: enabled,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!localPrefs) return;

    setSaving(true);
    try {
      await savePreferences({
        enablePush: localPrefs.enablePush,
        enableEmail: localPrefs.enableEmail,
        categories: localPrefs.categories,
      });
      toast.success("Notification preferences saved");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save preferences");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your browser
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enablePush}
              onCheckedChange={(checked) => handleMasterToggle("push", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={localPrefs.enableEmail}
              onCheckedChange={(checked) => handleMasterToggle("email", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(CATEGORY_CONFIG) as [CategoryKey, typeof CATEGORY_CONFIG[CategoryKey]][]).map(
            ([key, config]) => {
              const Icon = config.icon;
              const isDisabled = !localPrefs.enablePush && !localPrefs.enableEmail;

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={localPrefs.categories[key]}
                    onCheckedChange={(checked) => handleCategoryToggle(key, checked)}
                    disabled={isDisabled}
                  />
                </div>
              );
            }
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
