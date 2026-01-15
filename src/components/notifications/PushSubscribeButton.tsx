"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface PushSubscribeButtonProps {
  staffId?: Id<"eventStaff">;
  userId?: Id<"users">;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

// Get the VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert a base64 string to a Uint8Array for the applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribeButton({
  staffId,
  userId,
  variant = "outline",
  size = "default",
  className,
}: PushSubscribeButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");

  const subscribe = useMutation(api.notifications.pushSubscriptions.subscribe);
  const unsubscribe = useMutation(api.notifications.pushSubscriptions.unsubscribe);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermissionState(Notification.permission);

        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Handle subscribe
  const handleSubscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast.error("Push notifications not configured");
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Get subscription keys
      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys as { p256dh: string; auth: string };

      // Store subscription in database
      await subscribe({
        staffId,
        userId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        },
        userAgent: navigator.userAgent,
        deviceType: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
      });

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Failed to enable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [staffId, userId, subscribe]);

  // Handle unsubscribe
  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from database
        await unsubscribe({
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      toast.error("Failed to disable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribe]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Show denied state
  if (permissionState === "denied") {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <BellOff className="h-4 w-4 mr-2" />
        Notifications Blocked
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4 mr-2 fill-current" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {isLoading
        ? "Loading..."
        : isSubscribed
          ? "Notifications On"
          : "Enable Notifications"}
    </Button>
  );
}
