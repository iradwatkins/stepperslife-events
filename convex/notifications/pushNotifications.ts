/**
 * Push Notification Sender
 * Sends PWA push notifications to staff for cash orders and online sales
 */

import { v } from "convex/values";
import { action, internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// Get the base URL for API calls
const getBaseUrl = () => {
  // In production, use the actual domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback to production URL
  return "https://stepperslife.com";
};

/**
 * Send push notification to staff about new cash order
 * Called from createCashOrder mutation
 */
export const notifyNewCashOrder = action({
  args: {
    orderId: v.id("orders"),
    eventId: v.id("events"),
    buyerName: v.string(),
    totalCents: v.number(),
  },
  handler: async (ctx, args) => {

    // Get event to find staff - use runMutation since getEventStaff is a mutation
    const event = await ctx.runMutation(internal.notifications.pushNotifications.getEventStaff, {
      eventId: args.eventId,
    });

    if (!event || !event.staffIds || event.staffIds.length === 0) {
      return { success: true, sent: 0 };
    }

    const totalDollars = (args.totalCents / 100).toFixed(2);
    const title = "💵 New Cash Order";
    const body = `${args.buyerName} wants to pay $${totalDollars} cash. Tap to approve.`;

    let sentCount = 0;

    // Send notification to all staff with cash acceptance enabled
    for (const staffId of event.staffIds) {
      const result = await ctx.runMutation(internal.notifications.pushNotifications.sendToStaff, {
        staffId,
        type: "CASH_ORDER",
        title,
        body,
        orderId: args.orderId,
        eventId: args.eventId,
        notificationType: "CASH_ORDER",
      });

      if (result.success) {
        sentCount += result.sent;
      }
    }


    return {
      success: true,
      sent: sentCount,
    };
  },
});

/**
 * Send push notification to staff about online ticket sale via their referral
 * Called when order is completed and has soldByStaffId
 */
export const notifyOnlineTicketSale = action({
  args: {
    orderId: v.id("orders"),
    eventId: v.id("events"),
    staffId: v.id("eventStaff"),
    buyerName: v.string(),
    totalCents: v.number(),
    ticketCount: v.number(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; sent: number }> => {

    const totalDollars = (args.totalCents / 100).toFixed(2);
    const ticketText = args.ticketCount === 1 ? "ticket" : "tickets";
    const title = "🎉 You Made a Sale!";
    const body = `${args.buyerName} bought ${args.ticketCount} ${ticketText} for $${totalDollars}`;

    const result = await ctx.runMutation(internal.notifications.pushNotifications.sendToStaff, {
      staffId: args.staffId,
      type: "ONLINE_SALE",
      title,
      body,
      orderId: args.orderId,
      eventId: args.eventId,
      notificationType: "ONLINE_SALE",
    });


    return {
      success: true,
      sent: result.sent,
    };
  },
});

/**
 * Internal query: Get event staff IDs
 */
export const getEventStaff = internalMutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get all staff for event with cash acceptance enabled
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("acceptCashInPerson"), true))
      .collect();

    return {
      staffIds: staff.map((s) => s._id),
    };
  },
});

/**
 * Internal mutation: Send notification to specific staff member
 * This is where the actual web-push sending happens
 */
export const sendToStaff = internalMutation({
  args: {
    staffId: v.id("eventStaff"),
    type: v.union(v.literal("CASH_ORDER"), v.literal("ONLINE_SALE")),
    title: v.string(),
    body: v.string(),
    orderId: v.optional(v.id("orders")),
    eventId: v.optional(v.id("events")),
    notificationType: v.union(v.literal("CASH_ORDER"), v.literal("ONLINE_SALE")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get active subscriptions for staff with correct notification preference
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by notification preference
    const enabledSubscriptions = subscriptions.filter((sub) => {
      if (args.notificationType === "CASH_ORDER") {
        return sub.notifyOnCashOrders !== false;
      } else if (args.notificationType === "ONLINE_SALE") {
        return sub.notifyOnOnlineSales !== false;
      }
      return true;
    });

    if (enabledSubscriptions.length === 0) {
      return { success: true, sent: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Schedule push delivery for each subscription
    for (const sub of enabledSubscriptions) {
      try {
        // Log notification in database (status PENDING until delivery confirms)
        await ctx.db.insert("notificationLog", {
          staffId: args.staffId,
          type: args.type,
          title: args.title,
          body: args.body,
          orderId: args.orderId,
          eventId: args.eventId,
          status: "PENDING",
          sentAt: now,
        });

        // Schedule the actual push delivery via HTTP action
        await ctx.scheduler.runAfter(0, internal.notifications.pushNotifications.deliverPushNotification, {
          subscriptionId: sub._id,
          endpoint: sub.endpoint,
          keys: sub.keys,
          title: args.title,
          body: args.body,
          data: {
            type: args.type,
            orderId: args.orderId,
            eventId: args.eventId,
            url: args.orderId ? `/orders/${args.orderId}` : undefined,
          },
          tag: args.orderId ? `order-${args.orderId}` : undefined,
        });

        sentCount++;
      } catch (error) {
        console.error(`[sendToStaff] Failed to schedule push for subscription ${sub._id}:`, error);

        // Log failed notification
        await ctx.db.insert("notificationLog", {
          staffId: args.staffId,
          type: args.type,
          title: args.title,
          body: args.body,
          orderId: args.orderId,
          eventId: args.eventId,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          sentAt: now,
        });

        failedCount++;
      }
    }


    return {
      success: true,
      sent: sentCount,
      failed: failedCount,
    };
  },
});

/**
 * Test notification (for debugging)
 */
export const sendTestNotification = action({
  args: {
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; sent: number; failed: number }> => {

    const result = await ctx.runMutation(internal.notifications.pushNotifications.sendToStaff, {
      staffId: args.staffId,
      type: "CASH_ORDER",
      title: "🧪 Test Notification",
      body: "This is a test notification from SteppersLife Events",
      notificationType: "CASH_ORDER",
    });

    return {
      success: result.success,
      sent: result.sent,
      failed: result.failed || 0,
    };
  },
});

/**
 * Internal action: Deliver push notification via HTTP to Next.js API
 * This is called by sendToStaff for each subscription
 */
export const deliverPushNotification = internalAction({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseUrl = getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/api/push/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: {
            endpoint: args.endpoint,
            keys: args.keys,
          },
          notification: {
            title: args.title,
            body: args.body,
            data: args.data || {},
            tag: args.tag,
            requireInteraction: true,
          },
        }),
      });

      const result = await response.json();

      // Update subscription status based on result
      if (result.expired) {
        // Mark subscription as inactive if expired
        await ctx.runMutation(internal.notifications.pushNotifications.markSubscriptionExpired, {
          subscriptionId: args.subscriptionId,
        });
        return { success: false, expired: true };
      }

      if (!response.ok) {
        // Increment failure count
        await ctx.runMutation(internal.notifications.pushNotifications.incrementFailureCount, {
          subscriptionId: args.subscriptionId,
        });
        return { success: false, error: result.error };
      }

      // Success - update lastUsed timestamp
      await ctx.runMutation(internal.notifications.pushNotifications.markSubscriptionUsed, {
        subscriptionId: args.subscriptionId,
      });

      return { success: true };
    } catch (error) {
      console.error("[deliverPushNotification] HTTP error:", error);

      // Increment failure count on network errors
      await ctx.runMutation(internal.notifications.pushNotifications.incrementFailureCount, {
        subscriptionId: args.subscriptionId,
      });

      return { success: false, error: error instanceof Error ? error.message : "Network error" };
    }
  },
});

/**
 * Internal mutation: Mark subscription as expired/inactive
 */
export const markSubscriptionExpired = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation: Increment failure count on subscription
 */
export const incrementFailureCount = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return;

    const newFailureCount = (sub.failureCount || 0) + 1;
    await ctx.db.patch(args.subscriptionId, {
      failureCount: newFailureCount,
      // Deactivate after 5 consecutive failures
      isActive: newFailureCount < 5,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation: Mark subscription as successfully used
 */
export const markSubscriptionUsed = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      lastUsed: Date.now(),
      failureCount: 0, // Reset failure count on success
      updatedAt: Date.now(),
    });
  },
});
