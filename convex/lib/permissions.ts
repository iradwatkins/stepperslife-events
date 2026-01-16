/**
 * Centralized Permission Checker
 *
 * This module provides reusable permission checking functions to avoid
 * duplicating permission logic throughout the codebase.
 *
 * @module permissions
 */

import {
  USER_ROLES,
  STAFF_ROLES,
  HIERARCHY_CONFIG,
  ORGANIZER_TEAM_ROLES,
  ORGANIZER_TEAM_PERMISSIONS,
  canAssignOrganizerRole,
  type RestaurantStaffRole,
  type OrganizerTeamRole,
} from "./roles";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/** Convex context type for queries and mutations */
type ConvexCtx = QueryCtx | MutationCtx;

/** Restaurant role includes OWNER plus staff roles */
export type RestaurantRole = "OWNER" | RestaurantStaffRole;

/**
 * Permission checking utility class
 */
export class PermissionChecker {
  /**
   * Check if user is a platform administrator
   */
  static isAdmin(user: Doc<"users"> | null | undefined): boolean {
    return user?.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if user is an event organizer (any organizer, not specific to event)
   */
  static isOrganizer(user: Doc<"users"> | null | undefined): boolean {
    return user?.role === USER_ROLES.ORGANIZER || this.isAdmin(user);
  }

  /**
   * Check if user is the organizer of a specific event
   */
  static isEventOrganizer(
    user: Doc<"users"> | null | undefined,
    event: Doc<"events"> | null | undefined
  ): boolean {
    if (!user || !event) return false;
    return this.isAdmin(user) || event.organizerId === user._id;
  }

  /**
   * Check if user can manage a specific staff member
   * (Either admin, event organizer, or parent staff who assigned them)
   */
  static async canManageStaff(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    staff: Doc<"eventStaff"> | null | undefined
  ): Promise<boolean> {
    if (!user || !staff) return false;

    // Admins can manage anyone
    if (this.isAdmin(user)) return true;

    // Event organizer can manage their event's staff
    if (staff.organizerId === user._id) return true;

    // Parent staff can manage their assigned sub-sellers
    if (staff.assignedByStaffId) {
      const parentStaff = await ctx.db.get(staff.assignedByStaffId);
      if (parentStaff?.staffUserId === user._id) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if staff member can assign sub-sellers
   */
  static canAssignSubSellers(staff: Doc<"eventStaff"> | null | undefined): boolean {
    if (!staff) return false;
    return staff.canAssignSubSellers === true;
  }

  /**
   * Check if staff hierarchy is within allowed depth
   */
  static isWithinHierarchyLimit(currentLevel: number): boolean {
    return currentLevel < HIERARCHY_CONFIG.MAX_DEPTH;
  }

  /**
   * Calculate next hierarchy level
   */
  static getNextHierarchyLevel(parentLevel: number): number {
    return parentLevel + 1;
  }

  /**
   * Check if user owns a ticket
   */
  static ownsTicket(
    user: Doc<"users"> | null | undefined,
    ticket: Doc<"tickets"> | null | undefined
  ): boolean {
    if (!user || !ticket) return false;
    return ticket.attendeeEmail === user.email;
  }

  /**
   * Check if user can transfer tickets for an event
   */
  static async canTransferTickets(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always transfer
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is active staff for this event
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("staffUserId"), user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return staff !== null;
  }

  /**
   * Check if user can scan tickets for an event
   */
  static async canScanTickets(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always scan
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is staff with scanning permissions
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("staffUserId"), user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!staff) return false;

    // STAFF role always has permission
    if (staff.role === STAFF_ROLES.STAFF) return true;

    // TEAM_MEMBERS and ASSOCIATES need explicit canScan permission
    if (staff.role === STAFF_ROLES.TEAM_MEMBERS && staff.canScan === true) return true;
    if (staff.role === STAFF_ROLES.ASSOCIATES && staff.canScan === true) return true;

    return false;
  }

  /**
   * Check if user can sell tickets for an event
   */
  static async canSellTickets(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    // Get event
    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Admins and event organizers can always sell
    if (this.isEventOrganizer(user, event)) return true;

    // Check if user is active SUPPORT_STAFF or SUB_RESELLER (or legacy SELLER)
    const staff = await ctx.db
      .query("eventStaff")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("staffUserId"), user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!staff) return false;

    // Can sell if TEAM_MEMBERS or ASSOCIATES
    if (staff.role === STAFF_ROLES.TEAM_MEMBERS) return true;
    if (staff.role === STAFF_ROLES.ASSOCIATES) return true;
    // STAFF can sell only if organizer gave permission
    if (staff.role === STAFF_ROLES.STAFF && staff.canScan === true) return true;

    return false;
  }

  /**
   * Check if user can view event analytics
   */
  static async canViewAnalytics(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can view analytics
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can modify event details
   */
  static async canModifyEvent(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can modify events
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can delete an event
   */
  static async canDeleteEvent(
    ctx: ConvexCtx,
    user: Doc<"users"> | null | undefined,
    eventId: Id<"events">
  ): Promise<boolean> {
    if (!user) return false;

    const event = await ctx.db.get(eventId);
    if (!event) return false;

    // Only admins and event organizers can delete events
    return this.isEventOrganizer(user, event);
  }

  /**
   * Check if user can create ticketed events
   * (Some organizers are restricted to only Save The Date and Free events)
   */
  static canCreateTicketedEvents(user: Doc<"users"> | null | undefined): boolean {
    if (!user) return false;
    // Admins can always create ticketed events
    if (this.isAdmin(user)) return true;
    // If the flag is explicitly set to false, user cannot create ticketed events
    // If the flag is undefined or true, user can create ticketed events
    return user.canCreateTicketedEvents !== false;
  }

  // ==========================================
  // RESTAURANT PERMISSIONS
  // ==========================================

  /**
   * Check if user has RESTAURATEUR platform role
   * (Can create restaurants, access restaurateur dashboard)
   */
  static isRestaurateur(user: Doc<"users"> | null | undefined): boolean {
    return user?.role === USER_ROLES.RESTAURATEUR || this.isAdmin(user);
  }

  /**
   * Check if user is the owner of a specific restaurant
   */
  static isRestaurantOwner(
    user: Doc<"users"> | null | undefined,
    restaurant: Doc<"restaurants"> | null | undefined
  ): boolean {
    if (!user || !restaurant) return false;
    return this.isAdmin(user) || restaurant.ownerId === user._id;
  }

  /**
   * Check if action should be allowed in production
   * (Used to prevent testing mode in production)
   */
  static isProductionSafe(): boolean {
    // In production, require strict authentication
    // This can be enhanced with environment variable checks
    return process.env.NODE_ENV === "production";
  }

  /**
   * Get permission error message
   */
  static getPermissionError(action: string): string {
    return `You don't have permission to ${action}. Please contact an administrator if you believe this is an error.`;
  }

  // ==========================================
  // ADMIN CONTENT CREATION RESTRICTIONS
  // ==========================================

  /**
   * Event types that admins are ALLOWED to create and own
   * These are informational/promotional posts only - no ticketing, no enrollment
   */
  static readonly ADMIN_ALLOWED_EVENT_TYPES = [
    "GENERAL_POSTING",
    "FREE_EVENT",
    "SAVE_THE_DATE",
    "CLASS", // Admin can post class info, but class won't have enrollment
  ] as const;

  /**
   * Event types that are BLOCKED for admins
   * These require payment processing which admins cannot own
   */
  static readonly ADMIN_BLOCKED_EVENT_TYPES = [
    "TICKETED_EVENT",
    "SEATED_EVENT",
  ] as const;

  /**
   * Check if user can CREATE content as the owner
   *
   * ADMIN RULES (Updated):
   * - Admins CAN create and own INFORMATIONAL posts (GENERAL_POSTING, FREE_EVENT, SAVE_THE_DATE, CLASS)
   * - Admins CANNOT create TICKETED_EVENT or SEATED_EVENT (payment required)
   * - For ticketed events, organizers must create them directly
   * - Admin-posted content can be "claimed" by organizers later to add ticketing
   *
   * @param user The user attempting to create content
   * @param eventType Optional - the type of event being created
   */
  static canCreateContentAsOwner(
    user: Doc<"users"> | null | undefined,
    eventType?: string
  ): boolean {
    if (!user) return false;

    // Non-admins can always create content they're authorized for
    if (!this.isAdmin(user)) return true;

    // Admin check: if eventType provided, verify it's allowed
    if (eventType) {
      return (this.ADMIN_ALLOWED_EVENT_TYPES as readonly string[]).includes(eventType);
    }

    // Without eventType context, default to allowed for backwards compatibility
    // (actual event type check happens in the mutation)
    return true;
  }

  /**
   * Check if admin can create a specific event type
   */
  static canAdminCreateEventType(eventType: string): boolean {
    return (this.ADMIN_ALLOWED_EVENT_TYPES as readonly string[]).includes(eventType);
  }

  /**
   * Check if an event type is blocked for admins
   */
  static isEventTypeBlockedForAdmin(eventType: string): boolean {
    return (this.ADMIN_BLOCKED_EVENT_TYPES as readonly string[]).includes(eventType);
  }

  /**
   * Check if user can create content on behalf of another user
   * Only admins have this privilege
   */
  static canCreateOnBehalfOf(user: Doc<"users"> | null | undefined): boolean {
    if (!user) return false;
    return this.isAdmin(user);
  }

  /**
   * Check if a target user can be an owner of content
   *
   * Updated: Admins CAN own informational content (GENERAL_POSTING, etc.)
   * They just cannot own content that requires payment processing.
   */
  static canBeContentOwner(
    user: Doc<"users"> | null | undefined,
    eventType?: string
  ): boolean {
    if (!user) return false;

    // Non-admins can be owners
    if (!this.isAdmin(user)) return true;

    // Admins can own informational content
    if (eventType) {
      return (this.ADMIN_ALLOWED_EVENT_TYPES as readonly string[]).includes(eventType);
    }

    return true;
  }

  /**
   * Get error message for admin trying to create blocked content
   */
  static getAdminCannotOwnContentError(contentType: string): string {
    return `Admins cannot create ${contentType} with ticketing. ` +
      `Admin accounts can only post informational content (flyers). ` +
      `For ticketed events, the organizer must create them directly.`;
  }
}

/**
 * Convenience functions for common permission checks
 */

export function requireAdmin(user: Doc<"users"> | null | undefined): void {
  if (!PermissionChecker.isAdmin(user)) {
    throw new Error(PermissionChecker.getPermissionError("perform this action"));
  }
}

export function requireOrganizer(user: Doc<"users"> | null | undefined): void {
  if (!PermissionChecker.isOrganizer(user)) {
    throw new Error(PermissionChecker.getPermissionError("access organizer features"));
  }
}

export async function requireEventOrganizer(
  ctx: ConvexCtx,
  user: Doc<"users"> | null | undefined,
  eventId: Id<"events">
): Promise<void> {
  const event = await ctx.db.get(eventId);
  if (!PermissionChecker.isEventOrganizer(user, event)) {
    throw new Error(PermissionChecker.getPermissionError("manage this event"));
  }
}

export async function requireCanManageStaff(
  ctx: ConvexCtx,
  user: Doc<"users"> | null | undefined,
  staff: Doc<"eventStaff">
): Promise<void> {
  const canManage = await PermissionChecker.canManageStaff(ctx, user, staff);
  if (!canManage) {
    throw new Error(PermissionChecker.getPermissionError("manage this staff member"));
  }
}

// ==========================================
// RESTAURANT CONVENIENCE FUNCTIONS
// ==========================================

export function requireRestaurateur(user: Doc<"users"> | null | undefined): void {
  if (!PermissionChecker.isRestaurateur(user)) {
    throw new Error(PermissionChecker.getPermissionError("access restaurateur features"));
  }
}

export function requireRestaurantOwner(
  user: Doc<"users"> | null | undefined,
  restaurant: Doc<"restaurants"> | null | undefined
): void {
  if (!PermissionChecker.isRestaurantOwner(user, restaurant)) {
    throw new Error(PermissionChecker.getPermissionError("manage this restaurant"));
  }
}

// ==========================================
// ORGANIZER TEAM PERMISSION FUNCTIONS (Sprint 13.4)
// ==========================================

/**
 * Get a user's organizer team role for a specific organizer
 * Returns "OWNER" if the user is the organizer themselves
 */
export async function getOrganizerTeamRole(
  ctx: ConvexCtx,
  userId: Id<"users">,
  organizerId: Id<"users">
): Promise<OrganizerTeamRole | null> {
  // Check if user is the organizer (OWNER)
  if (userId === organizerId) {
    return ORGANIZER_TEAM_ROLES.OWNER;
  }

  // Check for team membership in eventStaff with null eventId (org-wide)
  const teamMember = await ctx.db
    .query("eventStaff")
    .withIndex("by_organizer", (q) => q.eq("organizerId", organizerId))
    .filter((q) => q.eq(q.field("staffUserId"), userId))
    .filter((q) => q.eq(q.field("eventId"), undefined)) // null = org-wide
    .filter((q) => q.eq(q.field("isActive"), true))
    .first();

  if (!teamMember) return null;

  // Map staff role to organizer team role
  switch (teamMember.role) {
    case "MANAGER":
      return ORGANIZER_TEAM_ROLES.MANAGER;
    case "SELLER":
    case "STAFF":
    case "TEAM_MEMBERS":
      return ORGANIZER_TEAM_ROLES.STAFF;
    case "ASSOCIATES":
      return ORGANIZER_TEAM_ROLES.VOLUNTEER;
    default:
      return ORGANIZER_TEAM_ROLES.VOLUNTEER;
  }
}

/**
 * Check if user has permission for a specific action as organizer team member
 */
export async function hasOrganizerTeamPermission(
  ctx: ConvexCtx,
  userId: Id<"users">,
  organizerId: Id<"users">,
  permission: string
): Promise<boolean> {
  const role = await getOrganizerTeamRole(ctx, userId, organizerId);
  if (!role) return false;
  return ORGANIZER_TEAM_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if user can assign a specific organizer team role
 */
export async function canAssignOrganizerTeamRole(
  ctx: ConvexCtx,
  assignerUserId: Id<"users">,
  organizerId: Id<"users">,
  targetRole: OrganizerTeamRole
): Promise<boolean> {
  const assignerRole = await getOrganizerTeamRole(ctx, assignerUserId, organizerId);
  if (!assignerRole) return false;
  return canAssignOrganizerRole(assignerRole, targetRole);
}

/**
 * Require user to have organizer team permission
 */
export async function requireOrganizerTeamPermission(
  ctx: ConvexCtx,
  userId: Id<"users">,
  organizerId: Id<"users">,
  permission: string
): Promise<void> {
  const hasPermission = await hasOrganizerTeamPermission(ctx, userId, organizerId, permission);
  if (!hasPermission) {
    throw new Error(PermissionChecker.getPermissionError(permission.replace(/_/g, " ")));
  }
}
