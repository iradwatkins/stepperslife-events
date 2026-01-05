"use client";

import {
  Circle,
  Square,
  RectangleHorizontal,
  Pentagon,
  MousePointer,
  Hand,
  Grid3x3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export type ToolType =
  | "select"
  | "pan"
  | "table-round"
  | "table-rectangular"
  | "table-square"
  | "table-custom"
  | "row-section";

export interface Tool {
  id: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  category: "selection" | "tables" | "sections";
  cursor?: string;
}

const tools: Tool[] = [
  // Selection tools
  {
    id: "select",
    icon: <MousePointer className="w-5 h-5" />,
    label: "Select / Move",
    shortcut: "V",
    category: "selection",
    cursor: "default",
  },
  {
    id: "pan",
    icon: <Hand className="w-5 h-5" />,
    label: "Pan Canvas",
    shortcut: "H",
    category: "selection",
    cursor: "grab",
  },
  // Table tools
  {
    id: "table-round",
    icon: <Circle className="w-5 h-5" />,
    label: "Round Table",
    shortcut: "T",
    category: "tables",
    cursor: "crosshair",
  },
  {
    id: "table-rectangular",
    icon: <RectangleHorizontal className="w-5 h-5" />,
    label: "Rectangle Table",
    shortcut: "R",
    category: "tables",
    cursor: "crosshair",
  },
  {
    id: "table-square",
    icon: <Square className="w-5 h-5" />,
    label: "Square Table",
    shortcut: "Q",
    category: "tables",
    cursor: "crosshair",
  },
  {
    id: "table-custom",
    icon: <Pentagon className="w-5 h-5" />,
    label: "Pentagon Table",
    shortcut: "P",
    category: "tables",
    cursor: "crosshair",
  },
  // Section tools
  {
    id: "row-section",
    icon: <Grid3x3 className="w-5 h-5" />,
    label: "Row Section",
    shortcut: "S",
    category: "sections",
    cursor: "crosshair",
  },
];

interface ToolPaletteProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  className?: string;
}

export default function ToolPalette({
  activeTool,
  onToolSelect,
  className = "",
}: ToolPaletteProps) {
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);

  // Group tools by category
  const selectionTools = tools.filter((t) => t.category === "selection");
  const tableTools = tools.filter((t) => t.category === "tables");
  const sectionTools = tools.filter((t) => t.category === "sections");

  const renderToolButton = (tool: Tool) => {
    const isActive = activeTool === tool.id;
    const isHovered = hoveredTool === tool.id;

    return (
      <div key={tool.id} className="relative">
        <motion.button
          onClick={() => onToolSelect(tool.id)}
          onMouseEnter={() => setHoveredTool(tool.id)}
          onMouseLeave={() => setHoveredTool(null)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative w-12 h-12 rounded-lg flex items-center justify-center transition-all
            ${
              isActive
                ? "bg-accent border-2 border-primary text-primary shadow-sm"
                : "bg-card hover:bg-muted border border text-foreground"
            }
          `}
          title={`${tool.label} (${tool.shortcut || ""})`}
        >
          {tool.icon}

          {/* Active indicator dot */}
          {isActive && (
            <motion.div
              layoutId="active-tool-indicator"
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Tooltip */}
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-foreground text-background px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
              {tool.label}
              {tool.shortcut && <span className="ml-2 opacity-70">({tool.shortcut})</span>}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px]">
                <div className="w-2 h-2 bg-foreground transform rotate-45" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border shadow-sm flex flex-col py-4 px-2 z-30 ${className}`}
      style={{ width: "64px" }}
    >
      {/* Selection Tools */}
      <div className="space-y-2">{selectionTools.map(renderToolButton)}</div>

      {/* Divider */}
      <div className="my-3 h-px bg-muted" />

      {/* Table Tools */}
      <div className="space-y-2">{tableTools.map(renderToolButton)}</div>

      {/* Divider */}
      <div className="my-3 h-px bg-muted" />

      {/* Section Tools */}
      <div className="space-y-2">{sectionTools.map(renderToolButton)}</div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help text at bottom */}
      <div className="mt-4 px-1">
        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          Press ESC to return to Select
        </p>
      </div>
    </div>
  );
}

export { tools };
