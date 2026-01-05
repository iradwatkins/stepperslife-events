"use client";

import { Circle, Square, RectangleHorizontal, Pentagon } from "lucide-react";
import { getSeatTypeIcon, getSeatTypeBgColor } from "./SeatTypePalette";

export interface TableRenderProps {
  table: {
    id: string;
    number: string | number;
    shape: "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    capacity: number;
    seats: Array<{
      id: string;
      number: string;
      type: string;
      status: string;
      position?: {
        angle?: number;
        side?: string;
        offset?: number;
        x?: number;
        y?: number;
      };
    }>;
  };
  isSelected?: boolean;
  onClick?: () => void;
  showSeats?: boolean;
  showLabel?: boolean;
  scale?: number;
}

export default function TableRenderer({
  table,
  isSelected = false,
  onClick,
  showSeats = true,
  showLabel = true,
  scale = 1,
}: TableRenderProps) {
  const renderTableShape = () => {
    const commonProps = {
      className: `transition-all ${isSelected ? "stroke-[3]" : "stroke-2"} fill-white stroke-foreground`,
      fillOpacity: 0.95,
    };

    switch (table.shape) {
      case "ROUND":
        const radius = table.width / 2;
        return <circle cx={table.width / 2} cy={table.height / 2} r={radius} {...commonProps} />;

      case "RECTANGULAR":
        return (
          <rect x={0} y={0} width={table.width} height={table.height} rx={8} {...commonProps} />
        );

      case "SQUARE":
        return (
          <rect x={0} y={0} width={table.width} height={table.width} rx={8} {...commonProps} />
        );

      case "CUSTOM":
        // Pentagon/polygon shape
        const customCenterX = table.width / 2;
        const customCenterY = table.height / 2;
        const customRadius = Math.min(table.width, table.height) / 2;

        // Generate pentagon points (5-sided polygon)
        const pentagonPoints = Array.from({ length: 5 }, (_, i) => {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // Start from top
          const x = customCenterX + customRadius * Math.cos(angle);
          const y = customCenterY + customRadius * Math.sin(angle);
          return `${x},${y}`;
        }).join(" ");

        return <polygon points={pentagonPoints} {...commonProps} />;

      default:
        return null;
    }
  };

  const renderSeats = () => {
    if (!showSeats) return null;

    return table.seats.map((seat, index) => {
      // Calculate seat position
      let seatX = 0;
      let seatY = 0;
      const seatRadius = 12 * scale;

      if (seat.position) {
        // Use stored position if available
        if (seat.position.x !== undefined && seat.position.y !== undefined) {
          seatX = seat.position.x;
          seatY = seat.position.y;
        } else if (seat.position.angle !== undefined) {
          // Calculate from angle (for round/custom tables)
          const angle = seat.position.angle;
          const radians = (angle * Math.PI) / 180;
          const radius = table.width / 2;
          const offset = seat.position.offset || 15;
          seatX = table.width / 2 + (radius + offset) * Math.cos(radians);
          seatY = table.height / 2 + (radius + offset) * Math.sin(radians);
        } else if (seat.position.side) {
          // Calculate from side (for rectangular tables)
          const offset = seat.position.offset || 15;
          const spacing = 40;
          const sideSeats = table.seats.filter(
            (s) => s.position?.side === seat.position!.side
          ).length;
          const seatIndex = table.seats
            .filter((s) => s.position?.side === seat.position!.side)
            .indexOf(seat);

          switch (seat.position.side) {
            case "top":
              seatX = (table.width / (sideSeats + 1)) * (seatIndex + 1);
              seatY = -offset;
              break;
            case "bottom":
              seatX = (table.width / (sideSeats + 1)) * (seatIndex + 1);
              seatY = table.height + offset;
              break;
            case "left":
              seatX = -offset;
              seatY = (table.height / (sideSeats + 1)) * (seatIndex + 1);
              break;
            case "right":
              seatX = table.width + offset;
              seatY = (table.height / (sideSeats + 1)) * (seatIndex + 1);
              break;
          }
        }
      } else {
        // Auto-calculate position based on index (fallback)
        const angle = (360 / table.capacity) * index;
        const radians = (angle * Math.PI) / 180;
        const radius = table.width / 2;
        seatX = table.width / 2 + (radius + 15) * Math.cos(radians);
        seatY = table.height / 2 + (radius + 15) * Math.sin(radians);
      }

      const isAvailable = seat.status === "AVAILABLE";
      const isReserved = seat.status === "RESERVED";
      const isSpecialType = ["WHEELCHAIR", "VIP", "BLOCKED"].includes(seat.type);

      return (
        <g key={seat.id}>
          {/* Seat circle */}
          <circle
            cx={seatX}
            cy={seatY}
            r={seatRadius}
            className={`transition-all ${
              isReserved
                ? "fill-gray-300 stroke-gray-600"
                : isSpecialType
                  ? "fill-white stroke-black"
                  : "fill-white stroke-black"
            } stroke-[1.5] ${isAvailable ? "cursor-pointer hover:fill-green-50" : ""}`}
          />

          {/* Seat number or icon */}
          <text
            x={seatX}
            y={seatY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold fill-gray-800 pointer-events-none select-none"
          >
            {isSpecialType ? "" : seat.number}
          </text>
        </g>
      );
    });
  };

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      style={{
        transform: `translate(${table.x}px, ${table.y}px) rotate(${table.rotation || 0}deg)`,
        transformOrigin: `${table.width / 2}px ${table.height / 2}px`,
      }}
    >
      {/* Table shape */}
      {renderTableShape()}

      {/* Table label */}
      {showLabel && (
        <g>
          <rect
            x={table.width / 2 - 30}
            y={table.height / 2 - 12}
            width={60}
            height={24}
            rx={4}
            className="fill-white stroke-foreground"
            fillOpacity={0.95}
            strokeWidth={isSelected ? 2 : 1}
          />
          <text
            x={table.width / 2}
            y={table.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-bold pointer-events-none select-none fill-gray-900"
          >
            {table.number}
          </text>
        </g>
      )}

      {/* Seats */}
      {renderSeats()}

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={table.width + 8}
          height={table.height + 8}
          rx={12}
          fill="none"
          className="stroke-foreground"
          strokeWidth={2}
          strokeDasharray="6 3"
        />
      )}
    </g>
  );
}
