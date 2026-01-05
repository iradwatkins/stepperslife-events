"use client";

import { SEAT_COLORS, STROKE_WIDTH } from "@/styles/seating-colors";

export interface RowRenderProps {
  row: {
    id: string;
    rowLabel: string; // "A", "B", "C" or "Row 1", "Row 2"
    x: number;
    y: number;
    seats: Array<{
      id: string;
      number: string | number;
      type: string;
      status: string;
    }>;
    aisleAfter?: number[]; // Indices after which to add aisle gap, e.g., [5, 10]
  };
  isSelected?: boolean;
  onClick?: () => void;
  onSeatClick?: (seatId: string) => void;
  scale?: number;
}

export default function RowRenderer({
  row,
  isSelected = false,
  onClick,
  onSeatClick,
  scale = 1,
}: RowRenderProps) {
  const seatRadius = 12 * scale;
  const seatSpacing = 30; // Horizontal spacing between seats
  const aisleGap = 50; // Extra gap for aisles
  const labelOffset = 80; // Space for row label on left

  const renderSeats = () => {
    let currentX = labelOffset;

    return row.seats.map((seat, index) => {
      const seatX = currentX;
      const seatY = 0;

      // Add aisle gap after this seat if configured
      const hasAisleAfter = row.aisleAfter?.includes(index);
      currentX += seatSpacing + (hasAisleAfter ? aisleGap : 0);

      const isAvailable = seat.status === "AVAILABLE";
      const isReserved = seat.status === "RESERVED";
      const isSold = seat.status === "SOLD";
      const isSeatSelected = seat.status === "SELECTED";
      const isSpecialType = ["WHEELCHAIR", "VIP", "BLOCKED"].includes(seat.type);

      // Determine seat color based on status
      let seatFill: string = SEAT_COLORS.AVAILABLE;
      let seatStroke: string = SEAT_COLORS.AVAILABLE;

      if (isSold) {
        seatFill = SEAT_COLORS.SOLD;
        seatStroke = SEAT_COLORS.SOLD;
      } else if (isSeatSelected) {
        seatFill = SEAT_COLORS.SELECTED;
        seatStroke = SEAT_COLORS.SELECTED;
      } else if (isReserved) {
        seatFill = SEAT_COLORS.RESERVED;
        seatStroke = SEAT_COLORS.RESERVED;
      }

      return (
        <g key={seat.id}>
          {/* Seat circle */}
          <circle
            cx={seatX}
            cy={seatY}
            r={seatRadius}
            fill={seatFill}
            stroke={seatStroke}
            strokeWidth={STROKE_WIDTH.SEAT}
            className={`transition-all ${isAvailable ? "cursor-pointer hover:opacity-80" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSeatClick && isAvailable) {
                onSeatClick(seat.id);
              }
            }}
            style={{ pointerEvents: "auto" }}
          />

          {/* Seat number */}
          <text
            x={seatX}
            y={seatY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold pointer-events-none select-none"
            fill={isSold ? "#fff" : "#1f2937"}
          >
            {isSpecialType ? "" : seat.number}
          </text>

          {/* Aisle indicator line */}
          {hasAisleAfter && (
            <line
              x1={seatX + seatSpacing / 2}
              y1={-20}
              x2={seatX + seatSpacing / 2}
              y2={20}
              stroke="#ddd"
              strokeWidth={2}
              strokeDasharray="4 4"
              className="pointer-events-none"
            />
          )}
        </g>
      );
    });
  };

  // Calculate total width for hit zone
  const totalSeats = row.seats.length;
  const aisleCount = row.aisleAfter?.length || 0;
  const totalWidth = labelOffset + totalSeats * seatSpacing + aisleCount * aisleGap;

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{
        transform: `translate(${row.x}px, ${row.y}px)`,
      }}
    >
      {/* Invisible larger hit zone for easier dragging */}
      <rect
        x={-40}
        y={-40}
        width={totalWidth + 80}
        height={80}
        fill="transparent"
        stroke="none"
        className="cursor-move"
        style={{ pointerEvents: "all" }}
      />

      {/* Row label */}
      <text
        x={0}
        y={0}
        textAnchor="start"
        dominantBaseline="middle"
        className="text-sm font-bold pointer-events-none select-none fill-gray-700"
      >
        {row.rowLabel}
      </text>

      {/* Seats */}
      {renderSeats()}

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={-10}
          y={-30}
          width={totalWidth + 20}
          height={60}
          rx={8}
          fill="none"
          stroke="#000000"
          strokeWidth={2}
          strokeDasharray="6 3"
          className="pointer-events-none"
        />
      )}
    </g>
  );
}
