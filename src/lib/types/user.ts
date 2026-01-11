/**
 * User Type Definitions
 *
 * Extended user types with profile fields for components.
 */

import { Id } from "@/convex/_generated/dataModel";

// User roles from schema
export type UserRole = "admin" | "organizer" | "instructor" | "restaurateur" | "user";

// Auth providers
export type AuthProvider = "password" | "google" | "magic_link";

// Base user type (core fields from schema)
export interface BaseUser {
  _id: Id<"users">;
  name?: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  role?: UserRole;
  authProvider?: AuthProvider;

  // Stripe fields
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;
  stripeAccountSetupComplete?: boolean;

  // PayPal fields
  paypalMerchantId?: string;
  paypalAccountSetupComplete?: boolean;

  // Payment preferences
  acceptsStripePayments?: boolean;
  acceptsPaypalPayments?: boolean;
  acceptsCashPayments?: boolean;

  // Permissions
  canCreateTicketedEvents?: boolean;

  // Timestamps
  createdAt?: number;
  updatedAt?: number;
}

// Extended user with profile fields (for profile pages)
export interface UserWithProfile extends BaseUser {
  phone?: string;
  dateOfBirth?: string;
}

// User stats (for admin/dashboard views)
export interface UserWithStats extends BaseUser {
  eventCount?: number;
  orderCount?: number;
  totalRevenue?: number;
}

// Organizer type (user with organizer-specific fields)
export interface Organizer extends BaseUser {
  role: "organizer" | "admin";
  stripeConnectedAccountId?: string;
  stripeAccountSetupComplete?: boolean;
  paypalMerchantId?: string;
  paypalAccountSetupComplete?: boolean;
}

// Type guard for organizer
export function isOrganizer(user: BaseUser): user is Organizer {
  return user.role === "organizer" || user.role === "admin";
}

// Type guard for admin
export function isAdmin(user: BaseUser): boolean {
  return user.role === "admin";
}

// Check if user can create ticketed events
export function canCreateTicketedEvents(user: BaseUser): boolean {
  if (user.role === "admin") return true;
  return user.canCreateTicketedEvents === true;
}
