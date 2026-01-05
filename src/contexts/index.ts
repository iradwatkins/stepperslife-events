/**
 * Context exports for SteppersLife Events
 *
 * Usage:
 * ```tsx
 * import { useEventCart, EventCartProvider } from "@/contexts";
 * ```
 */

// Event cart (tickets, seats, hotels)
export {
  EventCartProvider,
  useEventCart,
  type EventCartItem,
  type TicketCartItem,
  type SeatCartItem,
  type HotelCartItem,
} from "./EventCartContext";
