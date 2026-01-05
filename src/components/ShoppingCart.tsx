"use client";

import { useEventCart, TicketCartItem, SeatCartItem, HotelCartItem } from "@/contexts/EventCartContext";
import { X, Trash2, Plus, Minus, ShoppingBag, Ticket, Armchair, Hotel, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function ShoppingCart() {
  const {
    items,
    eventId,
    updateTicketQuantity,
    removeTicket,
    removeSeats,
    removeHotelRoom,
    getSubtotalCents,
    getItemCount,
    isCartOpen,
    setIsCartOpen,
  } = useEventCart();

  const router = useRouter();
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const handleCheckout = () => {
    if (!currentUser) {
      toast("Sign in required", {
        description: "Please sign in to complete your purchase",
        action: {
          label: "Sign In",
          onClick: () => {
            setIsCartOpen(false);
            router.push(`/login?redirect=/events/${eventId}/checkout`);
          },
        },
        icon: <LogIn className="w-4 h-4" />,
      });
      return;
    }
    setIsCartOpen(false);
    router.push(`/events/${eventId}/checkout`);
  };

  if (!isCartOpen) return null;

  const tickets = items.filter((item): item is TicketCartItem => item.type === "ticket");
  const seats = items.filter((item): item is SeatCartItem => item.type === "seat");
  const hotels = items.filter((item): item is HotelCartItem => item.type === "hotel");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCartOpen(false);
          }
        }}
        aria-label="Close cart"
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Your Cart</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Ticket className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add tickets or seats to get started</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tickets Section */}
              {tickets.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                    <Ticket className="w-4 h-4" />
                    Tickets
                  </h3>
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{ticket.name}</h4>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          ${(ticket.unitPriceCents / 100).toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-input rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateTicketQuantity(ticket.id, ticket.quantity - 1)}
                              className="p-1 hover:bg-muted rounded-l-lg"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 font-semibold min-w-[2rem] text-center">
                              {ticket.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateTicketQuantity(ticket.id, ticket.quantity + 1)}
                              className="p-1 hover:bg-muted rounded-r-lg"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTicket(ticket.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            aria-label="Remove ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          ${((ticket.unitPriceCents * ticket.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seats Section */}
              {seats.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                    <Armchair className="w-4 h-4" />
                    Table Seats
                  </h3>
                  {seats.map((seat) => (
                    <div key={seat.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">Table {seat.tableNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          Seats: {seat.seatNumbers.join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${(seat.unitPriceCents / 100).toFixed(2)} per seat x {seat.quantity}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-foreground">
                          ${((seat.unitPriceCents * seat.quantity) / 100).toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeSeats(seat.tableId)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Remove seats"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hotels Section */}
              {hotels.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
                    <Hotel className="w-4 h-4" />
                    Hotel Rooms
                  </h3>
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{hotel.hotelName}</h4>
                        <p className="text-sm text-muted-foreground">{hotel.roomTypeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {hotel.numberOfRooms} room(s) x {hotel.nights} night(s)
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-foreground">
                          ${(hotel.totalCents / 100).toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeHotelRoom(hotel.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Remove hotel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Subtotal ({getItemCount()} items)</span>
              <span className="font-bold text-foreground">${(getSubtotalCents() / 100).toFixed(2)}</span>
            </div>

            <p className="text-sm text-muted-foreground">Service fees calculated at checkout</p>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full px-6 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
