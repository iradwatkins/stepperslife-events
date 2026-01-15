import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a discount code for an event
 */
export const createDiscountCode = mutation({
  args: {
    eventId: v.id("events"),
    code: v.string(),
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED_AMOUNT")),
    discountValue: v.number(),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    applicableToTierIds: v.optional(v.array(v.id("ticketTiers"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Get event to verify organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== user._id) {
      throw new Error("Not authorized - You don't own this event");
    }

    // Check if code already exists for this event
    const existingCode = await ctx.db
      .query("discountCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .first();

    if (existingCode) {
      throw new Error("This discount code already exists for this event");
    }

    // Validate discount value
    if (
      args.discountType === "PERCENTAGE" &&
      (args.discountValue <= 0 || args.discountValue > 100)
    ) {
      throw new Error("Percentage discount must be between 1 and 100");
    }

    if (args.discountType === "FIXED_AMOUNT" && args.discountValue <= 0) {
      throw new Error("Fixed amount discount must be greater than 0");
    }

    // Check for low-price warnings (Story 13.5)
    const warnings: string[] = [];
    const ticketTiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get payment config for charity discount status
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    const charityDiscount = paymentConfig?.charityDiscount || false;
    const DEFAULT_PLATFORM_FEE_PERCENT = 3.7;
    const DEFAULT_PLATFORM_FEE_FIXED_CENTS = 179;

    for (const tier of ticketTiers) {
      // Skip if this discount only applies to specific tiers and this isn't one
      if (args.applicableToTierIds && !args.applicableToTierIds.includes(tier._id)) {
        continue;
      }

      const priceCents = tier.price;

      // Calculate discount amount
      let discountAmountCents = 0;
      if (args.discountType === "PERCENTAGE") {
        discountAmountCents = Math.round((priceCents * args.discountValue) / 100);
      } else {
        discountAmountCents = args.discountValue;
      }
      const discountedPrice = Math.max(0, priceCents - discountAmountCents);

      // Calculate platform fee
      let platformFeePercent = DEFAULT_PLATFORM_FEE_PERCENT;
      let platformFeeFixed = DEFAULT_PLATFORM_FEE_FIXED_CENTS;
      if (charityDiscount) {
        platformFeePercent = platformFeePercent / 2;
        platformFeeFixed = Math.round(platformFeeFixed / 2);
      }
      const platformFee = Math.round((discountedPrice * platformFeePercent) / 100) + platformFeeFixed;
      const organizerNet = discountedPrice - platformFee;

      // Warn if organizer would lose money
      if (organizerNet < 0) {
        warnings.push(
          `Warning: "${tier.name}" ticket ($${(priceCents / 100).toFixed(2)}) with this discount becomes $${(discountedPrice / 100).toFixed(2)}, below the $${(platformFee / 100).toFixed(2)} platform fee. You will lose $${(Math.abs(organizerNet) / 100).toFixed(2)} per ticket.`
        );
      }
    }

    const now = Date.now();

    const discountCodeId = await ctx.db.insert("discountCodes", {
      code: args.code.toUpperCase(),
      eventId: args.eventId,
      organizerId: user._id,
      discountType: args.discountType,
      discountValue: args.discountValue,
      maxUses: args.maxUses,
      usedCount: 0,
      maxUsesPerUser: args.maxUsesPerUser,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      minPurchaseAmount: args.minPurchaseAmount,
      applicableToTierIds: args.applicableToTierIds,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      discountCodeId,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});

/**
 * Update discount code
 */
export const updateDiscountCode = mutation({
  args: {
    discountCodeId: v.id("discountCodes"),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const discountCode = await ctx.db.get(args.discountCodeId);
    if (!discountCode) throw new Error("Discount code not found");

    if (discountCode.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.discountCodeId, {
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      ...(args.maxUses !== undefined && { maxUses: args.maxUses }),
      ...(args.validUntil !== undefined && { validUntil: args.validUntil }),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete discount code
 */
export const deleteDiscountCode = mutation({
  args: {
    discountCodeId: v.id("discountCodes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const discountCode = await ctx.db.get(args.discountCodeId);
    if (!discountCode) throw new Error("Discount code not found");

    if (discountCode.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Check if code has been used
    if (discountCode.usedCount > 0) {
      throw new Error("Cannot delete a discount code that has been used. Deactivate it instead.");
    }

    await ctx.db.delete(args.discountCodeId);

    return { success: true };
  },
});
