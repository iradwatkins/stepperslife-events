import { v } from "convex/values";
import { query, QueryCtx } from "../_generated/server";

/**
 * Get authenticated user for queries
 */
async function getAuthenticatedUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.email) {
    return null;
  }

  const email = identity.email;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  return user;
}

/**
 * Get all associates for the current user (team leader)
 * Excludes removed associates by default
 */
export const getMyAssociates = query({
  args: {
    includeRemoved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      return [];
    }

    // Get all associates invited by this user
    const associates = await ctx.db
      .query("associates")
      .withIndex("by_invitedBy", (q) => q.eq("invitedById", currentUser._id))
      .collect();

    // Filter out removed unless specifically requested
    const filteredAssociates = args.includeRemoved
      ? associates
      : associates.filter((a) => a.status !== "REMOVED");

    // Sort by status (ACTIVE first, then PENDING, then SUSPENDED) and then by name
    const statusOrder = { ACTIVE: 0, PENDING: 1, SUSPENDED: 2, REMOVED: 3 };
    return filteredAssociates.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get a single associate by ID
 * Only returns if the current user is the inviter
 */
export const getAssociateById = query({
  args: {
    associateId: v.id("associates"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      return null;
    }

    const associate = await ctx.db.get(args.associateId);
    if (!associate) {
      return null;
    }

    // Only return if current user is the inviter
    if (associate.invitedById !== currentUser._id) {
      return null;
    }

    // Get linked user details if available
    let linkedUser = null;
    if (associate.userId) {
      linkedUser = await ctx.db.get(associate.userId);
    }

    return {
      ...associate,
      linkedUser: linkedUser
        ? {
            _id: linkedUser._id,
            name: linkedUser.name,
            email: linkedUser.email,
            image: linkedUser.image,
          }
        : null,
    };
  },
});

/**
 * Get associate statistics for the current user
 */
export const getAssociateStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0,
      };
    }

    const associates = await ctx.db
      .query("associates")
      .withIndex("by_invitedBy", (q) => q.eq("invitedById", currentUser._id))
      .filter((q) => q.neq(q.field("status"), "REMOVED"))
      .collect();

    return {
      total: associates.length,
      active: associates.filter((a) => a.status === "ACTIVE").length,
      pending: associates.filter((a) => a.status === "PENDING").length,
      suspended: associates.filter((a) => a.status === "SUSPENDED").length,
    };
  },
});

/**
 * Check if an email is already used by an associate on the current user's team
 */
export const checkEmailAvailability = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      return { available: false, message: "Authentication required" };
    }

    const normalizedEmail = args.email.toLowerCase().trim();

    const existingAssociate = await ctx.db
      .query("associates")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) =>
        q.and(
          q.eq(q.field("invitedById"), currentUser._id),
          q.neq(q.field("status"), "REMOVED")
        )
      )
      .first();

    if (existingAssociate) {
      return {
        available: false,
        message: "This email is already associated with a team member.",
      };
    }

    return { available: true, message: "" };
  },
});

/**
 * Get team leaderboard with sales data
 * Returns ranked associates by total sales for the specified period
 */
export const getTeamLeaderboard = query({
  args: {
    period: v.optional(
      v.union(v.literal("week"), v.literal("month"), v.literal("all"))
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) {
      return [];
    }

    const period = args.period ?? "month";

    // Get all active associates for this team leader
    const associates = await ctx.db
      .query("associates")
      .withIndex("by_invitedBy", (q) => q.eq("invitedById", currentUser._id))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .collect();

    if (associates.length === 0) {
      return [];
    }

    // Calculate time range based on period
    const now = Date.now();
    let startTime = 0;
    let previousPeriodStart = 0;
    let previousPeriodEnd = 0;

    if (period === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      previousPeriodStart = startTime - 7 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = startTime;
    } else if (period === "month") {
      startTime = now - 30 * 24 * 60 * 60 * 1000;
      previousPeriodStart = startTime - 30 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = startTime;
    }
    // For "all", startTime stays 0

    // Build a map of userId to associate for lookup
    const userIdToAssociate = new Map<string, (typeof associates)[0]>();
    for (const associate of associates) {
      if (associate.userId) {
        userIdToAssociate.set(associate.userId, associate);
      }
    }

    // Get all staff sales for users that match our associates
    // We need to aggregate sales by staffUserId
    const allStaffSales = await ctx.db.query("staffSales").collect();

    // Filter to only include sales from our associates and within time range
    const relevantSales = allStaffSales.filter((sale) => {
      const isOurAssociate = userIdToAssociate.has(sale.staffUserId);
      const isInTimeRange = sale.createdAt >= startTime;
      return isOurAssociate && isInTimeRange;
    });

    // Get previous period sales for trend calculation
    const previousPeriodSales =
      period !== "all"
        ? allStaffSales.filter((sale) => {
            const isOurAssociate = userIdToAssociate.has(sale.staffUserId);
            const isInPreviousPeriod =
              sale.createdAt >= previousPeriodStart &&
              sale.createdAt < previousPeriodEnd;
            return isOurAssociate && isInPreviousPeriod;
          })
        : [];

    // Get order details to calculate revenue
    const orderIds = [...new Set(relevantSales.map((s) => s.orderId))];
    const previousOrderIds = [
      ...new Set(previousPeriodSales.map((s) => s.orderId)),
    ];

    const orders = await Promise.all(orderIds.map((id) => ctx.db.get(id)));
    const previousOrders = await Promise.all(
      previousOrderIds.map((id) => ctx.db.get(id))
    );

    // Create order lookup maps
    const orderMap = new Map(
      orders
        .filter((o) => o !== null)
        .map((o) => [o!._id, o!])
    );
    const previousOrderMap = new Map(
      previousOrders
        .filter((o) => o !== null)
        .map((o) => [o!._id, o!])
    );

    // Aggregate sales data per associate
    const salesByUserId = new Map<
      string,
      { salesCount: number; revenue: number; ticketCount: number }
    >();
    const previousSalesByUserId = new Map<
      string,
      { salesCount: number; revenue: number }
    >();

    // Current period aggregation
    for (const sale of relevantSales) {
      const userId = sale.staffUserId;
      const existing = salesByUserId.get(userId) || {
        salesCount: 0,
        revenue: 0,
        ticketCount: 0,
      };
      const order = orderMap.get(sale.orderId);
      const revenue = order?.totalCents ?? 0;

      salesByUserId.set(userId, {
        salesCount: existing.salesCount + 1,
        revenue: existing.revenue + revenue,
        ticketCount: existing.ticketCount + (sale.ticketCount || 0),
      });
    }

    // Previous period aggregation for trend
    for (const sale of previousPeriodSales) {
      const userId = sale.staffUserId;
      const existing = previousSalesByUserId.get(userId) || {
        salesCount: 0,
        revenue: 0,
      };
      const order = previousOrderMap.get(sale.orderId);
      const revenue = order?.totalCents ?? 0;

      previousSalesByUserId.set(userId, {
        salesCount: existing.salesCount + 1,
        revenue: existing.revenue + revenue,
      });
    }

    // Build leaderboard data
    const leaderboardData = associates.map((associate) => {
      const userId = associate.userId;
      const currentStats = userId
        ? salesByUserId.get(userId) || { salesCount: 0, revenue: 0, ticketCount: 0 }
        : { salesCount: 0, revenue: 0, ticketCount: 0 };
      const previousStats = userId
        ? previousSalesByUserId.get(userId) || { salesCount: 0, revenue: 0 }
        : { salesCount: 0, revenue: 0 };

      // Calculate trend: positive = up, negative = down, 0 = same/no data
      let trend: "up" | "down" | "same" = "same";
      if (period !== "all" && previousStats.salesCount > 0) {
        if (currentStats.salesCount > previousStats.salesCount) {
          trend = "up";
        } else if (currentStats.salesCount < previousStats.salesCount) {
          trend = "down";
        }
      }

      return {
        associateId: associate._id,
        name: associate.name,
        email: associate.email,
        salesCount: currentStats.salesCount,
        ticketCount: currentStats.ticketCount,
        revenue: currentStats.revenue, // in cents
        trend,
        previousSalesCount: previousStats.salesCount,
      };
    });

    // Sort by revenue (descending), then by sales count
    leaderboardData.sort((a, b) => {
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }
      return b.salesCount - a.salesCount;
    });

    // Add rank
    return leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },
});
