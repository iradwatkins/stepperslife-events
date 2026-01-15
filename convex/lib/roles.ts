/**
 * Centralized Role Constants
 *
 * This file defines all user and staff roles used throughout the application.
 * Using constants prevents typos and makes role management more maintainable.
 *
 * @module roles
 */

/**
 * Platform administrator emails
 *
 * To add new admins, add their email to this array.
 * In the future, this could be moved to a database table for dynamic management.
 */
export const ADMIN_EMAILS = [
  "bobbygwatkins@gmail.com",
  "iradwatkins@gmail.com",
] as const;

/** Primary admin email for system operations */
export const PRIMARY_ADMIN_EMAIL = "bobbygwatkins@gmail.com";

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string): boolean {
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
}

/**
 * Main user roles for the platform
 */
export const USER_ROLES = {
  /** Platform administrator with full access */
  ADMIN: "admin",
  /** Event creator and manager */
  ORGANIZER: "organizer",
  /** Class instructor - can create and manage classes */
  INSTRUCTOR: "instructor",
  /** Restaurant owner - can create and manage restaurants */
  RESTAURATEUR: "restaurateur",
  /** Service provider - can list services in the directory */
  SERVICE_PROVIDER: "service_provider",
  /** Regular customer/ticket buyer */
  USER: "user",
} as const;

/**
 * Staff roles for event-specific staff members
 *
 * NEW SIMPLIFIED MODEL (2 roles):
 * - MANAGER: Full access to sales, can invite their own sellers
 *   - Can sell all ticket tiers
 *   - Can earn commission + override on team sales
 *   - Can invite SELLERS via self-service link
 *   - Can scan tickets if canScan is enabled
 *
 * - SELLER: Assigned sellers who earn commission on their sales
 *   - Can sell assigned ticket tiers
 *   - Earns commission on own sales only
 *   - Can scan tickets if canScan is enabled
 *
 * LEGACY ROLES (kept for backward compatibility):
 * - STAFF: Maps to MANAGER with canScan=true
 * - TEAM_MEMBERS: Maps to MANAGER
 * - ASSOCIATES: Maps to SELLER
 */
export const STAFF_ROLES = {
  // New simplified roles
  /** Manager - Full access, can invite sellers, can scan if enabled */
  MANAGER: "MANAGER",
  /** Seller - Sells assigned tiers, earns commission, can scan if enabled */
  SELLER: "SELLER",

  // Legacy roles (kept for backward compatibility)
  /** @deprecated Use MANAGER with canScan=true instead */
  STAFF: "STAFF",
  /** @deprecated Use MANAGER instead */
  TEAM_MEMBERS: "TEAM_MEMBERS",
  /** @deprecated Use SELLER instead */
  ASSOCIATES: "ASSOCIATES",
} as const;

/**
 * Map legacy roles to new simplified roles
 */
export function mapToNewRole(role: StaffRole): "MANAGER" | "SELLER" {
  switch (role) {
    case "MANAGER":
      return "MANAGER";
    case "SELLER":
      return "SELLER";
    case "STAFF":
    case "TEAM_MEMBERS":
      return "MANAGER";
    case "ASSOCIATES":
      return "SELLER";
    default:
      return "SELLER";
  }
}

/**
 * Check if a role is a manager-level role (can invite sellers)
 */
export function isManagerRole(role: StaffRole): boolean {
  return role === "MANAGER" || role === "STAFF" || role === "TEAM_MEMBERS";
}

/**
 * Check if a role is a seller-level role
 */
export function isSellerRole(role: StaffRole): boolean {
  return role === "SELLER" || role === "ASSOCIATES";
}

/**
 * Organizer Team Roles (Sprint 13.4)
 *
 * These are roles for people who help manage ALL events for an organizer.
 * Different from event-specific staff roles (MANAGER, SELLER) which are per-event.
 *
 * HIERARCHY:
 * - OWNER: The organizer themselves (has full control)
 * - MANAGER: Can manage events and team, limited role assignment
 * - STAFF: Can assist with events, no role assignment
 * - VOLUNTEER: Limited access, specific event duties
 */
export const ORGANIZER_TEAM_ROLES = {
  /** Full control - the organizer account itself */
  OWNER: "OWNER",
  /** Can manage events and team, limited role assignment */
  MANAGER: "MANAGER",
  /** Can assist with events, no role assignment */
  STAFF: "STAFF",
  /** Limited access, specific event duties */
  VOLUNTEER: "VOLUNTEER",
} as const;

/** Organizer team role type */
export type OrganizerTeamRole = (typeof ORGANIZER_TEAM_ROLES)[keyof typeof ORGANIZER_TEAM_ROLES];

/**
 * Permissions granted to each organizer team role
 */
export const ORGANIZER_TEAM_PERMISSIONS: Record<OrganizerTeamRole, string[]> = {
  OWNER: [
    "manage_events",
    "manage_team",
    "assign_roles",
    "view_analytics",
    "manage_payments",
    "delete_team_members",
    "view_payouts",
    "manage_settings",
  ],
  MANAGER: [
    "manage_events",
    "view_team",
    "assign_staff",
    "assign_volunteers",
    "view_analytics",
    "manage_staff_sales",
  ],
  STAFF: [
    "view_events",
    "scan_tickets",
    "sell_tickets",
    "view_own_stats",
    "manage_door",
  ],
  VOLUNTEER: [
    "view_assigned_events",
    "scan_tickets",
  ],
};

/**
 * Check if an organizer team role can assign another role
 */
export function canAssignOrganizerRole(
  assignerRole: OrganizerTeamRole,
  targetRole: OrganizerTeamRole
): boolean {
  // OWNER can assign any role
  if (assignerRole === "OWNER") return true;

  // MANAGER can only assign STAFF and VOLUNTEER
  if (assignerRole === "MANAGER") {
    return targetRole === "STAFF" || targetRole === "VOLUNTEER";
  }

  // STAFF and VOLUNTEER cannot assign roles
  return false;
}

/**
 * Check if an organizer team role has a specific permission
 */
export function hasOrganizerTeamPermission(
  role: OrganizerTeamRole,
  permission: string
): boolean {
  return ORGANIZER_TEAM_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get human-readable name for organizer team role
 */
export function getOrganizerTeamRoleName(role: OrganizerTeamRole): string {
  const names: Record<OrganizerTeamRole, string> = {
    OWNER: "Owner",
    MANAGER: "Manager",
    STAFF: "Staff",
    VOLUNTEER: "Volunteer",
  };
  return names[role] || role;
}

/**
 * Get description for organizer team role
 */
export function getOrganizerTeamRoleDescription(role: OrganizerTeamRole): string {
  const descriptions: Record<OrganizerTeamRole, string> = {
    OWNER: "Full control over all events, team members, payments, and settings",
    MANAGER: "Can manage events and team, assign staff and volunteers, view analytics",
    STAFF: "Can assist with events, scan tickets, sell tickets, manage door operations",
    VOLUNTEER: "Limited access to assigned events and ticket scanning only",
  };
  return descriptions[role] || "Unknown role";
}

/**
 * Type guard to check if a value is a valid organizer team role
 */
export function isOrganizerTeamRole(value: unknown): value is OrganizerTeamRole {
  return Object.values(ORGANIZER_TEAM_ROLES).includes(value as OrganizerTeamRole);
}

/**
 * Staff roles for restaurant-specific staff members
 *
 * HIERARCHY:
 * - OWNER: The restaurant owner (linked via ownerId, has full control)
 *   - Full access to all restaurant features
 *   - Can delete restaurant, manage billing, process refunds
 *
 * - RESTAURANT_MANAGER: Operations manager
 *   - Can manage menu, hours, orders, analytics, and staff
 *   - Cannot access billing, delete restaurant, or transfer ownership
 *   - Cannot process refunds
 *
 * - RESTAURANT_STAFF: Order fulfillment staff
 *   - Can view and update order status only
 *   - Cannot modify menu, hours, settings, or view analytics
 */
export const RESTAURANT_STAFF_ROLES = {
  /** Operations manager - menu, orders, hours, analytics, staff management */
  RESTAURANT_MANAGER: "RESTAURANT_MANAGER",
  /** Order fulfillment - view orders and update status only */
  RESTAURANT_STAFF: "RESTAURANT_STAFF",
} as const;

/**
 * Hierarchy configuration
 */
export const HIERARCHY_CONFIG = {
  /** Maximum depth of sub-seller hierarchy to prevent performance issues */
  MAX_DEPTH: 5,
  /** Initial hierarchy level for organizer-assigned staff */
  ROOT_LEVEL: 1,
} as const;

/**
 * Commission types
 */
export const COMMISSION_TYPES = {
  /** Commission calculated as percentage of ticket price */
  PERCENTAGE: "PERCENTAGE",
  /** Fixed dollar amount commission per ticket */
  FIXED: "FIXED",
} as const;

/**
 * Transfer status types
 */
export const TRANSFER_STATUS = {
  /** Transfer request pending recipient action */
  PENDING: "PENDING",
  /** Transfer accepted and completed */
  ACCEPTED: "ACCEPTED",
  /** Transfer rejected by recipient */
  REJECTED: "REJECTED",
  /** Transfer cancelled by sender */
  CANCELLED: "CANCELLED",
  /** Transfer expired due to time limit */
  AUTO_EXPIRED: "AUTO_EXPIRED",
} as const;

/**
 * Transfer expiration configuration
 */
export const TRANSFER_CONFIG = {
  /** Transfer expiration time in milliseconds (48 hours) */
  EXPIRATION_MS: 48 * 60 * 60 * 1000,
  /** Reminder time before expiration (24 hours) */
  REMINDER_MS: 24 * 60 * 60 * 1000,
} as const;

// TypeScript types derived from constants

/** User role type */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Staff role type */
export type StaffRole = (typeof STAFF_ROLES)[keyof typeof STAFF_ROLES];

/** Restaurant staff role type */
export type RestaurantStaffRole = (typeof RESTAURANT_STAFF_ROLES)[keyof typeof RESTAURANT_STAFF_ROLES];

/** Commission type */
export type CommissionType = (typeof COMMISSION_TYPES)[keyof typeof COMMISSION_TYPES];

/** Transfer status type */
export type TransferStatus = (typeof TRANSFER_STATUS)[keyof typeof TRANSFER_STATUS];

/**
 * Type guard to check if a value is a valid user role
 */
export function isUserRole(value: unknown): value is UserRole {
  return Object.values(USER_ROLES).includes(value as UserRole);
}

/**
 * Type guard to check if a value is a valid staff role
 */
export function isStaffRole(value: unknown): value is StaffRole {
  return Object.values(STAFF_ROLES).includes(value as StaffRole);
}

/**
 * Type guard to check if a value is a valid restaurant staff role
 */
export function isRestaurantStaffRole(value: unknown): value is RestaurantStaffRole {
  return Object.values(RESTAURANT_STAFF_ROLES).includes(value as RestaurantStaffRole);
}

/**
 * Type guard to check if a value is a valid transfer status
 */
export function isTransferStatus(value: unknown): value is TransferStatus {
  return Object.values(TRANSFER_STATUS).includes(value as TransferStatus);
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole | StaffRole | RestaurantStaffRole): string {
  const roleNames: Record<UserRole | StaffRole | RestaurantStaffRole, string> = {
    [USER_ROLES.ADMIN]: "Administrator",
    [USER_ROLES.ORGANIZER]: "Event Organizer",
    [USER_ROLES.INSTRUCTOR]: "Class Instructor",
    [USER_ROLES.RESTAURATEUR]: "Restaurateur",
    [USER_ROLES.SERVICE_PROVIDER]: "Service Provider",
    [USER_ROLES.USER]: "User",
    // New simplified roles
    [STAFF_ROLES.MANAGER]: "Manager",
    [STAFF_ROLES.SELLER]: "Seller",
    // Legacy roles
    [STAFF_ROLES.STAFF]: "Door Staff",
    [STAFF_ROLES.TEAM_MEMBERS]: "Team Member",
    [STAFF_ROLES.ASSOCIATES]: "Associate",
    [RESTAURANT_STAFF_ROLES.RESTAURANT_MANAGER]: "Restaurant Manager",
    [RESTAURANT_STAFF_ROLES.RESTAURANT_STAFF]: "Restaurant Staff",
  };
  return roleNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole | StaffRole | RestaurantStaffRole): string {
  const descriptions: Record<UserRole | StaffRole | RestaurantStaffRole, string> = {
    [USER_ROLES.ADMIN]: "Full platform access with ability to manage all events and users",
    [USER_ROLES.ORGANIZER]: "Create and manage events, ticket tiers, and staff members",
    [USER_ROLES.INSTRUCTOR]: "Create and manage dance classes, enrollments, and class schedules",
    [USER_ROLES.RESTAURATEUR]: "Create and manage restaurants, menus, orders, and restaurant staff",
    [USER_ROLES.SERVICE_PROVIDER]: "List your services in the directory for customers to find and contact you",
    [USER_ROLES.USER]: "Browse events and purchase tickets",
    // New simplified roles
    [STAFF_ROLES.MANAGER]:
      "Full sales access - can sell all tiers, invite sellers, and earn override commission on team sales. Can scan if enabled.",
    [STAFF_ROLES.SELLER]:
      "Ticket seller - sells assigned tiers and earns commission. Can scan if enabled.",
    // Legacy roles
    [STAFF_ROLES.STAFF]:
      "Scan and validate tickets at event entrance, can sell if organizer permits",
    [STAFF_ROLES.TEAM_MEMBERS]:
      "Business partner - can earn up to 100% commission, can assign Associates as sub-sellers",
    [STAFF_ROLES.ASSOCIATES]:
      "Sub-seller assigned by a Team Member - receives ticket allocation and earns commission from sales",
    [RESTAURANT_STAFF_ROLES.RESTAURANT_MANAGER]:
      "Restaurant operations manager - can manage menu, hours, orders, analytics, and staff",
    [RESTAURANT_STAFF_ROLES.RESTAURANT_STAFF]:
      "Restaurant order fulfillment - can view orders and update order status",
  };
  return descriptions[role] || "Unknown role";
}
