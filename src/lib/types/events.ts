/**
 * Event Type Definitions
 *
 * Shared types for events bridging Convex schema and component props.
 * These types ensure consistency between backend data and UI components.
 */

import { Id } from "@/convex/_generated/dataModel";

// Event types from schema - must match convex/schema.ts exactly
export type EventType =
  | "SAVE_THE_DATE"
  | "FREE_EVENT"
  | "GENERAL_POSTING"  // Information-only event, no tickets
  | "TICKETED_EVENT"
  | "SEATED_EVENT"
  | "CLASS";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export type EventSubType =
  | "weekender"
  | "set"
  | "ball"
  | "workshop"
  | "social";

export type DressCode =
  | "all_white"
  | "black_tie"
  | "stepping_attire"
  | "casual"
  | "theme";

// Location types
export interface EventLocation {
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Base event type (core fields)
export interface BaseEvent {
  _id: Id<"events">;
  name: string;
  description: string;
  eventType?: EventType;
  status?: EventStatus;
  organizerId?: Id<"users">;
  organizerName?: string;

  // Date/time
  eventDateLiteral?: string;
  eventTimeLiteral?: string;
  eventTimezone?: string;
  startDate?: number;
  endDate?: number;

  // Location
  location?: EventLocation | string;

  // Media
  images?: Id<"_storage">[];
  imageUrl?: string;

  // Categories
  categories?: string[];

  // Culture fields
  eventSubType?: EventSubType;
  dressCode?: DressCode;
  dressCodeDetails?: string;
  beginnerFriendly?: boolean;
  hasBeginnerLesson?: boolean;
  beginnerLessonTime?: string;

  // Settings
  capacity?: number;
  ticketsSold?: number;
  ticketTierCount?: number;
  allowWaitlist?: boolean;
  allowTransfers?: boolean;
  maxTicketsPerOrder?: number;
  minTicketsPerOrder?: number;

  // Timestamps
  createdAt?: number;
  updatedAt?: number;
}

// Public event with computed fields
export interface PublicEvent extends BaseEvent {
  hasHotels?: boolean;
  hotelCount?: number;
  isFeatured?: boolean;
  isUpcoming?: boolean;
  ticketsAvailable?: boolean;
}

// Event card props (subset for display components)
export interface EventCardProps {
  _id: string | Id<"events">;
  name: string;
  description: string;
  eventType?: EventType;
  eventDateLiteral?: string;
  eventTimeLiteral?: string;
  location?: EventLocation | string;
  categories?: string[];
  imageUrl?: string;
  isFeatured?: boolean;
  hasHotels?: boolean;
  hotelCount?: number;
}

// Type guard for event card props
export function isValidEventForCard(event: unknown): event is EventCardProps {
  if (!event || typeof event !== "object") return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e._id === "string" &&
    typeof e.name === "string" &&
    typeof e.description === "string"
  );
}

// Helper to get location string
export function getLocationString(location?: EventLocation | string): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  const parts = [location.city, location.state].filter(Boolean);
  return parts.join(", ");
}

// Helper to get venue name
export function getVenueName(location?: EventLocation | string): string | undefined {
  if (!location) return undefined;
  if (typeof location === "string") return undefined;
  return location.venueName;
}

// Event list item type (for list/grid views)
export interface EventListItem extends EventCardProps {
  startDate?: number;
  endDate?: number;
  timezone?: string;
  ticketsVisible?: boolean;
  ticketsSold?: number;
  capacity?: number;
  status?: EventStatus;
  organizerId?: string;
  organizerName?: string;
}
