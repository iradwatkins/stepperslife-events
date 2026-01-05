"use client";

import React from "react";
import { Users, DollarSign } from "lucide-react";

interface BuyTableButtonProps {
  tableNumber: string | number;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  onBuyTable: () => void;
  className?: string;
}

export default function BuyTableButton({
  tableNumber,
  availableSeats,
  totalSeats,
  pricePerSeat,
  onBuyTable,
  className = "",
}: BuyTableButtonProps) {
  if (availableSeats === 0) return null;

  const totalPriceCents = availableSeats * pricePerSeat;
  const totalPriceDollars = totalPriceCents / 100; // Convert from cents to dollars
  const isPartiallyFilled = availableSeats < totalSeats;

  return (
    <button
      type="button"
      onClick={onBuyTable}
      className={`
        group relative inline-flex items-center gap-2 px-4 py-2
        bg-gradient-to-r from-primary to-blue-600
        hover:from-primary/90 hover:to-blue-700
        text-white rounded-lg shadow-md hover:shadow-lg
        transition-all duration-200 transform hover:scale-105
        ${className}
      `}
    >
      <Users className="w-4 h-4" />
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold">
          {isPartiallyFilled
            ? `Buy ${availableSeats} Remaining Seats`
            : `Buy Entire Table ${tableNumber}`}
        </span>
        <span className="text-xs opacity-90 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />${totalPriceDollars.toFixed(2)} total
        </span>
      </div>
    </button>
  );
}
