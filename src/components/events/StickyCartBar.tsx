"use client";

import React from "react";
import { useEventCart } from "@/contexts/EventCartContext";
import { ShoppingCart, Ticket, Users, Hotel, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface StickyCartBarProps {
  eventId: string;
  className?: string;
}

export function StickyCartBar({ eventId, className = "" }: StickyCartBarProps) {
  const {
    getItemCount,
    getSubtotalCents,
    getTicketCount,
    getSeatCount,
    getHotelRoomCount,
    isCartOpen,
    setIsCartOpen,
  } = useEventCart();

  const itemCount = getItemCount();
  const subtotalCents = getSubtotalCents();
  const ticketCount = getTicketCount();
  const seatCount = getSeatCount();
  const hotelCount = getHotelRoomCount();

  // Don't show if cart is empty
  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl ${className}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Cart Summary */}
            <button
              type="button"
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex items-center gap-3 text-left"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {ticketCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3 h-3" />
                      {ticketCount}
                    </span>
                  )}
                  {seatCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {seatCount} seats
                    </span>
                  )}
                  {hotelCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Hotel className="w-3 h-3" />
                      {hotelCount} room{hotelCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="font-bold text-lg text-foreground">
                  ${(subtotalCents / 100).toFixed(2)}
                </p>
              </div>

              {/* Mobile: Just show total */}
              <div className="sm:hidden">
                <p className="text-xs text-muted-foreground">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </p>
                <p className="font-bold text-foreground">
                  ${(subtotalCents / 100).toFixed(2)}
                </p>
              </div>
            </button>

            {/* Checkout Button */}
            <Link
              href={`/events/${eventId}/checkout`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
            >
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Expandable Cart Preview */}
          <AnimatePresence>
            {isCartOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <CartPreview eventId={eventId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CartPreview({ eventId }: { eventId: string }) {
  const { getCheckoutItems, removeTicket, removeSeats, removeHotelRoom, clearCart } = useEventCart();
  const { tickets, seats, hotels } = getCheckoutItems();

  return (
    <div className="py-4 space-y-4 max-h-[40vh] overflow-y-auto">
      {/* Tickets */}
      {tickets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Tickets
          </h4>
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm">{ticket.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.quantity} x ${(ticket.unitPriceCents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">
                    ${((ticket.unitPriceCents * ticket.quantity) / 100).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeTicket(ticket.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seats */}
      {seats.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Table Seats
          </h4>
          <div className="space-y-2">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm">Table {seat.tableNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Seats: {seat.seatNumbers.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">
                    ${((seat.unitPriceCents * seat.quantity) / 100).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSeats(seat.tableId)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels */}
      {hotels.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            Hotel Rooms
          </h4>
          <div className="space-y-2">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm">{hotel.hotelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {hotel.roomTypeName} - {hotel.numberOfRooms} room{hotel.numberOfRooms > 1 ? "s" : ""}, {hotel.nights} night{hotel.nights > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">
                    ${(hotel.totalCents / 100).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeHotelRoom(hotel.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Cart */}
      <div className="pt-2 border-t border-border flex justify-between items-center">
        <button
          type="button"
          onClick={() => clearCart()}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear cart
        </button>
        <Link
          href={`/events/${eventId}/checkout`}
          className="text-sm text-primary hover:underline"
        >
          View full checkout →
        </Link>
      </div>
    </div>
  );
}
