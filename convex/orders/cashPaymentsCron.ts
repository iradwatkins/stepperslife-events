/**
 * Order Expiration Cron Jobs
 * Internal mutations called by scheduled cron jobs
 *
 * Handles two types of order expiration:
 * 1. Cash orders (PENDING_PAYMENT) - Awaiting payment at door
 * 2. Online checkout orders (PENDING) - Abandoned during checkout
 */

import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Timeouts
const CASH_HOLD_DURATION = 30 * 60 * 1000; // 30 minutes for cash orders
const PENDING_ORDER_TIMEOUT = 30 * 60 * 1000; // 30 minutes for online checkout

/**
 * Expire cash orders that have passed their 30-minute hold
 * Called by cron job every 5 minutes
 */
export const expireCashOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();


    // Find all pending cash orders with expired holds
    // Note: PENDING_PAYMENT is the status used for cash orders awaiting payment at door
    const allPendingOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("status"), "PENDING_PAYMENT"))
      .collect();

    // Filter by expired hold time (30 minutes from order creation)
    const expiredOrders = allPendingOrders.filter(
      (order) => order.createdAt && (now - order.createdAt) > CASH_HOLD_DURATION
    );


    let expiredCount = 0;
    let ticketsReleasedCount = 0;

    for (const order of expiredOrders) {
      // Get all tickets FIRST to release inventory
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      // CRITICAL FIX: Release inventory by decrementing ticketTiers.sold count
      // This prevents "permanent inventory loss" when cash orders expire
      const tierUpdates = new Map<string, number>();
      for (const ticket of tickets) {
        if (ticket.ticketTierId) {
          const tierId = ticket.ticketTierId.toString();
          tierUpdates.set(tierId, (tierUpdates.get(tierId) || 0) + 1);
        }
      }

      for (const [tierId, count] of tierUpdates) {
        const tier = await ctx.db.get(tierId as Id<"ticketTiers">);
        if (tier && tier.sold >= count) {
          await ctx.db.patch(tier._id, {
            sold: tier.sold - count,
          });
        }
      }

      // Update order status to CANCELLED (no EXPIRED status in schema)
      await ctx.db.patch(order._id, {
        status: "CANCELLED",
        updatedAt: now,
      });

      // Update all tickets to CANCELLED status (no EXPIRED status in schema)
      for (const ticket of tickets) {
        await ctx.db.patch(ticket._id, {
          status: "CANCELLED",
          updatedAt: now,
        });
      }

      ticketsReleasedCount += tickets.length;
      expiredCount++;

    }


    return {
      success: true,
      expiredCount,
      ticketsReleasedCount,
    };
  },
});

/**
 * Expire PENDING orders (online checkout) that were abandoned
 * Called by cron job every 5 minutes
 *
 * This handles a different case than expireCashOrders:
 * - expireCashOrders: Handles PENDING_PAYMENT (cash orders awaiting door payment)
 * - expirePendingOrders: Handles PENDING (online checkout abandoned before payment)
 */
export const expirePendingOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - PENDING_ORDER_TIMEOUT;

    // Find all PENDING orders older than 30 minutes
    const allPendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    // Filter by creation time (orders older than 30 minutes)
    const expiredOrders = allPendingOrders.filter(
      (order) => order.createdAt && order.createdAt < cutoff
    );

    if (expiredOrders.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        ticketsReleasedCount: 0,
        discountCodesReleased: 0,
      };
    }

    let expiredCount = 0;
    let ticketsReleasedCount = 0;
    let discountCodesReleased = 0;

    for (const order of expiredOrders) {
      // Get all tickets to release inventory
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();

      // Release inventory by decrementing ticketTiers.sold count
      const tierUpdates = new Map<string, number>();
      for (const ticket of tickets) {
        if (ticket.ticketTierId) {
          const tierId = ticket.ticketTierId.toString();
          tierUpdates.set(tierId, (tierUpdates.get(tierId) || 0) + 1);
        }
      }

      for (const [tierId, count] of tierUpdates) {
        const tier = await ctx.db.get(tierId as Id<"ticketTiers">);
        if (tier && tier.sold >= count) {
          await ctx.db.patch(tier._id, {
            sold: tier.sold - count,
          });
        }
      }

      // Release discount code if one was used
      if (order.discountCodeId) {
        const discountCode = await ctx.db.get(order.discountCodeId);
        if (discountCode && discountCode.usedCount > 0) {
          await ctx.db.patch(order.discountCodeId, {
            usedCount: discountCode.usedCount - 1,
            updatedAt: now,
          });
          discountCodesReleased++;
        }
      }

      // Update order status to CANCELLED with expiration reason
      await ctx.db.patch(order._id, {
        status: "CANCELLED",
        failureReason: "Order expired - checkout not completed within 30 minutes",
        updatedAt: now,
      });

      // Cancel all tickets
      for (const ticket of tickets) {
        await ctx.db.patch(ticket._id, {
          status: "CANCELLED",
          updatedAt: now,
        });
      }

      ticketsReleasedCount += tickets.length;
      expiredCount++;
    }

    if (expiredCount > 0) {
      console.log(
        `[PendingOrdersCron] Expired ${expiredCount} abandoned orders, released ${ticketsReleasedCount} tickets`
      );
    }

    return {
      success: true,
      expiredCount,
      ticketsReleasedCount,
      discountCodesReleased,
    };
  },
});
