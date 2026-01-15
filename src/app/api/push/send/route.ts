import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@stepperslife.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    tag?: string;
    requireInteraction?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("VAPID keys not configured");
      return NextResponse.json(
        { success: false, error: "Push notifications not configured" },
        { status: 500 }
      );
    }

    const body: PushPayload = await request.json();
    const { subscription, notification } = body;

    // Validate required fields
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    if (!notification?.title || !notification?.body) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Build push subscription object
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    // Build notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: notification.badge || "/icons/badge-72x72.png",
      data: notification.data || {},
      tag: notification.tag,
      requireInteraction: notification.requireInteraction ?? false,
    });

    // Send the push notification
    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Push notification error:", error);

    // Handle specific web-push errors
    if (error && typeof error === "object" && "statusCode" in error) {
      const webPushError = error as { statusCode: number; body?: string };

      // 410 Gone - subscription expired or unsubscribed
      if (webPushError.statusCode === 410) {
        return NextResponse.json(
          { success: false, error: "Subscription expired", expired: true },
          { status: 410 }
        );
      }

      // 404 Not Found - subscription invalid
      if (webPushError.statusCode === 404) {
        return NextResponse.json(
          { success: false, error: "Subscription not found", expired: true },
          { status: 404 }
        );
      }

      // 429 Too Many Requests - rate limited
      if (webPushError.statusCode === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limited by push service" },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to send push notification" },
      { status: 500 }
    );
  }
}

// GET endpoint to check configuration status
export async function GET() {
  return NextResponse.json({
    configured: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    publicKey: VAPID_PUBLIC_KEY || null,
  });
}
