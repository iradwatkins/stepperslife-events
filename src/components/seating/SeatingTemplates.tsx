"use client";

import {
  Building2,
  Theater,
  Music,
  Users as UsersIcon,
  Tent as TentIcon,
  Grid,
  Heart,
  Sparkles,
  Utensils,
} from "lucide-react";
import { motion } from "framer-motion";

type SeatType =
  | "STANDARD"
  | "WHEELCHAIR"
  | "COMPANION"
  | "VIP"
  | "BLOCKED"
  | "STANDING"
  | "PARKING"
  | "TENT";

interface TemplateSeat {
  id: string;
  number: string;
  type: SeatType;
  status: "AVAILABLE" | "RESERVED" | "BLOCKED";
}

interface TemplateRow {
  id: string;
  label?: string;
  seats: TemplateSeat[];
}

interface TemplateTable {
  id: string;
  number: string | number;
  shape: "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seatArc?: { startAngle?: number; arcDegrees?: number };
  seats: TemplateSeat[];
}

interface TemplateSection {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: "ROWS" | "TABLES";
  rows?: TemplateRow[];
  tables?: TemplateTable[];
}

export interface SeatingTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category:
    | "theater"
    | "stadium"
    | "concert"
    | "conference"
    | "outdoor"
    | "wedding"
    | "gala"
    | "banquet"
    | "custom";
  sections: TemplateSection[];
  estimatedCapacity: number;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const generateSeats = (count: number, type: SeatType = "STANDARD"): TemplateSeat[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    number: String(i + 1),
    type,
    status: "AVAILABLE" as const,
  }));
};

export const seatingTemplates: SeatingTemplate[] = [
  {
    id: "theater-small",
    name: "Small Theater",
    description: "200-seat theater with center aisle, 10 rows",
    icon: <Theater className="w-8 h-8" />,
    category: "theater",
    estimatedCapacity: 200,
    sections: [
      {
        id: "left-orchestra",
        name: "Left Orchestra",
        color: "#3B82F6",
        x: 150,
        y: 250,
        width: 300,
        height: 400,
        rotation: 0,
        rows: Array.from({ length: 10 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex), // A-J
          seats: generateSeats(10),
        })),
      },
      {
        id: "right-orchestra",
        name: "Right Orchestra",
        color: "#3B82F6",
        x: 500,
        y: 250,
        width: 300,
        height: 400,
        rotation: 0,
        rows: Array.from({ length: 10 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(10),
        })),
      },
    ],
  },
  {
    id: "stadium-section",
    name: "Stadium Section",
    description: "Single stadium section with 15 rows, 20 seats per row",
    icon: <Building2 className="w-8 h-8" />,
    category: "stadium",
    estimatedCapacity: 300,
    sections: [
      {
        id: "section-101",
        name: "Section 101",
        color: "#8B5CF6",
        x: 200,
        y: 200,
        width: 400,
        height: 500,
        rotation: 0,
        rows: Array.from({ length: 15 }, (_, rowIndex) => ({
          id: generateId(),
          label: String(rowIndex + 1),
          seats: generateSeats(20),
        })),
      },
    ],
  },
  {
    id: "concert-ga",
    name: "General Admission Concert",
    description: "Standing room + seated VIP section",
    icon: <Music className="w-8 h-8" />,
    category: "concert",
    estimatedCapacity: 500,
    sections: [
      {
        id: "vip-section",
        name: "VIP Seating",
        color: "#A855F7",
        x: 200,
        y: 150,
        width: 400,
        height: 200,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(12, "VIP"),
        })),
      },
      {
        id: "ga-floor",
        name: "GA Floor (Standing)",
        color: "#10B981",
        x: 200,
        y: 400,
        width: 400,
        height: 300,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "FLOOR",
            seats: generateSeats(440, "STANDING"),
          },
        ],
      },
    ],
  },
  {
    id: "conference-room",
    name: "Conference Room",
    description: "U-shaped seating for 40 people",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 40,
    sections: [
      {
        id: "head-table",
        name: "Head Table",
        color: "#EF4444",
        x: 300,
        y: 150,
        width: 300,
        height: 100,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "HEAD",
            seats: generateSeats(10),
          },
        ],
      },
      {
        id: "left-side",
        name: "Left Side",
        color: "#3B82F6",
        x: 150,
        y: 300,
        width: 100,
        height: 300,
        rotation: 0,
        rows: Array.from({ length: 3 }, (_, i) => ({
          id: generateId(),
          label: `L${i + 1}`,
          seats: generateSeats(5),
        })),
      },
      {
        id: "right-side",
        name: "Right Side",
        color: "#3B82F6",
        x: 650,
        y: 300,
        width: 100,
        height: 300,
        rotation: 0,
        rows: Array.from({ length: 3 }, (_, i) => ({
          id: generateId(),
          label: `R${i + 1}`,
          seats: generateSeats(5),
        })),
      },
    ],
  },
  {
    id: "outdoor-festival",
    name: "Outdoor Festival",
    description: "Mix of seating, tents, and parking",
    icon: <TentIcon className="w-8 h-8" />,
    category: "outdoor",
    estimatedCapacity: 200,
    sections: [
      {
        id: "seating-area",
        name: "Seating Area",
        color: "#F59E0B",
        x: 200,
        y: 150,
        width: 300,
        height: 250,
        rotation: 0,
        rows: Array.from({ length: 8 }, (_, i) => ({
          id: generateId(),
          label: String.fromCharCode(65 + i),
          seats: generateSeats(12),
        })),
      },
      {
        id: "tent-camping",
        name: "Tent Camping",
        color: "#059669",
        x: 550,
        y: 150,
        width: 250,
        height: 250,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, i) => ({
          id: generateId(),
          label: `T${i + 1}`,
          seats: generateSeats(8, "TENT"),
        })),
      },
      {
        id: "parking",
        name: "Parking Spaces",
        color: "#6B7280",
        x: 200,
        y: 450,
        width: 600,
        height: 150,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "P1",
            seats: generateSeats(30, "PARKING"),
          },
        ],
      },
    ],
  },
  {
    id: "intimate-wedding",
    name: "Intimate Wedding",
    description: "Small wedding reception with 8 round tables, 8 guests each",
    icon: <Heart className="w-8 h-8" />,
    category: "wedding",
    estimatedCapacity: 64,
    sections: [
      {
        id: "main-hall",
        name: "Reception Hall",
        color: "#EC4899",
        x: 100,
        y: 100,
        width: 700,
        height: 500,
        containerType: "TABLES",
        tables: [
          // Front row - 3 tables
          {
            id: generateId(),
            number: 1,
            shape: "ROUND",
            x: 150,
            y: 150,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 2,
            shape: "ROUND",
            x: 350,
            y: 150,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 3,
            shape: "ROUND",
            x: 550,
            y: 150,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Middle row - 2 tables
          {
            id: generateId(),
            number: 4,
            shape: "ROUND",
            x: 250,
            y: 300,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 5,
            shape: "ROUND",
            x: 450,
            y: 300,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Back row - 3 tables
          {
            id: generateId(),
            number: 6,
            shape: "ROUND",
            x: 150,
            y: 450,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 7,
            shape: "ROUND",
            x: 350,
            y: 450,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 8,
            shape: "ROUND",
            x: 550,
            y: 450,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
        ],
      },
    ],
  },
  {
    id: "large-gala",
    name: "Large Gala",
    description: "Elegant gala with 15 round tables, 10 guests each, plus VIP head table",
    icon: <Sparkles className="w-8 h-8" />,
    category: "gala",
    estimatedCapacity: 162,
    sections: [
      {
        id: "main-ballroom",
        name: "Main Ballroom",
        color: "#8B5CF6",
        x: 50,
        y: 150,
        width: 900,
        height: 600,
        containerType: "TABLES",
        tables: [
          // VIP Head Table
          {
            id: generateId(),
            number: "HEAD",
            shape: "RECTANGULAR",
            x: 350,
            y: 100,
            width: 200,
            height: 80,
            rotation: 0,
            capacity: 12,
            seats: generateSeats(12, "VIP"),
          },
          // Round tables - Row 1
          ...Array.from({ length: 5 }, (_, i) => ({
            id: generateId(),
            number: i + 1,
            shape: "ROUND" as const,
            x: 100 + i * 180,
            y: 250,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          })),
          // Round tables - Row 2
          ...Array.from({ length: 5 }, (_, i) => ({
            id: generateId(),
            number: i + 6,
            shape: "ROUND" as const,
            x: 100 + i * 180,
            y: 420,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          })),
          // Round tables - Row 3
          ...Array.from({ length: 5 }, (_, i) => ({
            id: generateId(),
            number: i + 11,
            shape: "ROUND" as const,
            x: 100 + i * 180,
            y: 590,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          })),
        ],
      },
    ],
  },
  {
    id: "banquet-hall",
    name: "Banquet Hall",
    description: "Mix of round and rectangular tables for 120 guests",
    icon: <Utensils className="w-8 h-8" />,
    category: "banquet",
    estimatedCapacity: 120,
    sections: [
      {
        id: "banquet-area",
        name: "Banquet Area",
        color: "#F59E0B",
        x: 100,
        y: 100,
        width: 800,
        height: 600,
        containerType: "TABLES",
        tables: [
          // Head table - rectangular
          {
            id: generateId(),
            number: 1,
            shape: "RECTANGULAR",
            x: 300,
            y: 120,
            width: 250,
            height: 80,
            rotation: 0,
            capacity: 14,
            seats: generateSeats(14, "VIP"),
          },
          // Round tables - scattered arrangement
          {
            id: generateId(),
            number: 2,
            shape: "ROUND",
            x: 150,
            y: 280,
            width: 110,
            height: 110,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 3,
            shape: "ROUND",
            x: 350,
            y: 280,
            width: 110,
            height: 110,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 4,
            shape: "ROUND",
            x: 550,
            y: 280,
            width: 110,
            height: 110,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 5,
            shape: "ROUND",
            x: 750,
            y: 280,
            width: 110,
            height: 110,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Rectangular tables - back section
          {
            id: generateId(),
            number: 6,
            shape: "RECTANGULAR",
            x: 150,
            y: 480,
            width: 180,
            height: 80,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          },
          {
            id: generateId(),
            number: 7,
            shape: "RECTANGULAR",
            x: 400,
            y: 480,
            width: 180,
            height: 80,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          },
          {
            id: generateId(),
            number: 8,
            shape: "RECTANGULAR",
            x: 650,
            y: 480,
            width: 180,
            height: 80,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          },
          // More round tables
          {
            id: generateId(),
            number: 9,
            shape: "ROUND",
            x: 250,
            y: 420,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          {
            id: generateId(),
            number: 10,
            shape: "ROUND",
            x: 550,
            y: 420,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
        ],
      },
    ],
  },
  // Conference Room Templates
  {
    id: "boardroom-20",
    name: "Boardroom Setup",
    description: "20-seat executive boardroom with rectangular table",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 20,
    sections: [
      {
        id: "boardroom",
        name: "Boardroom",
        color: "#DC2626",
        x: 250,
        y: 250,
        width: 400,
        height: 300,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 450,
            y: 400,
            width: 300,
            height: 150,
            rotation: 0,
            capacity: 20,
            seats: generateSeats(20),
          },
        ],
      },
    ],
  },
  {
    id: "classroom-50",
    name: "Classroom Style",
    description: "50-seat classroom with rows of rectangular tables",
    icon: <Grid className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 50,
    sections: [
      {
        id: "classroom",
        name: "Classroom",
        color: "#DC2626",
        x: 200,
        y: 200,
        width: 600,
        height: 500,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // 5 rows of 2 tables each (2 people per table)
          ...Array.from({ length: 5 }, (_, rowIdx) =>
            Array.from({ length: 5 }, (_, colIdx) => ({
              id: generateId(),
              number: `${rowIdx * 5 + colIdx + 1}`,
              shape: "RECTANGULAR" as const,
              x: 300 + colIdx * 100,
              y: 300 + rowIdx * 80,
              width: 80,
              height: 50,
              rotation: 0,
              capacity: 2,
              seats: generateSeats(2),
            }))
          ).flat(),
        ],
      },
    ],
  },
  {
    id: "theater-conference-100",
    name: "Theater Conference",
    description: "100-seat theater-style rows for presentations",
    icon: <Theater className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 100,
    sections: [
      {
        id: "theater-seats",
        name: "Theater Seats",
        color: "#DC2626",
        x: 150,
        y: 200,
        width: 600,
        height: 500,
        rotation: 0,
        rows: Array.from({ length: 10 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(10),
        })),
      },
    ],
  },
  {
    id: "u-shape-30",
    name: "U-Shape Setup",
    description: "30-seat U-shaped table configuration",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 30,
    sections: [
      {
        id: "u-shape",
        name: "U-Shape",
        color: "#DC2626",
        x: 200,
        y: 200,
        width: 500,
        height: 400,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Bottom of U
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 450,
            y: 500,
            width: 300,
            height: 60,
            rotation: 0,
            capacity: 10,
            seats: generateSeats(10),
          },
          // Left side of U
          {
            id: generateId(),
            number: "2",
            shape: "RECTANGULAR",
            x: 300,
            y: 350,
            width: 60,
            height: 200,
            rotation: 90,
            capacity: 10,
            seats: generateSeats(10),
          },
          // Right side of U
          {
            id: generateId(),
            number: "3",
            shape: "RECTANGULAR",
            x: 600,
            y: 350,
            width: 60,
            height: 200,
            rotation: 90,
            capacity: 10,
            seats: generateSeats(10),
          },
        ],
      },
    ],
  },
  // Mixed Event Templates
  {
    id: "gala-with-vip-rows",
    name: "Gala with VIP Section",
    description: "150-seat gala with 10 round tables and VIP row seating",
    icon: <Sparkles className="w-8 h-8" />,
    category: "gala",
    estimatedCapacity: 150,
    sections: [
      {
        id: "vip-rows",
        name: "VIP Rows",
        color: "#F59E0B",
        x: 150,
        y: 150,
        width: 600,
        height: 200,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, rowIndex) => ({
          id: generateId(),
          label: String.fromCharCode(65 + rowIndex),
          seats: generateSeats(10, "VIP"),
        })),
      },
      {
        id: "dining-tables",
        name: "Dining Tables",
        color: "#8B5CF6",
        x: 150,
        y: 400,
        width: 600,
        height: 400,
        rotation: 0,
        containerType: "TABLES",
        tables: Array.from({ length: 10 }, (_, idx) => ({
          id: generateId(),
          number: `${idx + 1}`,
          shape: "ROUND" as const,
          x: 300 + (idx % 5) * 120,
          y: 500 + Math.floor(idx / 5) * 150,
          width: 100,
          height: 100,
          rotation: 0,
          capacity: 10,
          seats: generateSeats(10),
        })),
      },
    ],
  },
  {
    id: "concert-seated-200",
    name: "Concert with Seated Section",
    description: "200-seat concert with standing GA and seated VIP",
    icon: <Music className="w-8 h-8" />,
    category: "concert",
    estimatedCapacity: 200,
    sections: [
      {
        id: "seated-vip",
        name: "Seated VIP",
        color: "#F59E0B",
        x: 150,
        y: 150,
        width: 300,
        height: 300,
        rotation: 0,
        rows: Array.from({ length: 5 }, (_, rowIndex) => ({
          id: generateId(),
          label: String(rowIndex + 1),
          seats: generateSeats(8, "VIP"),
        })),
      },
      {
        id: "general-admission",
        name: "General Admission (Standing)",
        color: "#06B6D4",
        x: 500,
        y: 150,
        width: 400,
        height: 500,
        rotation: 0,
        rows: [
          {
            id: generateId(),
            label: "GA",
            seats: Array.from({ length: 160 }, (_, i) => ({
              id: generateId(),
              number: `GA-${i + 1}`,
              type: "STANDING" as SeatType,
              status: "AVAILABLE" as const,
            })),
          },
        ],
      },
    ],
  },
  {
    id: "outdoor-garden-wedding",
    name: "Garden Wedding",
    description: "40-guest outdoor garden wedding with ceremony and reception",
    icon: <Heart className="w-8 h-8" />,
    category: "wedding",
    estimatedCapacity: 40,
    sections: [
      {
        id: "ceremony",
        name: "Ceremony Seating",
        color: "#EC4899",
        x: 150,
        y: 150,
        width: 300,
        height: 200,
        rotation: 0,
        rows: Array.from({ length: 4 }, (_, rowIndex) => ({
          id: generateId(),
          label: rowIndex < 2 ? "Bride's Side" : "Groom's Side",
          seats: generateSeats(10),
        })),
      },
      {
        id: "reception",
        name: "Reception Tables",
        color: "#F59E0B",
        x: 150,
        y: 400,
        width: 700,
        height: 300,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Head table
          {
            id: generateId(),
            number: "Head Table",
            shape: "RECTANGULAR",
            x: 500,
            y: 450,
            width: 200,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8, "VIP"),
          },
          // Guest tables
          ...Array.from({ length: 4 }, (_, idx) => ({
            id: generateId(),
            number: `${idx + 1}`,
            shape: "ROUND" as const,
            x: 300 + (idx % 2) * 200,
            y: 550 + Math.floor(idx / 2) * 150,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          })),
        ],
      },
    ],
  },
  {
    id: "corporate-dinner-80",
    name: "Corporate Dinner",
    description: "80-guest corporate dinner with mixed table sizes",
    icon: <Utensils className="w-8 h-8" />,
    category: "banquet",
    estimatedCapacity: 80,
    sections: [
      {
        id: "dining-area",
        name: "Dining Area",
        color: "#FB923C",
        x: 150,
        y: 150,
        width: 700,
        height: 600,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // VIP table
          {
            id: generateId(),
            number: "VIP",
            shape: "RECTANGULAR",
            x: 500,
            y: 250,
            width: 250,
            height: 80,
            rotation: 0,
            capacity: 12,
            seats: generateSeats(12, "VIP"),
          },
          // Round tables
          ...Array.from({ length: 8 }, (_, idx) => ({
            id: generateId(),
            number: `${idx + 1}`,
            shape: "ROUND" as const,
            x: 300 + (idx % 4) * 130,
            y: 400 + Math.floor(idx / 4) * 180,
            width: 110,
            height: 110,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          })),
          // Small square tables for 4
          {
            id: generateId(),
            number: "9",
            shape: "SQUARE",
            x: 750,
            y: 400,
            width: 80,
            height: 80,
            rotation: 45,
            capacity: 4,
            seats: generateSeats(4),
          },
        ],
      },
    ],
  },
  {
    id: "kings-table",
    name: "King's Table",
    description: "Long imperial table seating 50 guests on both sides",
    icon: <Sparkles className="w-8 h-8" />,
    category: "gala",
    estimatedCapacity: 50,
    sections: [
      {
        id: "kings-table-section",
        name: "King's Table",
        color: "#A855F7",
        x: 200,
        y: 250,
        width: 600,
        height: 300,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 500,
            y: 400,
            width: 500,
            height: 100,
            rotation: 0,
            capacity: 50,
            seats: generateSeats(50, "VIP"),
          },
        ],
      },
    ],
  },
  {
    id: "hollow-square",
    name: "Hollow Square",
    description: "32-seat hollow square for collaborative discussions",
    icon: <Grid className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 32,
    sections: [
      {
        id: "hollow-square-section",
        name: "Hollow Square",
        color: "#DC2626",
        x: 200,
        y: 200,
        width: 500,
        height: 500,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Top side
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 450,
            y: 250,
            width: 300,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Right side
          {
            id: generateId(),
            number: "2",
            shape: "RECTANGULAR",
            x: 590,
            y: 400,
            width: 60,
            height: 200,
            rotation: 90,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Bottom side
          {
            id: generateId(),
            number: "3",
            shape: "RECTANGULAR",
            x: 450,
            y: 550,
            width: 300,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Left side
          {
            id: generateId(),
            number: "4",
            shape: "RECTANGULAR",
            x: 310,
            y: 400,
            width: 60,
            height: 200,
            rotation: 90,
            capacity: 8,
            seats: generateSeats(8),
          },
        ],
      },
    ],
  },
  {
    id: "e-shape-conference",
    name: "E-Shape Conference",
    description: "36-seat E-shaped table for panel discussions",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 36,
    sections: [
      {
        id: "e-shape-section",
        name: "E-Shape Setup",
        color: "#DC2626",
        x: 200,
        y: 200,
        width: 600,
        height: 500,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Vertical spine of E
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 300,
            y: 450,
            width: 60,
            height: 300,
            rotation: 90,
            capacity: 12,
            seats: generateSeats(12),
          },
          // Top horizontal of E
          {
            id: generateId(),
            number: "2",
            shape: "RECTANGULAR",
            x: 500,
            y: 300,
            width: 200,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Middle horizontal of E
          {
            id: generateId(),
            number: "3",
            shape: "RECTANGULAR",
            x: 500,
            y: 450,
            width: 200,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
          // Bottom horizontal of E
          {
            id: generateId(),
            number: "4",
            shape: "RECTANGULAR",
            x: 500,
            y: 600,
            width: 200,
            height: 60,
            rotation: 0,
            capacity: 8,
            seats: generateSeats(8),
          },
        ],
      },
    ],
  },
  {
    id: "t-shape-conference",
    name: "T-Shape Conference",
    description: "24-seat T-shaped table for formal meetings",
    icon: <UsersIcon className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 24,
    sections: [
      {
        id: "t-shape-section",
        name: "T-Shape Setup",
        color: "#DC2626",
        x: 250,
        y: 200,
        width: 500,
        height: 500,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Top horizontal of T
          {
            id: generateId(),
            number: "1",
            shape: "RECTANGULAR",
            x: 500,
            y: 300,
            width: 300,
            height: 60,
            rotation: 0,
            capacity: 12,
            seats: generateSeats(12),
          },
          // Vertical stem of T
          {
            id: generateId(),
            number: "2",
            shape: "RECTANGULAR",
            x: 500,
            y: 500,
            width: 60,
            height: 250,
            rotation: 90,
            capacity: 12,
            seats: generateSeats(12),
          },
        ],
      },
    ],
  },
  {
    id: "herringbone-classroom",
    name: "Herringbone Classroom",
    description: "200-seat chevron/herringbone style for large presentations",
    icon: <Theater className="w-8 h-8" />,
    category: "conference",
    estimatedCapacity: 200,
    sections: [
      {
        id: "left-chevron",
        name: "Left Chevron Section",
        color: "#DC2626",
        x: 100,
        y: 200,
        width: 400,
        height: 600,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Left side angled tables (5 rows, 4 tables per row)
          ...Array.from({ length: 5 }, (_, rowIdx) =>
            Array.from({ length: 4 }, (_, colIdx) => ({
              id: generateId(),
              number: `L${rowIdx * 4 + colIdx + 1}`,
              shape: "RECTANGULAR" as const,
              x: 200 + colIdx * 80,
              y: 300 + rowIdx * 100,
              width: 70,
              height: 50,
              rotation: -15,
              capacity: 5,
              seats: generateSeats(5),
            }))
          ).flat(),
        ],
      },
      {
        id: "right-chevron",
        name: "Right Chevron Section",
        color: "#DC2626",
        x: 500,
        y: 200,
        width: 400,
        height: 600,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Right side angled tables (5 rows, 4 tables per row)
          ...Array.from({ length: 5 }, (_, rowIdx) =>
            Array.from({ length: 4 }, (_, colIdx) => ({
              id: generateId(),
              number: `R${rowIdx * 4 + colIdx + 1}`,
              shape: "RECTANGULAR" as const,
              x: 600 + colIdx * 80,
              y: 300 + rowIdx * 100,
              width: 70,
              height: 50,
              rotation: 15,
              capacity: 5,
              seats: generateSeats(5),
            }))
          ).flat(),
        ],
      },
    ],
  },
  {
    id: "cabaret-style",
    name: "Cabaret Style",
    description: "70-seat cabaret with crescent tables facing stage",
    icon: <Music className="w-8 h-8" />,
    category: "gala",
    estimatedCapacity: 70,
    sections: [
      {
        id: "cabaret-section",
        name: "Cabaret Seating",
        color: "#A855F7",
        x: 100,
        y: 200,
        width: 800,
        height: 500,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Front row - 3 tables with crescent seating (135°)
          ...Array.from({ length: 3 }, (_, i) => ({
            id: generateId(),
            number: i + 1,
            shape: "ROUND" as const,
            x: 200 + i * 200,
            y: 300,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 6,
            seatArc: { startAngle: 135, arcDegrees: 135 }, // Crescent facing forward
            seats: generateSeats(6),
          })),
          // Middle row - 4 tables with crescent seating (135°)
          ...Array.from({ length: 4 }, (_, i) => ({
            id: generateId(),
            number: i + 4,
            shape: "ROUND" as const,
            x: 150 + i * 180,
            y: 450,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 6,
            seatArc: { startAngle: 135, arcDegrees: 135 }, // Crescent facing forward
            seats: generateSeats(6),
          })),
          // Back row - 5 tables with crescent seating (135°)
          ...Array.from({ length: 5 }, (_, i) => ({
            id: generateId(),
            number: i + 8,
            shape: "ROUND" as const,
            x: 100 + i * 160,
            y: 600,
            width: 120,
            height: 120,
            rotation: 0,
            capacity: 6,
            seatArc: { startAngle: 135, arcDegrees: 135 }, // Crescent facing forward
            seats: generateSeats(6),
          })),
        ],
      },
    ],
  },
  {
    id: "crescent-banquet",
    name: "Crescent Banquet",
    description: "100-seat formal banquet with half-circle tables",
    icon: <Utensils className="w-8 h-8" />,
    category: "banquet",
    estimatedCapacity: 100,
    sections: [
      {
        id: "crescent-banquet-section",
        name: "Crescent Banquet Hall",
        color: "#F59E0B",
        x: 100,
        y: 150,
        width: 800,
        height: 600,
        rotation: 0,
        containerType: "TABLES",
        tables: [
          // Head table - Full round
          {
            id: generateId(),
            number: "HEAD",
            shape: "ROUND",
            x: 500,
            y: 200,
            width: 140,
            height: 140,
            rotation: 0,
            capacity: 12,
            seatArc: { startAngle: 0, arcDegrees: 360 }, // Full circle for head table
            seats: generateSeats(12, "VIP"),
          },
          // Row 1 - 4 half-circle tables
          ...Array.from({ length: 4 }, (_, i) => ({
            id: generateId(),
            number: i + 1,
            shape: "ROUND" as const,
            x: 200 + i * 200,
            y: 400,
            width: 130,
            height: 130,
            rotation: 0,
            capacity: 8,
            seatArc: { startAngle: 0, arcDegrees: 180 }, // Half circle
            seats: generateSeats(8),
          })),
          // Row 2 - 4 half-circle tables
          ...Array.from({ length: 4 }, (_, i) => ({
            id: generateId(),
            number: i + 5,
            shape: "ROUND" as const,
            x: 200 + i * 200,
            y: 600,
            width: 130,
            height: 130,
            rotation: 0,
            capacity: 8,
            seatArc: { startAngle: 0, arcDegrees: 180 }, // Half circle
            seats: generateSeats(8),
          })),
        ],
      },
    ],
  },
  {
    id: "blank-canvas",
    name: "Blank Canvas",
    description: "Start from scratch with no pre-defined sections",
    icon: <Grid className="w-8 h-8" />,
    category: "custom",
    estimatedCapacity: 0,
    sections: [],
  },
];

interface SeatingTemplatesProps {
  onSelectTemplate: (template: SeatingTemplate) => void;
  onClose: () => void;
}

export default function SeatingTemplates({ onSelectTemplate, onClose }: SeatingTemplatesProps) {
  const categories = [
    { id: "theater", name: "Theater", color: "bg-accent text-primary" },
    { id: "stadium", name: "Stadium", color: "bg-accent text-primary" },
    { id: "concert", name: "Concert", color: "bg-accent text-accent-foreground" },
    { id: "conference", name: "Conference", color: "bg-destructive/10 text-destructive" },
    { id: "outdoor", name: "Outdoor", color: "bg-success/10 text-success" },
    { id: "wedding", name: "Wedding", color: "bg-accent text-accent-foreground" },
    { id: "gala", name: "Gala", color: "bg-accent text-primary" },
    { id: "banquet", name: "Banquet", color: "bg-warning/10 text-warning" },
    { id: "custom", name: "Custom", color: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-primary px-8 py-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Choose a Seating Template</h2>
          <p className="text-primary-foreground">
            Start with a pre-built layout or create your own from scratch
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seatingTemplates.map((template) => {
              const category = categories.find((c) => c.id === template.category);

              return (
                <motion.button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-card border-2 border-border rounded-lg p-6 text-left hover:border-primary hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-accent rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">{template.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${category?.color}`}
                      >
                        {category?.name}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="text-muted-foreground">
                      <span className="font-semibold">{template.sections.length}</span> sections
                    </div>
                    <div className="text-primary font-semibold">
                      ~{template.estimatedCapacity} capacity
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-8 py-4 bg-muted flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
