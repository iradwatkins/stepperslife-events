"use client";

import { useState } from "react";
import { X, RotateCw, Maximize2, Users, Hash, Wand2 } from "lucide-react";
import TableShapePalette, { TableShape, getTableShapeIcon } from "./TableShapePalette";
import { autoArrangeSeats, getRecommendedTableSize } from "@/lib/seating/tableGeometry";
import { motion, AnimatePresence } from "framer-motion";

export interface Table {
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

interface TableEditorProps {
  table: Table;
  onUpdate: (updates: Partial<Table>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TableEditor({ table, onUpdate, onDelete, onClose }: TableEditorProps) {
  const [localCapacity, setLocalCapacity] = useState(table?.capacity?.toString() || "4");

  const handleCapacityChange = (value: string) => {
    setLocalCapacity(value);
    const capacity = parseInt(value) || 0;
    if (capacity > 0 && capacity !== table?.capacity) {
      // Generate seats based on capacity
      const newSeats = Array.from({ length: capacity }, (_, i) => ({
        id: `seat-${Date.now()}-${i}`,
        number: String(i + 1),
        type: "STANDARD",
        status: "AVAILABLE",
      }));
      onUpdate({ capacity, seats: newSeats });
    }
  };

  const handleShapeChange = (shape: TableShape) => {
    // Get recommended size for new shape
    const { width, height } = getRecommendedTableSize(shape, table?.capacity || 4);
    onUpdate({ shape, width, height });
  };

  const handleAutoArrange = () => {
    if (!table) return;

    // Auto-arrange seats around table
    const positions = autoArrangeSeats(
      table.shape,
      0, // Relative to table
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
    const newRotation = ((table.rotation || 0) + 15) % 360;
    onUpdate({ rotation: newRotation });
  };

  const handleResize = (dimension: "width" | "height", value: number) => {
    const newValue = Math.max(60, value);
    onUpdate({ [dimension]: newValue });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
        className="fixed right-0 top-0 h-full w-96 bg-card shadow-2xl border-l border-border overflow-y-auto z-50"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Edit Table</h2>
            <button
              type="button" onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Table Number/Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Table Number / Name
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={table.number}
                onChange={(e) => onUpdate({ number: e.target.value })}
                placeholder="e.g., 1, VIP 1, Head Table"
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          {/* Shape Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Table Shape</label>
            <TableShapePalette
              currentShape={table.shape}
              onShapeSelect={handleShapeChange}
              compact
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Seating Capacity</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="1"
                max="100"
                value={localCapacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Number of seats around this table (1-100)</p>
            {parseInt(localCapacity) > 50 && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-warning/10 border border-warning rounded text-xs text-warning">
                <span>⚠️</span>
                <span>
                  Large tables (50+ seats) work best with King's Table or long rectangular
                  configurations
                </span>
              </div>
            )}
          </div>

          {/* Seat Arrangement - Only for ROUND tables */}
          {table.shape === "ROUND" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Seat Arrangement
              </label>
              <select
                value={
                  table.seatArc?.arcDegrees === 360 || !table.seatArc
                    ? "full"
                    : table.seatArc?.arcDegrees === 270
                      ? "three-quarter"
                      : table.seatArc?.arcDegrees === 180
                        ? "half"
                        : table.seatArc?.arcDegrees === 135
                          ? "crescent"
                          : "full"
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
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="full">Full Circle (360°)</option>
                <option value="three-quarter">3/4 Circle (270°)</option>
                <option value="half">Half Circle (180°)</option>
                <option value="crescent">Crescent/Cabaret (135°)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Cabaret/Crescent style seats guests on one side only, perfect for viewing a stage or
                presentation
              </p>
            </div>
          )}

          {/* Auto-Arrange Button */}
          <button
            type="button"
            onClick={handleAutoArrange}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:from-primary/90 hover:to-blue-700 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Auto-Arrange Seats
          </button>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dimensions (pixels)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Width</label>
                <input
                  type="number"
                  min="60"
                  value={Math.round(table.width)}
                  onChange={(e) => handleResize("width", parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Height</label>
                <input
                  type="number"
                  min="60"
                  value={Math.round(table.height)}
                  onChange={(e) => handleResize("height", parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Position (pixels)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(table.x)}
                  onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(table.y)}
                  onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Drag the table on the canvas to reposition
            </p>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rotation</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={table.rotation || 0}
                onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium text-foreground w-12 text-right">
                {table.rotation || 0}°
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

          {/* Table Info */}
          <div className="bg-accent border border-primary/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Table Info</h3>
            <div className="space-y-1 text-xs text-foreground">
              <div className="flex items-center justify-between">
                <span>Shape:</span>
                <span className="font-medium">{table.shape}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Seats:</span>
                <span className="font-medium">{table.seats.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Available:</span>
                <span className="font-medium text-success">
                  {table.seats.filter((s) => s.status === "AVAILABLE").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reserved:</span>
                <span className="font-medium text-warning">
                  {table.seats.filter((s) => s.status === "RESERVED").length}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border space-y-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              Done Editing
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete Table ${table.number}?`)) {
                  onDelete();
                  onClose();
                }
              }}
              className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium"
            >
              Delete Table
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
