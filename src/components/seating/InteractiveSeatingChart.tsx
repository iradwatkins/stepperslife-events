"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import BuyTableButton from "./BuyTableButton";
import TableCapacityIndicator from "./TableCapacityIndicator";
import AccessibilityFilters, { type SeatFilters } from "./AccessibilityFilters";
import { toast } from "sonner";

interface InteractiveSeatingChartProps {
  eventId: Id<"events">;
  onSeatSelect: (seat: SelectedSeat) => void;
  onSeatDeselect: (seatId: string) => void;
  selectedSeats: SelectedSeat[];
  className?: string;
}

export interface SelectedSeat {
  id: string; // Format: "tableId-seatNumber"
  tableId: string;
  tableNumber: string | number;
  seatNumber: string;
  seatType: string;
  price: number;
}

interface SeatRenderData {
  id: string;
  x: number;
  y: number;
  number: string;
  status: "available" | "selected" | "sold" | "reserved";
  type: string;
  price: number;
}

export default function InteractiveSeatingChart({
  eventId,
  onSeatSelect,
  onSeatDeselect,
  selectedSeats,
  className = "",
}: InteractiveSeatingChartProps) {
  const seatingChart = useQuery(api.seating.queries.getPublicSeatingChart, { eventId });
  const ticketTiers = useQuery(api.events.queries.getEventTicketTiers, { eventId });

  const holdSeats = useMutation(api.seating.mutations.holdSeatsForSession);
  const releaseSeats = useMutation(api.seating.mutations.releaseSessionHolds);
  const cleanupExpired = useMutation(api.seating.mutations.cleanupExpiredSessionHolds);

  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  );
  const cleanupIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Accessibility filters
  const [seatFilters, setSeatFilters] = useState<SeatFilters>({
    showWheelchair: true,
    showVIP: true,
    showStandard: true,
    wheelchairOnly: false,
  });

  // Cleanup expired holds every 30 seconds
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      cleanupExpired({ eventId }).catch(console.error);
    }, 30000);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      // Release all seats when component unmounts
      releaseSeats({ eventId, sessionId }).catch(console.error);
    };
  }, [eventId, sessionId]);

  if (!seatingChart) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isSeatSelected = (seatId: string) => {
    return selectedSeats.some((s) => s.id === seatId);
  };

  const handleSeatClick = async (
    tableId: string,
    tableNumber: string | number,
    seatNumber: string,
    seatType: string,
    status: string,
    price: number
  ) => {
    if (status === "sold" || status === "reserved") return;

    const seatId = `${tableId}-${seatNumber}`;

    if (isSeatSelected(seatId)) {
      // Release the hold on this seat
      try {
        await releaseSeats({
          eventId,
          sessionId,
          seats: [{ tableId, seatNumber }],
        });
        onSeatDeselect(seatId);
      } catch (error) {
        console.error("Failed to release seat:", error);
      }
    } else {
      // Try to hold the seat
      try {
        await holdSeats({
          eventId,
          sessionId,
          seats: [{ tableId, seatNumber }],
        });

        onSeatSelect({
          id: seatId,
          tableId,
          tableNumber,
          seatNumber,
          seatType,
          price,
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to select seat. It may have been taken by another user.");
      }
    }
  };

  const handleSeatHover = (seatId: string, event: React.MouseEvent) => {
    setHoveredSeat(seatId);
    setTooltipPos({ x: event.clientX, y: event.clientY });
  };

  // Buy entire table handler
  const handleBuyTable = async (
    tableId: string,
    tableNumber: string | number,
    availableSeats: any[]
  ) => {
    try {
      const seatHolds = availableSeats.map((seat) => ({
        tableId,
        seatNumber: seat.number,
      }));

      await holdSeats({
        eventId,
        sessionId,
        seats: seatHolds,
      });

      // Add all seats to selection
      const seatPrice = getSeatPrice(tableId);
      availableSeats.forEach((seat) => {
        const seatId = `${tableId}-${seat.number}`;
        onSeatSelect({
          id: seatId,
          tableId,
          tableNumber,
          seatNumber: seat.number,
          seatType: seat.type,
          price: seatPrice,
        });
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to buy table. Some seats may have been taken.");
    }
  };

  // Get price for a seat based on its section's ticket tier
  const getSeatPrice = (tableId: string): number => {
    if (!seatingChart || !ticketTiers) return 0;

    // Find the section this table belongs to
    const section = seatingChart.sections?.find((s) => s.tables?.some((t) => t.id === tableId));

    if (!section?.ticketTierId) {
      console.warn(`No tier assigned to section for table ${tableId}`);
      return 0;
    }

    // Find the tier and get its price
    const tier = ticketTiers.find((t) => t._id === section.ticketTierId);
    if (!tier) {
      console.warn(`Tier ${section.ticketTierId} not found`);
      return 0;
    }

    // Calculate current price from pricing tiers if available
    if (tier.pricingTiers && tier.pricingTiers.length > 0) {
      const now = Date.now();
      const sortedTiers = [...tier.pricingTiers].sort((a, b) => a.availableFrom - b.availableFrom);

      // Find the current active tier
      let currentTier = sortedTiers[0];
      for (const priceTier of sortedTiers) {
        if (now >= priceTier.availableFrom && (!priceTier.availableUntil || now < priceTier.availableUntil)) {
          currentTier = priceTier;
          break;
        }
      }

      return currentTier.price;
    }

    return tier.price || 0;
  };

  // Filter seats based on accessibility filters
  const shouldShowSeat = (seatType: string) => {
    if (seatFilters.wheelchairOnly) {
      return seatType === "WHEELCHAIR";
    }

    if (seatType === "WHEELCHAIR" && !seatFilters.showWheelchair) return false;
    if (seatType === "VIP" && !seatFilters.showVIP) return false;
    if (seatType === "STANDARD" && !seatFilters.showStandard) return false;

    return true;
  };

  // Build flat list of all seats for rendering
  const renderData: Array<{
    tableId: string;
    tableNumber: string | number;
    table: any;
    seats: SeatRenderData[];
  }> = [];

  seatingChart.sections?.forEach((section: any) => {
    section.tables?.forEach((table: any) => {
      const tableSeats: SeatRenderData[] = [];

      table.seats?.forEach((seat: any, idx: number) => {
        const seatId = `${table.id}-${seat.number}`;
        let status: "available" | "selected" | "sold" | "reserved" = "available";

        if (seat.status === "RESERVED" || seat.status === "UNAVAILABLE") {
          status = "sold";
        } else if (isSeatSelected(seatId)) {
          status = "selected";
        } else if (seat.sessionId && Date.now() < (seat.sessionExpiry || 0)) {
          status = "reserved"; // Being selected by another user
        }

        // Calculate seat position around table (simplified)
        const angleStep = (2 * Math.PI) / table.capacity;
        const angle = idx * angleStep - Math.PI / 2;
        const radius = table.width / 2 + 18;

        tableSeats.push({
          id: seatId,
          x: table.x + table.width / 2 + Math.cos(angle) * radius,
          y: table.y + table.height / 2 + Math.sin(angle) * radius,
          number: seat.number,
          status,
          type: seat.type,
          price: getSeatPrice(table.id),
        });
      });

      renderData.push({
        tableId: table.id,
        tableNumber: table.number,
        table,
        seats: tableSeats,
      });
    });
  });

  return (
    <div className={`relative ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Accessibility Filters Sidebar */}
        <div className="lg:col-span-1">
          <AccessibilityFilters filters={seatFilters} onFilterChange={setSeatFilters} />
        </div>

        {/* Main Seating Chart */}
        <div className="lg:col-span-3 bg-card rounded-lg border-2 border-border overflow-auto">
          {/* Legend */}
          <div className="sticky top-0 z-10 bg-card border-b border-border p-3 md:p-4">
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-success border-2 border-foreground"></div>
                <span className="text-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-warning border-2 border-foreground"></div>
                <span className="text-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-muted border-2 border-muted-foreground opacity-50"></div>
                <span className="text-foreground">Sold</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary border-2 border-foreground"></div>
                <span className="text-foreground">Reserved</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 md:hidden">
              💡 Tip: Pinch to zoom, drag to pan
            </p>
          </div>

          {/* Canvas */}
          <div
            className="relative p-4 md:p-8 touch-pan-x touch-pan-y"
            style={{ minHeight: "400px", minWidth: "100%" }}
          >
            <svg width="100%" height="100%" style={{ minHeight: "600px" }}>
              {renderData.map(({ tableId, tableNumber, table, seats }) => (
                <g key={tableId}>
                  {/* Table outline */}
                  {table.shape === "ROUND" ? (
                    <>
                      <circle
                        cx={table.x + table.width / 2}
                        cy={table.y + table.height / 2}
                        r={table.width / 2}
                        fill="none"
                        stroke="#2c3e50"
                        strokeWidth="3"
                      />
                      <circle
                        cx={table.x + table.width / 2}
                        cy={table.y + table.height / 2}
                        r={table.width / 2 - 15}
                        fill="#f8f9fa"
                        stroke="#2c3e50"
                        strokeWidth="2"
                      />
                      <text
                        x={table.x + table.width / 2}
                        y={table.y + table.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#2c3e50"
                        fontWeight="700"
                        fontSize="14"
                      >
                        Table {tableNumber}
                      </text>
                    </>
                  ) : (
                    <>
                      <rect
                        x={table.x}
                        y={table.y}
                        width={table.width}
                        height={table.height}
                        fill="#f8f9fa"
                        stroke="#2c3e50"
                        strokeWidth="3"
                        rx="4"
                      />
                      <text
                        x={table.x + table.width / 2}
                        y={table.y + table.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#2c3e50"
                        fontWeight="700"
                        fontSize="14"
                      >
                        Table {tableNumber}
                      </text>
                    </>
                  )}

                  {/* Table Capacity Indicator */}
                  <TableCapacityIndicator
                    filledSeats={seats.filter((s) => s.status !== "available").length}
                    totalSeats={seats.length}
                    x={table.x}
                    y={table.y}
                    width={table.width}
                  />

                  {/* Seats */}
                  {seats.map((seat) => {
                    const seatColor =
                      seat.status === "available"
                        ? "#4CAF50"
                        : seat.status === "selected"
                          ? "#FFC107"
                          : seat.status === "reserved"
                            ? "#64B5F6"
                            : "#999";

                    const isClickable = seat.status === "available" || seat.status === "selected";

                    return (
                      <g key={seat.id}>
                        <circle
                          cx={seat.x}
                          cy={seat.y}
                          r="12"
                          fill={seatColor}
                          stroke={seat.status === "selected" ? "#2c3e50" : "#2c3e50"}
                          strokeWidth={seat.status === "selected" ? "3" : "2"}
                          opacity={seat.status === "sold" ? "0.5" : "1"}
                          className={
                            isClickable
                              ? "cursor-pointer hover:opacity-80 transition-opacity"
                              : "cursor-not-allowed"
                          }
                          onClick={() =>
                            handleSeatClick(
                              tableId,
                              tableNumber,
                              seat.number,
                              seat.type,
                              seat.status,
                              seat.price
                            )
                          }
                          onMouseEnter={(e) => handleSeatHover(seat.id, e)}
                          onMouseLeave={() => setHoveredSeat(null)}
                        />
                        <text
                          x={seat.x}
                          y={seat.y + 4}
                          textAnchor="middle"
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          pointerEvents="none"
                        >
                          {seat.number}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>

            {/* Buy Table Buttons - Positioned below canvas */}
            {renderData.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {renderData.map(({ tableId, tableNumber, table, seats }) => {
                    const availableSeats = seats.filter((s) => s.status === "available");
                    if (availableSeats.length === 0) return null;

                    return (
                      <BuyTableButton
                        key={tableId}
                        tableNumber={tableNumber}
                        availableSeats={availableSeats.length}
                        totalSeats={seats.length}
                        pricePerSeat={getSeatPrice(tableId)}
                        onBuyTable={() =>
                          handleBuyTable(
                            tableId,
                            tableNumber,
                            table.seats.filter((s: any) => {
                              const seatId = `${tableId}-${s.number}`;
                              const renderSeat = seats.find((rs) => rs.id === seatId);
                              return renderSeat?.status === "available";
                            })
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tooltip */}
            {hoveredSeat && (
              <div
                className="fixed z-50 bg-foreground text-background text-xs px-3 py-2 rounded-md shadow-lg pointer-events-none"
                style={{
                  left: tooltipPos.x + 10,
                  top: tooltipPos.y + 10,
                }}
              >
                {hoveredSeat}
              </div>
            )}
          </div>

          {/* Empty state */}
          {renderData.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <div className="text-6xl mb-4">💃</div>
              <p className="text-lg font-semibold mb-2">No Seating Chart Available</p>
              <p className="text-sm">The organizer hasn't set up table seating yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
