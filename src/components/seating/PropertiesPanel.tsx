"use client";

import { useState } from "react";
import { X, RotateCw, Wand2, Hash, Users, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TableShapePalette, { TableShape } from "./TableShapePalette";
import { autoArrangeSeats, getRecommendedTableSize } from "@/lib/seating/tableGeometry";

interface Table {
  id: string;
  number: string | number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seatArc?: {
    startAngle?: number;
    arcDegrees?: number;
  };
  seats: Array<{
    id: string;
    number: string;
    type: string;
    status: string;
    position?: {
      angle?: number;
      side?: string;
      offset?: number;
    };
  }>;
}

interface Row {
  id: string;
  label?: string;
  rowNumber?: number;
  seats?: Array<{
    id: string;
    number: string;
    type: string;
    status: string;
  }>;
}

interface Section {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: "ROWS" | "TABLES";
  rows?: Row[];
  tables?: Table[];
}

type PropertiesTarget = { type: "table"; data: Table } | { type: "section"; data: Section } | null;

// Update types for table and section properties
type TableUpdates = Partial<Table>;
type SectionUpdates = Partial<Section>;
type PropertiesUpdates = TableUpdates | SectionUpdates;

interface PropertiesPanelProps {
  target: PropertiesTarget;
  onUpdate: (updates: PropertiesUpdates) => void;
  onDelete: () => void;
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PropertiesPanel({
  target,
  onUpdate,
  onDelete,
  onClose,
}: PropertiesPanelProps) {
  if (!target) return null;

  const isTable = target.type === "table";
  const data = target.data;

  // Table-specific handlers
  const handleTableCapacityChange = (value: string) => {
    const capacity = parseInt(value) || 0;
    if (capacity > 0 && capacity !== (data as Table).capacity) {
      const newSeats = Array.from({ length: capacity }, (_, i) => ({
        id: `seat-${Date.now()}-${i}`,
        number: String(i + 1),
        type: "STANDARD",
        status: "AVAILABLE",
      }));
      onUpdate({ capacity, seats: newSeats });
    }
  };

  const handleTableShapeChange = (shape: TableShape) => {
    const { width, height } = getRecommendedTableSize(shape, (data as Table).capacity || 4);
    onUpdate({ shape, width, height });
  };

  const handleAutoArrange = () => {
    if (!isTable) return;
    const table = data as Table;

    const positions = autoArrangeSeats(
      table.shape,
      0,
      0,
      table.width,
      table.height,
      table.capacity,
      table.seatArc
    );

    const newSeats = table.seats.map((seat, i) => ({
      ...seat,
      position: positions[i]
        ? {
            angle: positions[i].angle,
            side: positions[i].side,
            offset: positions[i].offset,
          }
        : undefined,
    }));

    onUpdate({ seats: newSeats });
  };

  const handleRotate = () => {
    const newRotation = ((data.rotation || 0) + 15) % 360;
    onUpdate({ rotation: newRotation });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
        className="fixed right-0 top-0 h-full w-96 bg-card shadow-2xl border-l border-border overflow-y-auto z-40"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{isTable ? `Edit Table` : `Edit Section`}</h2>
            <button
              type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-sky-100 mt-1">
            {isTable ? `Table ${(data as Table).number}` : (data as Section).name}
          </p>
        </div>

        {/* Content */}
        <div>
          {/* Basic Info Section */}
          <CollapsibleSection title="Basic Info" icon={<Hash className="w-4 h-4 text-muted-foreground" />}>
            {isTable ? (
              <>
                {/* Table Number/Name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Table Number / Name
                  </label>
                  <input
                    type="text"
                    value={(data as Table).number}
                    onChange={(e) => onUpdate({ number: e.target.value })}
                    placeholder="e.g., 1, VIP 1, Head Table"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                {/* Shape Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Table Shape
                  </label>
                  <TableShapePalette
                    currentShape={(data as Table).shape}
                    onShapeSelect={handleTableShapeChange}
                    compact
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={(data as Table).capacity}
                    onChange={(e) => handleTableCapacityChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of seats around this table (1-100)
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Section Name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Section Name
                  </label>
                  <input
                    type="text"
                    value={(data as Section).name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                {/* Section Color */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Section Color
                  </label>
                  <input
                    type="color"
                    value={(data as Section).color || "#3B82F6"}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="w-full h-10 px-2 border border-border rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}
          </CollapsibleSection>

          {/* Position & Size Section */}
          <CollapsibleSection
            title="Position & Size"
            icon={<RotateCw className="w-4 h-4 text-muted-foreground" />}
          >
            {/* Position */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Position (pixels)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(data.x || 0)}
                    onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(data.y || 0)}
                    onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Dimensions (pixels)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Width</label>
                  <input
                    type="number"
                    min={isTable ? "60" : "100"}
                    value={Math.round(data.width || 0)}
                    onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Height</label>
                  <input
                    type="number"
                    min={isTable ? "60" : "80"}
                    value={Math.round(data.height || 0)}
                    onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Rotation</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={data.rotation || 0}
                  onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs font-medium text-foreground w-10 text-right">
                  {data.rotation || 0}°
                </span>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  title="Rotate 15°"
                >
                  <RotateCw className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Table-specific: Seating Arrangement */}
          {isTable && (data as Table).shape === "ROUND" && (
            <CollapsibleSection
              title="Seating Arrangement"
              icon={<Users className="w-4 h-4 text-muted-foreground" />}
            >
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Seat Pattern
                </label>
                <select
                  value={
                    (data as Table).seatArc?.arcDegrees === 360 || !(data as Table).seatArc
                      ? "full"
                      : (data as Table).seatArc?.arcDegrees === 270
                        ? "three-quarter"
                        : (data as Table).seatArc?.arcDegrees === 180
                          ? "half"
                          : "crescent"
                  }
                  onChange={(e) => {
                    const arcMap = {
                      full: { startAngle: 0, arcDegrees: 360 },
                      "three-quarter": { startAngle: 45, arcDegrees: 270 },
                      half: { startAngle: 0, arcDegrees: 180 },
                      crescent: { startAngle: 0, arcDegrees: 135 },
                    };
                    onUpdate({ seatArc: arcMap[e.target.value as keyof typeof arcMap] });
                  }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="full">Full Circle (360°)</option>
                  <option value="three-quarter">3/4 Circle (270°)</option>
                  <option value="half">Half Circle (180°)</option>
                  <option value="crescent">Cabaret/Crescent (135°)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Cabaret/Crescent style seats guests on one side only
                </p>
              </div>

              {/* Auto-Arrange Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleAutoArrange}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                >
                  <Wand2 className="w-4 h-4" />
                  Auto-Arrange Seats
                </button>
              </div>
            </CollapsibleSection>
          )}

          {/* Table Info */}
          {isTable && (
            <div className="px-6 py-4 bg-accent border-y border-primary/30">
              <h3 className="text-xs font-semibold text-foreground mb-2">Table Info</h3>
              <div className="space-y-1 text-xs text-foreground">
                <div className="flex items-center justify-between">
                  <span>Shape:</span>
                  <span className="font-medium">{(data as Table).shape}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Seats:</span>
                  <span className="font-medium">{(data as Table).seats?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Available:</span>
                  <span className="font-medium text-success">
                    {(data as Table).seats?.filter((s) => s.status === "AVAILABLE").length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border space-y-3 bg-muted">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            Done Editing
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete this ${isTable ? "table" : "section"}?`)) {
                onDelete();
                onClose();
              }
            }}
            className="w-full px-4 py-2.5 bg-destructive/10 border border-destructive text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium"
          >
            Delete {isTable ? "Table" : "Section"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
