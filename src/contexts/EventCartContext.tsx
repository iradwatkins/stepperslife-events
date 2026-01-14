"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

/**
 * EventCartContext - Unified cart for event purchases
 *
 * Manages tickets, table seats, and hotel rooms in a single cart
 * scoped to a specific event. Data is persisted per-event in sessionStorage.
 */

// Cart item types
export interface TicketCartItem {
  type: "ticket";
  id: string; // tierId
  name: string;
  description?: string;
  quantity: number;
  unitPriceCents: number;
}

export interface SeatCartItem {
  type: "seat";
  id: string; // unique id for this seat group
  tableId: string;
  tableNumber: string | number;
  seatIds: string[];
  seatNumbers: string[];
  quantity: number; // number of seats
  unitPriceCents: number; // price per seat
}

export interface HotelCartItem {
  type: "hotel";
  id: string; // packageId + roomTypeId
  packageId: string;
  hotelName: string;
  roomTypeId: string;
  roomTypeName: string;
  checkInDate: number; // timestamp
  checkOutDate: number; // timestamp
  nights: number;
  numberOfRooms: number;
  numberOfGuests: number;
  unitPriceCents: number; // price per night per room
  platformFeeCents: number;
  totalCents: number;
}

export type EventCartItem = TicketCartItem | SeatCartItem | HotelCartItem;

interface EventCartContextType {
  eventId: string | null;
  items: EventCartItem[];

  // Initialization
  setEventId: (eventId: string) => void;

  // Ticket operations
  addTicket: (tier: { id: string; name: string; description?: string; priceCents: number }, quantity: number) => void;
  updateTicketQuantity: (tierId: string, quantity: number) => void;
  removeTicket: (tierId: string) => void;
  getTicketQuantity: (tierId: string) => number;

  // Seat operations
  addSeats: (table: { id: string; number: string | number }, seats: Array<{ id: string; number: string }>, pricePerSeatCents: number) => void;
  removeSeats: (tableId: string) => void;
  clearAllSeats: () => void;
  getSelectedSeats: () => SeatCartItem[];

  // Hotel operations
  addHotelRoom: (hotel: {
    packageId: string;
    hotelName: string;
    roomTypeId: string;
    roomTypeName: string;
    checkInDate: number;
    checkOutDate: number;
    nights: number;
    numberOfRooms: number;
    numberOfGuests: number;
    pricePerNightCents: number;
    platformFeeCents: number;
    totalCents: number;
  }) => void;
  updateHotelRoom: (id: string, updates: Partial<HotelCartItem>) => void;
  removeHotelRoom: (id: string) => void;

  // Cart totals
  getSubtotalCents: () => number;
  getItemCount: () => number;
  getTicketCount: () => number;
  getSeatCount: () => number;
  getHotelRoomCount: () => number;

  // Cart state
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // For checkout
  getCheckoutItems: () => {
    tickets: TicketCartItem[];
    seats: SeatCartItem[];
    hotels: HotelCartItem[];
  };
}

const EventCartContext = createContext<EventCartContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = "event_cart_";

export function EventCartProvider({ children }: { children: ReactNode }) {
  const [eventId, setEventIdState] = useState<string | null>(null);
  const [items, setItems] = useState<EventCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from sessionStorage when eventId changes
  // This synchronizes React state with sessionStorage (external system)
  useEffect(() => {
    if (eventId) {
      const key = `${STORAGE_KEY_PREFIX}${eventId}`;
      const saved = sessionStorage.getItem(key);
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to load event cart:", error);
          setItems([]);
        }
      } else {
        setItems([]);
      }
      setIsLoaded(true);
    }
  }, [eventId]);

  // Save cart to sessionStorage whenever items change
  useEffect(() => {
    if (eventId && isLoaded) {
      const key = `${STORAGE_KEY_PREFIX}${eventId}`;
      if (items.length > 0) {
        sessionStorage.setItem(key, JSON.stringify(items));
      } else {
        sessionStorage.removeItem(key);
      }
    }
  }, [eventId, items, isLoaded]);

  const setEventId = useCallback((id: string) => {
    setEventIdState(id);
  }, []);

  // Ticket operations
  const addTicket = useCallback((
    tier: { id: string; name: string; description?: string; priceCents: number },
    quantity: number
  ) => {
    if (quantity <= 0) return;

    setItems(current => {
      const existing = current.find(
        item => item.type === "ticket" && item.id === tier.id
      ) as TicketCartItem | undefined;

      if (existing) {
        return current.map(item =>
          item.type === "ticket" && item.id === tier.id
            ? { ...item, quantity: existing.quantity + quantity }
            : item
        );
      }

      return [...current, {
        type: "ticket" as const,
        id: tier.id,
        name: tier.name,
        description: tier.description,
        quantity,
        unitPriceCents: tier.priceCents,
      }];
    });
  }, []);

  const updateTicketQuantity = useCallback((tierId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(current => current.filter(
        item => !(item.type === "ticket" && item.id === tierId)
      ));
      return;
    }

    setItems(current => current.map(item =>
      item.type === "ticket" && item.id === tierId
        ? { ...item, quantity }
        : item
    ));
  }, []);

  const removeTicket = useCallback((tierId: string) => {
    setItems(current => current.filter(
      item => !(item.type === "ticket" && item.id === tierId)
    ));
  }, []);

  const getTicketQuantity = useCallback((tierId: string): number => {
    const ticket = items.find(
      item => item.type === "ticket" && item.id === tierId
    ) as TicketCartItem | undefined;
    return ticket?.quantity ?? 0;
  }, [items]);

  // Seat operations
  const addSeats = useCallback((
    table: { id: string; number: string | number },
    seats: Array<{ id: string; number: string }>,
    pricePerSeatCents: number
  ) => {
    if (seats.length === 0) return;

    setItems(current => {
      // Remove any existing seats for this table first
      const filtered = current.filter(
        item => !(item.type === "seat" && item.tableId === table.id)
      );

      return [...filtered, {
        type: "seat" as const,
        id: `${table.id}_${Date.now()}`,
        tableId: table.id,
        tableNumber: table.number,
        seatIds: seats.map(s => s.id),
        seatNumbers: seats.map(s => s.number),
        quantity: seats.length,
        unitPriceCents: pricePerSeatCents,
      }];
    });
  }, []);

  const removeSeats = useCallback((tableId: string) => {
    setItems(current => current.filter(
      item => !(item.type === "seat" && item.tableId === tableId)
    ));
  }, []);

  const clearAllSeats = useCallback(() => {
    setItems(current => current.filter(item => item.type !== "seat"));
  }, []);

  const getSelectedSeats = useCallback((): SeatCartItem[] => {
    return items.filter(item => item.type === "seat") as SeatCartItem[];
  }, [items]);

  // Hotel operations
  const addHotelRoom = useCallback((hotel: {
    packageId: string;
    hotelName: string;
    roomTypeId: string;
    roomTypeName: string;
    checkInDate: number;
    checkOutDate: number;
    nights: number;
    numberOfRooms: number;
    numberOfGuests: number;
    pricePerNightCents: number;
    platformFeeCents: number;
    totalCents: number;
  }) => {
    const id = `${hotel.packageId}_${hotel.roomTypeId}`;

    setItems(current => {
      // Replace existing hotel booking for same room type
      const filtered = current.filter(
        item => !(item.type === "hotel" && item.id === id)
      );

      return [...filtered, {
        type: "hotel" as const,
        id,
        packageId: hotel.packageId,
        hotelName: hotel.hotelName,
        roomTypeId: hotel.roomTypeId,
        roomTypeName: hotel.roomTypeName,
        checkInDate: hotel.checkInDate,
        checkOutDate: hotel.checkOutDate,
        nights: hotel.nights,
        numberOfRooms: hotel.numberOfRooms,
        numberOfGuests: hotel.numberOfGuests,
        unitPriceCents: hotel.pricePerNightCents,
        platformFeeCents: hotel.platformFeeCents,
        totalCents: hotel.totalCents,
      }];
    });
  }, []);

  const updateHotelRoom = useCallback((id: string, updates: Partial<HotelCartItem>) => {
    setItems(current => current.map(item =>
      item.type === "hotel" && item.id === id
        ? { ...item, ...updates }
        : item
    ));
  }, []);

  const removeHotelRoom = useCallback((id: string) => {
    setItems(current => current.filter(
      item => !(item.type === "hotel" && item.id === id)
    ));
  }, []);

  // Cart totals
  const getSubtotalCents = useCallback((): number => {
    return items.reduce((total, item) => {
      switch (item.type) {
        case "ticket":
          return total + (item.unitPriceCents * item.quantity);
        case "seat":
          return total + (item.unitPriceCents * item.quantity);
        case "hotel":
          return total + item.totalCents;
        default:
          return total;
      }
    }, 0);
  }, [items]);

  const getItemCount = useCallback((): number => {
    return items.reduce((count, item) => {
      switch (item.type) {
        case "ticket":
          return count + item.quantity;
        case "seat":
          return count + item.quantity;
        case "hotel":
          return count + item.numberOfRooms;
        default:
          return count;
      }
    }, 0);
  }, [items]);

  const getTicketCount = useCallback((): number => {
    return items
      .filter(item => item.type === "ticket")
      .reduce((count, item) => count + (item as TicketCartItem).quantity, 0);
  }, [items]);

  const getSeatCount = useCallback((): number => {
    return items
      .filter(item => item.type === "seat")
      .reduce((count, item) => count + (item as SeatCartItem).quantity, 0);
  }, [items]);

  const getHotelRoomCount = useCallback((): number => {
    return items
      .filter(item => item.type === "hotel")
      .reduce((count, item) => count + (item as HotelCartItem).numberOfRooms, 0);
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (eventId) {
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${eventId}`);
    }
  }, [eventId]);

  const getCheckoutItems = useCallback(() => {
    return {
      tickets: items.filter(item => item.type === "ticket") as TicketCartItem[],
      seats: items.filter(item => item.type === "seat") as SeatCartItem[],
      hotels: items.filter(item => item.type === "hotel") as HotelCartItem[],
    };
  }, [items]);

  return (
    <EventCartContext.Provider
      value={{
        eventId,
        items,
        setEventId,
        addTicket,
        updateTicketQuantity,
        removeTicket,
        getTicketQuantity,
        addSeats,
        removeSeats,
        clearAllSeats,
        getSelectedSeats,
        addHotelRoom,
        updateHotelRoom,
        removeHotelRoom,
        getSubtotalCents,
        getItemCount,
        getTicketCount,
        getSeatCount,
        getHotelRoomCount,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        getCheckoutItems,
      }}
    >
      {children}
    </EventCartContext.Provider>
  );
}

export function useEventCart() {
  const context = useContext(EventCartContext);
  if (context === undefined) {
    throw new Error("useEventCart must be used within an EventCartProvider");
  }
  return context;
}
