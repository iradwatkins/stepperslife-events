/**
 * Seating Templates API
 *
 * Provides CRUD operations for floor plan templates.
 * Allows organizers to save seating chart designs as reusable templates.
 *
 * Story 13.7: Seating Templates API Foundation
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Type definitions for seating chart sections
type SeatStatus = "AVAILABLE" | "RESERVED" | "BLOCKED" | "UNAVAILABLE";
type SeatType = "STANDARD" | "WHEELCHAIR" | "COMPANION" | "VIP" | "BLOCKED" | "STANDING" | "PARKING" | "TENT";
type TableShape = "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";

interface Seat {
  id: string;
  number: string;
  type: SeatType;
  status: SeatStatus;
}

interface Row {
  id: string;
  label?: string;
  y?: number;
  seats: Seat[];
}

interface Table {
  id: string;
  number: string | number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seatArc?: { startAngle?: number; arcDegrees?: number };
  seats: Seat[];
}

interface Section {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: "ROWS" | "TABLES";
  rows?: Row[];
  tables?: Table[];
}

/**
 * Transform template sections to seating chart format
 * Resets all seats to AVAILABLE status
 */
function transformTemplateSections(templateSections: unknown[]): Section[] {
  return (templateSections as Section[]).map((section) => ({
    ...section,
    rows: section.rows?.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => ({
        ...seat,
        status: "AVAILABLE" as SeatStatus,
      })),
    })),
    tables: section.tables?.map((table) => ({
      ...table,
      seats: table.seats.map((seat) => ({
        ...seat,
        status: "AVAILABLE" as SeatStatus,
      })),
    })),
  }));
}

/**
 * Get all floor plan templates for the current user
 * Includes both user's private templates and public templates
 */
export const getMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Get user's own templates
    const userTemplates = await ctx.db
      .query("roomTemplates")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Get public templates (excluding user's own)
    const publicTemplates = await ctx.db
      .query("roomTemplates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Combine and deduplicate
    const templateMap = new Map<string, typeof userTemplates[0]>();

    // Add user templates first
    for (const template of userTemplates) {
      templateMap.set(template._id, template);
    }

    // Add public templates (excluding already added)
    for (const template of publicTemplates) {
      if (!templateMap.has(template._id)) {
        templateMap.set(template._id, template);
      }
    }

    // Sort by createdAt descending
    return Array.from(templateMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single floor plan template by ID
 */
export const getTemplate = query({
  args: {
    templateId: v.id("roomTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    // Check access permissions
    if (!template.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || template.createdBy !== user._id) {
        return null;
      }
    }

    return template;
  },
});

/**
 * Save a seating chart as a floor plan template
 */
export const saveTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("theater"),
      v.literal("stadium"),
      v.literal("concert"),
      v.literal("conference"),
      v.literal("outdoor"),
      v.literal("wedding"),
      v.literal("gala"),
      v.literal("banquet"),
      v.literal("custom")
    ),
    seatingStyle: v.union(v.literal("ROW_BASED"), v.literal("TABLE_BASED"), v.literal("MIXED")),
    estimatedCapacity: v.number(),
    sections: v.array(v.any()),
    isPublic: v.optional(v.boolean()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required to save templates");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    const now = Date.now();

    const templateId = await ctx.db.insert("roomTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      seatingStyle: args.seatingStyle,
      estimatedCapacity: args.estimatedCapacity,
      sections: args.sections,
      createdBy: user._id,
      isPublic: args.isPublic || false,
      isSystemTemplate: false,
      thumbnailUrl: args.thumbnailUrl,
      timesUsed: 0,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

/**
 * Update a floor plan template
 */
export const updateTemplate = mutation({
  args: {
    templateId: v.id("roomTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("theater"),
        v.literal("stadium"),
        v.literal("concert"),
        v.literal("conference"),
        v.literal("outdoor"),
        v.literal("wedding"),
        v.literal("gala"),
        v.literal("banquet"),
        v.literal("custom")
      )
    ),
    seatingStyle: v.optional(
      v.union(v.literal("ROW_BASED"), v.literal("TABLE_BASED"), v.literal("MIXED"))
    ),
    estimatedCapacity: v.optional(v.number()),
    sections: v.optional(v.array(v.any())),
    isPublic: v.optional(v.boolean()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    if (template.createdBy !== user._id) {
      throw new Error("Not authorized to update this template");
    }

    if (template.isSystemTemplate) {
      throw new Error("Cannot update system templates");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.seatingStyle !== undefined) updates.seatingStyle = args.seatingStyle;
    if (args.estimatedCapacity !== undefined) updates.estimatedCapacity = args.estimatedCapacity;
    if (args.sections !== undefined) updates.sections = args.sections;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.thumbnailUrl !== undefined) updates.thumbnailUrl = args.thumbnailUrl;

    await ctx.db.patch(args.templateId, updates);

    return args.templateId;
  },
});

/**
 * Delete a floor plan template
 */
export const deleteTemplate = mutation({
  args: {
    templateId: v.id("roomTemplates"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    if (template.createdBy !== user._id) {
      throw new Error("Not authorized to delete this template");
    }

    if (template.isSystemTemplate) {
      throw new Error("Cannot delete system templates");
    }

    await ctx.db.delete(args.templateId);

    return { success: true };
  },
});

/**
 * Bulk delete floor plan templates
 */
export const bulkDeleteTemplates = mutation({
  args: {
    templateIds: v.array(v.id("roomTemplates")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    const results = {
      deletedCount: 0,
      failedCount: 0,
      failedTemplates: [] as Array<{ templateId: string; reason: string }>,
    };

    for (const templateId of args.templateIds) {
      try {
        const template = await ctx.db.get(templateId);

        if (!template) {
          results.failedCount++;
          results.failedTemplates.push({ templateId, reason: "Template not found" });
          continue;
        }

        if (template.createdBy !== user._id) {
          results.failedCount++;
          results.failedTemplates.push({ templateId, reason: "Not authorized" });
          continue;
        }

        if (template.isSystemTemplate) {
          results.failedCount++;
          results.failedTemplates.push({ templateId, reason: "Cannot delete system templates" });
          continue;
        }

        await ctx.db.delete(templateId);
        results.deletedCount++;
      } catch (error) {
        results.failedCount++;
        results.failedTemplates.push({
          templateId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Clone a template to create a new one
 */
export const cloneTemplate = mutation({
  args: {
    templateId: v.id("roomTemplates"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check access to source template
    if (!template.isPublic && template.createdBy !== user._id) {
      throw new Error("Not authorized to clone this template");
    }

    const now = Date.now();

    const newTemplateId = await ctx.db.insert("roomTemplates", {
      name: args.name || `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      seatingStyle: template.seatingStyle,
      estimatedCapacity: template.estimatedCapacity,
      sections: template.sections,
      createdBy: user._id,
      isPublic: false,
      isSystemTemplate: false,
      thumbnailUrl: template.thumbnailUrl,
      timesUsed: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Increment usage counter on source template
    await ctx.db.patch(args.templateId, {
      timesUsed: (template.timesUsed || 0) + 1,
    });

    return newTemplateId;
  },
});

/**
 * Apply a template to create a seating chart for an event
 */
export const applyTemplateToEvent = mutation({
  args: {
    templateId: v.id("roomTemplates"),
    eventId: v.id("events"),
    venueName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found");
    }

    // Verify event ownership
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to modify this event");
    }

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check template access
    if (!template.isPublic && template.createdBy !== user._id) {
      throw new Error("Not authorized to use this template");
    }

    const now = Date.now();

    // Transform template sections to seating chart format
    // Reset all seat statuses to AVAILABLE for new chart
    const transformedSections = transformTemplateSections(template.sections);

    // Create seating chart from template
    // Using type assertion due to complex nested section types
    const chartData = {
      eventId: args.eventId,
      name: args.venueName || template.name,
      seatingStyle: template.seatingStyle as "ROW_BASED" | "TABLE_BASED" | "MIXED" | undefined,
      totalCapacity: template.estimatedCapacity,
      availableSeats: template.estimatedCapacity,
      reservedSeats: 0,
      isPublished: false,
      sections: transformedSections,
      createdAt: now,
      updatedAt: now,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seatingChartId = await ctx.db.insert("seatingCharts", chartData as any);

    // Increment usage counter on template
    await ctx.db.patch(args.templateId, {
      timesUsed: (template.timesUsed || 0) + 1,
    });

    return seatingChartId;
  },
});

/**
 * Get preset templates (system templates)
 */
export const getPresetTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let templates;

    if (args.category && args.category !== "all") {
      const category = args.category as "theater" | "stadium" | "concert" | "conference" | "outdoor" | "wedding" | "gala" | "banquet" | "custom";
      templates = await ctx.db
        .query("roomTemplates")
        .withIndex("by_category", (q) => q.eq("category", category))
        .filter((q) => q.eq(q.field("isSystemTemplate"), true))
        .collect();
    } else {
      templates = await ctx.db
        .query("roomTemplates")
        .filter((q) => q.eq(q.field("isSystemTemplate"), true))
        .collect();
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  },
});
