"use client";

import { Armchair, Accessibility, Users, Crown, Ban, User, Car, Tent, Info } from "lucide-react";
import { motion } from "framer-motion";

export type SeatType =
  | "STANDARD"
  | "WHEELCHAIR"
  | "COMPANION"
  | "VIP"
  | "BLOCKED"
  | "STANDING"
  | "PARKING"
  | "TENT";

interface SeatTypeOption {
  type: SeatType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const seatTypes: SeatTypeOption[] = [
  {
    type: "STANDARD",
    label: "Standard",
    icon: <Armchair className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-accent hover:bg-primary/20 border-primary/40",
    description: "Regular seating",
  },
  {
    type: "WHEELCHAIR",
    label: "Wheelchair",
    icon: <Accessibility className="w-5 h-5" />,
    color: "text-success",
    bgColor: "bg-success/10 hover:bg-success/20 border-success/40",
    description: "Wheelchair accessible",
  },
  {
    type: "COMPANION",
    label: "Companion",
    icon: <Users className="w-5 h-5" />,
    color: "text-warning",
    bgColor: "bg-warning/10 hover:bg-warning/20 border-warning/40",
    description: "Companion seating",
  },
  {
    type: "VIP",
    label: "VIP",
    icon: <Crown className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-accent hover:bg-primary/20 border-primary/40",
    description: "Premium VIP seats",
  },
  {
    type: "BLOCKED",
    label: "Blocked",
    icon: <Ban className="w-5 h-5" />,
    color: "text-destructive",
    bgColor: "bg-destructive/10 hover:bg-destructive/20 border-destructive/40",
    description: "Unavailable/blocked",
  },
  {
    type: "STANDING",
    label: "Standing",
    icon: <User className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20 border-primary/40",
    description: "Standing room area",
  },
  {
    type: "PARKING",
    label: "Parking",
    icon: <Car className="w-5 h-5" />,
    color: "text-foreground",
    bgColor: "bg-muted hover:bg-muted/80 border-border",
    description: "Parking spot",
  },
  {
    type: "TENT",
    label: "Tent",
    icon: <Tent className="w-5 h-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20 border-primary/40",
    description: "Camping/tent spot",
  },
];

interface SeatTypePaletteProps {
  currentType?: SeatType;
  onTypeSelect: (type: SeatType) => void;
  compact?: boolean;
}

export default function SeatTypePalette({
  currentType = "STANDARD",
  onTypeSelect,
  compact = false,
}: SeatTypePaletteProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {seatTypes.map((seatType) => {
          const isSelected = currentType === seatType.type;
          return (
            <button
              type="button"
              key={seatType.type}
              onClick={() => onTypeSelect(seatType.type)}
              title={seatType.description}
              className={`
                relative p-2 rounded-lg border-2 transition-all
                ${seatType.bgColor}
                ${isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}
              `}
            >
              <span className={seatType.color}>{seatType.icon}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Seat Types</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {seatTypes.map((seatType) => {
          const isSelected = currentType === seatType.type;
          return (
            <motion.button
              key={seatType.type}
              onClick={() => onTypeSelect(seatType.type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${seatType.bgColor}
                ${isSelected ? "ring-2 ring-offset-2 ring-primary" : ""}
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="selected-seat-type"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </motion.div>
              )}

              <span className={`${seatType.color} mb-2`}>{seatType.icon}</span>
              <span className="text-xs font-semibold text-foreground mb-1">{seatType.label}</span>
              <span className="text-xs text-muted-foreground text-center">{seatType.description}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Click on any seat in your chart to cycle through these types
        </p>
      </div>
    </div>
  );
}

export function getSeatTypeIcon(type: SeatType): React.ReactNode {
  const seatType = seatTypes.find((st) => st.type === type);
  return seatType?.icon || <Armchair className="w-4 h-4" />;
}

export function getSeatTypeColor(type: SeatType): string {
  const seatType = seatTypes.find((st) => st.type === type);
  return seatType?.color || "text-primary";
}

export function getSeatTypeBgColor(type: SeatType): string {
  const seatType = seatTypes.find((st) => st.type === type);
  return seatType?.bgColor || "bg-accent";
}

export { seatTypes };
