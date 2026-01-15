import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get payment configuration for an event
 */
export const getEventPaymentConfig = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    return config;
  },
});

/**
 * Check if event has payment configured
 */
export const hasPaymentConfigured = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    return {
      hasConfig: !!config,
      isActive: config?.isActive || false,
      paymentModel: config?.paymentModel || null,
    };
  },
});

/**
 * Get all payment configs for organizer
 */
export const getOrganizerPaymentConfigs = query({
  args: {
    organizerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .collect();

    // Enrich with event details
    const enrichedConfigs = await Promise.all(
      configs.map(async (config) => {
        const event = await ctx.db.get(config.eventId);
        return {
          ...config,
          event,
        };
      })
    );

    return enrichedConfigs;
  },
});

/**
 * Calculate fee preview for ticket price
 */
export const calculateFeePreview = query({
  args: {
    ticketPrice: v.number(), // in cents
    paymentModel: v.union(v.literal("PREPAY"), v.literal("CREDIT_CARD")),
    charityDiscount: v.optional(v.boolean()),
    lowPriceDiscount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const DEFAULT_PLATFORM_FEE_PERCENT = 3.7;
    const DEFAULT_PLATFORM_FEE_FIXED_CENTS = 179;
    const DEFAULT_PROCESSING_FEE_PERCENT = 2.9;

    let platformFee = 0;
    let processingFee = 0;

    if (args.paymentModel === "CREDIT_CARD") {
      // Apply discounts
      let platformFeePercent = DEFAULT_PLATFORM_FEE_PERCENT;
      let platformFeeFixed = DEFAULT_PLATFORM_FEE_FIXED_CENTS;

      if (args.charityDiscount || args.lowPriceDiscount) {
        platformFeePercent = platformFeePercent / 2;
        platformFeeFixed = Math.round(platformFeeFixed / 2);
      }

      // Calculate fees
      platformFee = Math.round((args.ticketPrice * platformFeePercent) / 100) + platformFeeFixed;
      const totalBeforeProcessing = args.ticketPrice + platformFee;
      processingFee = Math.round((totalBeforeProcessing * DEFAULT_PROCESSING_FEE_PERCENT) / 100);
    } else {
      // Pre-purchase: only processing fee
      processingFee = Math.round((args.ticketPrice * DEFAULT_PROCESSING_FEE_PERCENT) / 100);
    }

    const totalAmount = args.ticketPrice + platformFee + processingFee;
    const organizerReceives = args.ticketPrice - platformFee; // Organizer pays platform fee
    const buyerPays = totalAmount;

    return {
      ticketPrice: args.ticketPrice,
      platformFee,
      processingFee,
      totalAmount,
      organizerReceives,
      buyerPays,
      breakdown: {
        ticketPriceDollars: (args.ticketPrice / 100).toFixed(2),
        platformFeeDollars: (platformFee / 100).toFixed(2),
        processingFeeDollars: (processingFee / 100).toFixed(2),
        totalDollars: (totalAmount / 100).toFixed(2),
        organizerReceivesDollars: (organizerReceives / 100).toFixed(2),
      },
    };
  },
});

/**
 * Get payment model comparison
 */
export const getPaymentModelComparison = query({
  args: {
    ticketPrice: v.number(), // in cents
    ticketQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    const CREDIT_PRICE_CENTS = 30; // $0.30 per ticket

    // Pre-Purchase Model
    const prePurchaseCost = args.ticketQuantity * CREDIT_PRICE_CENTS;
    const prePurchaseProcessingFee =
      Math.round((args.ticketPrice * 2.9) / 100) * args.ticketQuantity;
    const prePurchaseTotal = prePurchaseCost + prePurchaseProcessingFee;
    const prePurchaseRevenue = args.ticketPrice * args.ticketQuantity - prePurchaseProcessingFee;
    const prePurchaseProfit = prePurchaseRevenue - prePurchaseCost;

    // Pay-As-Sell Model
    const platformFeePerTicket = Math.round((args.ticketPrice * 3.7) / 100) + 179;
    const processingFeePerTicket = Math.round(
      ((args.ticketPrice + platformFeePerTicket) * 2.9) / 100
    );
    const totalFeesPerTicket = platformFeePerTicket + processingFeePerTicket;
    const payAsSellTotalFees = totalFeesPerTicket * args.ticketQuantity;
    const payAsSellRevenue = args.ticketPrice * args.ticketQuantity;
    const payAsSellProfit = payAsSellRevenue - payAsSellTotalFees;

    return {
      prePurchase: {
        upfrontCost: prePurchaseCost,
        upfrontCostDollars: (prePurchaseCost / 100).toFixed(2),
        processingFees: prePurchaseProcessingFee,
        totalCost: prePurchaseTotal,
        revenue: prePurchaseRevenue,
        profit: prePurchaseProfit,
        profitDollars: (prePurchaseProfit / 100).toFixed(2),
      },
      payAsSell: {
        upfrontCost: 0,
        platformFees: platformFeePerTicket * args.ticketQuantity,
        processingFees: processingFeePerTicket * args.ticketQuantity,
        totalFees: payAsSellTotalFees,
        totalFeesDollars: (payAsSellTotalFees / 100).toFixed(2),
        revenue: payAsSellRevenue,
        profit: payAsSellProfit,
        profitDollars: (payAsSellProfit / 100).toFixed(2),
      },
      comparison: {
        prePurchaseBetter: prePurchaseProfit > payAsSellProfit,
        savingsWithPrePurchase: Math.max(0, payAsSellTotalFees - prePurchaseTotal),
        savingsWithPrePurchaseDollars: (
          Math.max(0, payAsSellTotalFees - prePurchaseTotal) / 100
        ).toFixed(2),
      },
    };
  },
});

/**
 * Calculate effective price after discount and check if it falls below fees
 * Used to warn organizers when creating low-margin discounts
 */
export const calculateDiscountedPrice = query({
  args: {
    ticketPriceCents: v.number(),
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED_AMOUNT")),
    discountValue: v.number(),
    charityDiscount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const DEFAULT_PLATFORM_FEE_PERCENT = 3.7;
    const DEFAULT_PLATFORM_FEE_FIXED_CENTS = 179;

    // Calculate discounted price
    let discountAmountCents = 0;
    if (args.discountType === "PERCENTAGE") {
      discountAmountCents = Math.round((args.ticketPriceCents * args.discountValue) / 100);
    } else {
      discountAmountCents = args.discountValue;
    }
    const discountedPriceCents = Math.max(0, args.ticketPriceCents - discountAmountCents);

    // Calculate platform fee (organizer pays this)
    let platformFeePercent = DEFAULT_PLATFORM_FEE_PERCENT;
    let platformFeeFixed = DEFAULT_PLATFORM_FEE_FIXED_CENTS;
    if (args.charityDiscount) {
      platformFeePercent = platformFeePercent / 2;
      platformFeeFixed = Math.round(platformFeeFixed / 2);
    }

    const platformFeeCents = Math.round((discountedPriceCents * platformFeePercent) / 100) + platformFeeFixed;

    // Calculate organizer net (what they receive after platform fee)
    const organizerNetCents = discountedPriceCents - platformFeeCents;
    const isBelowThreshold = organizerNetCents < 0;

    return {
      originalPriceCents: args.ticketPriceCents,
      discountAmountCents,
      discountedPriceCents,
      platformFeeCents,
      organizerNetCents,
      isBelowThreshold,
      breakdown: {
        originalPrice: `$${(args.ticketPriceCents / 100).toFixed(2)}`,
        discountAmount: `$${(discountAmountCents / 100).toFixed(2)}`,
        discountedPrice: `$${(discountedPriceCents / 100).toFixed(2)}`,
        platformFee: `$${(platformFeeCents / 100).toFixed(2)}`,
        organizerNet: `$${(organizerNetCents / 100).toFixed(2)}`,
      },
      warning: isBelowThreshold
        ? `This discount reduces the ticket price to $${(discountedPriceCents / 100).toFixed(2)}, which is below the $${(platformFeeCents / 100).toFixed(2)} platform fee. You will lose $${(Math.abs(organizerNetCents) / 100).toFixed(2)} per ticket sold with this discount.`
        : null,
    };
  },
});

/**
 * Check if organizer can use pre-purchase for event
 */
export const canUsePrePurchase = query({
  args: {
    organizerId: v.id("users"),
    ticketsNeeded: v.number(),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .first();

    const availableCredits = credits ? credits.creditsRemaining : 0;
    const hasFirstEventFree = credits ? !credits.firstEventFreeUsed : true;
    const hasEnough = availableCredits >= args.ticketsNeeded;

    return {
      canUse: hasEnough,
      available: availableCredits,
      needed: args.ticketsNeeded,
      shortfall: hasEnough ? 0 : args.ticketsNeeded - availableCredits,
      hasFirstEventFree,
      firstEventFreeTickets: hasFirstEventFree ? 200 : 0,
    };
  },
});
