"use client";

import React from "react";

interface TableCapacityIndicatorProps {
  filledSeats: number;
  totalSeats: number;
  x: number;
  y: number;
  width: number;
}

export default function TableCapacityIndicator({
  filledSeats,
  totalSeats,
  x,
  y,
  width,
}: TableCapacityIndicatorProps) {
  const percentFilled = (filledSeats / totalSeats) * 100;

  // Determine color based on capacity
  let indicatorColor = "#10B981"; // Green - empty/low
  let bgColor = "#D1FAE5";
  let textColor = "#065F46";

  if (percentFilled >= 75) {
    indicatorColor = "#EF4444"; // Red - almost full
    bgColor = "#FEE2E2";
    textColor = "#991B1B";
  } else if (percentFilled >= 40) {
    indicatorColor = "#F59E0B"; // Yellow - half full
    bgColor = "#FEF3C7";
    textColor = "#92400E";
  }

  const remainingSeats = totalSeats - filledSeats;

  return (
    <g>
      {/* Background badge */}
      <rect
        x={x + width / 2 - 25}
        y={y - 20}
        width="50"
        height="18"
        rx="9"
        fill={bgColor}
        stroke={indicatorColor}
        strokeWidth="1.5"
      />

      {/* Capacity text */}
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fill={textColor}
        fontSize="11"
        fontWeight="700"
      >
        {filledSeats}/{totalSeats}
      </text>

      {/* Urgency indicator for nearly full tables */}
      {remainingSeats > 0 && remainingSeats <= 2 && (
        <g>
          <rect
            x={x + width / 2 - 40}
            y={y - 40}
            width="80"
            height="16"
            rx="8"
            fill="#FEE2E2"
            stroke="#EF4444"
            strokeWidth="1.5"
          />
          <text
            x={x + width / 2}
            y={y - 29}
            textAnchor="middle"
            fill="#991B1B"
            fontSize="9"
            fontWeight="700"
          >
            Only {remainingSeats} left!
          </text>
        </g>
      )}
    </g>
  );
}
