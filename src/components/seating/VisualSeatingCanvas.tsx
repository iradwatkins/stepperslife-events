"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Grid as GridIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import TableRenderer from "./TableRenderer";

type SeatType = "STANDARD" | "WHEELCHAIR" | "COMPANION" | "VIP" | "BLOCKED" | "STANDING" | "PARKING" | "TENT";
type SeatStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";

interface Seat {
  id: string;
  number: string;
  type: SeatType;
  status: SeatStatus;
}

interface Row {
  id: string;
  label: string;
  rowNumber?: number;
  seats: Seat[];
}

interface Table {
  id: string;
  number: string | number;
  shape: "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  capacity: number;
  seats: Seat[];
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
  ticketTierId?: Id<"ticketTiers">;
}

interface VisualSeatingCanvasProps {
  venueImageUrl?: string;
  sections: Section[];
  onSectionUpdate: (sectionId: string, updates: Partial<Section>) => void;
  selectedSectionId?: string;
  onSectionSelect: (sectionId: string) => void;
  // Table-specific props
  selectedTableId?: string;
  onTableSelect?: (sectionId: string, tableId: string) => void;
  onTableUpdate?: (sectionId: string, tableId: string, updates: Partial<Table>) => void;
}

export default function VisualSeatingCanvas({
  venueImageUrl,
  sections,
  onSectionUpdate,
  selectedSectionId,
  onSectionSelect,
  selectedTableId,
  onTableSelect,
  onTableUpdate,
}: VisualSeatingCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showSectionLabels, setShowSectionLabels] = useState(true);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0, sectionX: 0, sectionY: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const tableDragStartPos = useRef({ x: 0, y: 0, tableX: 0, tableY: 0 });
  const currentDraggingTable = useRef<{ sectionId: string; tableId: string } | null>(null);

  // Handle section dragging
  useEffect(() => {
    if (!isDragging || !selectedSectionId) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSectionDrag(e, selectedSectionId);
    };

    const handleMouseUp = () => {
      handleSectionDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, selectedSectionId]);

  // Handle section resizing
  useEffect(() => {
    if (!isResizing || !selectedSectionId) return;

    const handleMouseMove = (e: MouseEvent) => {
      // We need to track which corner is being resized
      // For now, we'll use a simple approach
      handleResize(e, selectedSectionId, "se");
    };

    const handleMouseUp = () => {
      handleResizeEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing, selectedSectionId]);

  // Handle table dragging
  useEffect(() => {
    if (!isDraggingTable || !currentDraggingTable.current) return;

    const { sectionId, tableId } = currentDraggingTable.current;

    const handleMouseMove = (e: MouseEvent) => {
      handleTableDrag(e, sectionId, tableId);
    };

    const handleMouseUp = () => {
      handleTableDragEnd();
      currentDraggingTable.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingTable]);

  const handleSectionDragStart = (e: React.MouseEvent, section: Section) => {
    e.stopPropagation();
    setIsDragging(true);
    onSectionSelect(section.id);

    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      sectionX: section.x || 0,
      sectionY: section.y || 0,
    };
  };

  const handleSectionDrag = useCallback(
    (e: MouseEvent, sectionId: string) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      onSectionUpdate(sectionId, {
        x: dragStartPos.current.sectionX + deltaX,
        y: dragStartPos.current.sectionY + deltaY,
      });
    },
    [isDragging, onSectionUpdate]
  );

  const handleSectionDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e: React.MouseEvent, section: Section, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    onSectionSelect(section.id);

    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: section.width || 200,
      height: section.height || 150,
    };
  };

  const handleResize = useCallback(
    (e: MouseEvent, sectionId: string, corner: string) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;

      if (corner.includes("e")) newWidth += deltaX;
      if (corner.includes("w")) newWidth -= deltaX;
      if (corner.includes("s")) newHeight += deltaY;
      if (corner.includes("n")) newHeight -= deltaY;

      onSectionUpdate(sectionId, {
        width: Math.max(100, newWidth),
        height: Math.max(80, newHeight),
      });
    },
    [isResizing, onSectionUpdate]
  );

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const rotateSection = (sectionId: string, currentRotation: number = 0) => {
    onSectionUpdate(sectionId, {
      rotation: (currentRotation + 15) % 360,
    });
  };

  const getTotalSeats = (section: Section) => {
    let total = 0;
    if (section.rows) {
      total += section.rows.reduce((sum, row) => sum + row.seats.length, 0);
    }
    if (section.tables) {
      total += section.tables.reduce((sum, table) => sum + table.seats.length, 0);
    }
    return total;
  };

  const handleTableDragStart = (e: React.MouseEvent, sectionId: string, table: Table) => {
    e.stopPropagation();
    setIsDraggingTable(true);
    currentDraggingTable.current = { sectionId, tableId: table.id };
    if (onTableSelect) {
      onTableSelect(sectionId, table.id);
    }

    tableDragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      tableX: table.x,
      tableY: table.y,
    };
  };

  const handleTableDrag = useCallback(
    (e: MouseEvent, sectionId: string, tableId: string) => {
      if (!isDraggingTable || !onTableUpdate) return;

      const deltaX = e.clientX - tableDragStartPos.current.x;
      const deltaY = e.clientY - tableDragStartPos.current.y;

      onTableUpdate(sectionId, tableId, {
        x: tableDragStartPos.current.tableX + deltaX,
        y: tableDragStartPos.current.tableY + deltaY,
      });
    },
    [isDraggingTable, onTableUpdate]
  );

  const handleTableDragEnd = () => {
    setIsDraggingTable(false);
  };

  return (
    <div
      id="seating-canvas"
      className="relative bg-white rounded-lg border border overflow-hidden"
    >
      {/* Controls Bar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow border border p-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded transition-colors ${
              showGrid ? "bg-foreground text-white" : "bg-white text-foreground hover:bg-muted"
            }`}
            title={showGrid ? "Hide Grid" : "Show Grid"}
          >
            <GridIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSectionLabels(!showSectionLabels)}
            className={`p-2 rounded transition-colors ${
              showSectionLabels
                ? "bg-foreground text-white"
                : "bg-white text-foreground hover:bg-muted"
            }`}
            title={showSectionLabels ? "Hide Labels" : "Show Labels"}
          >
            {showSectionLabels ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <div className="bg-card border border rounded-lg p-3 text-xs">
          <p className="text-foreground font-semibold mb-1">Quick Tips:</p>
          <ul className="text-foreground space-y-1">
            <li>• Drag sections to position</li>
            <li>• Drag corners to resize</li>
            <li>• Click rotate button</li>
            <li>• Scroll to zoom</li>
          </ul>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg border border p-3">
        <h4 className="font-semibold text-foreground text-sm mb-2">Sections</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {sections.map((section) => (
            <button
              type="button"
              key={section.id}
              onClick={() => onSectionSelect(section.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                selectedSectionId === section.id
                  ? "bg-foreground text-white"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="w-3 h-3 border-2 flex-shrink-0 border-foreground" />
              <span className="font-medium truncate">{section.name}</span>
              <span
                className={`ml-auto ${selectedSectionId === section.id ? "text-muted-foreground" : "text-muted-foreground"}`}
              >
                {getTotalSeats(section)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-lg border border p-2 flex gap-2">
              <button
                type="button"
                onClick={() => zoomIn()}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => zoomOut()}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => resetTransform()}
                className="p-2 hover:bg-muted rounded transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "600px" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <div
                ref={canvasRef}
                className={`relative w-full h-full ${venueImageUrl ? "" : "bg-card"}`}
                style={{
                  backgroundImage: venueImageUrl ? `url(${venueImageUrl})` : "none",
                  backgroundColor: venueImageUrl ? "transparent" : undefined,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* Grid Overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, oklch(0 0 0 / 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, oklch(0 0 0 / 0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: "50px 50px",
                    }}
                  />
                )}

                {/* Empty State - Show when no sections */}
                {sections.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 rounded-lg shadow-lg border-2 border-sky-300 p-8 max-w-md text-center">
                      <GridIcon className="w-16 h-16 text-sky-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {venueImageUrl ? "Ready to Design!" : "Blank Canvas Ready"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {venueImageUrl
                          ? "Your venue image is loaded. Now add sections to start designing your seating layout."
                          : "No venue image needed! You can design your seating layout on this blank canvas."}
                      </p>
                      <div className="bg-accent border border-sky-200 rounded-lg p-3 text-left">
                        <p className="text-xs font-semibold text-foreground mb-2">📍 Next Steps:</p>
                        <ol className="text-xs text-sky-800 space-y-1 list-decimal list-inside">
                          <li>Scroll down to click "Add Section to Canvas"</li>
                          <li>Sections will appear here - drag to position</li>
                          <li>Add tables or rows to your sections</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Boxes */}
                {sections.map((section) => {
                  const isSelected = selectedSectionId === section.id;
                  const sectionX = section.x || 100;
                  const sectionY = section.y || 100;
                  const sectionWidth = section.width || 200;
                  const sectionHeight = section.height || 150;
                  const sectionRotation = section.rotation || 0;

                  return (
                    <motion.div
                      key={section.id}
                      className={`absolute cursor-move transition-all ${isSelected ? "z-10 border-2 border-solid border-foreground" : "border-2 border-dashed border-muted-foreground"}`}
                      style={{
                        left: sectionX,
                        top: sectionY,
                        width: sectionWidth,
                        height: sectionHeight,
                        backgroundColor: "transparent",
                        borderRadius: "4px",
                        transform: `rotate(${sectionRotation}deg)`,
                      }}
                      onMouseDown={(e) => handleSectionDragStart(e, section)}
                      whileHover={{ scale: isDragging ? 1 : 1.01 }}
                    >
                      {/* Section Label */}
                      {showSectionLabels && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-sm">
                            <p className="font-bold text-foreground text-sm">{section.name}</p>
                            <p className="text-xs text-muted-foreground">{getTotalSeats(section)} seats</p>
                          </div>
                        </div>
                      )}

                      {/* Resize Handles (only show when selected) */}
                      {isSelected && (
                        <>
                          {["nw", "ne", "sw", "se"].map((corner) => (
                            <div
                              key={corner}
                              className="absolute w-3 h-3 bg-black border-2 border-white rounded-sm cursor-nwse-resize hover:scale-125 transition-transform"
                              style={{
                                [corner.includes("n") ? "top" : "bottom"]: "-6px",
                                [corner.includes("w") ? "left" : "right"]: "-6px",
                              }}
                              onMouseDown={(e) => handleResizeStart(e, section, corner)}
                            />
                          ))}

                          {/* Rotate Button */}
                          <button
                            type="button"
                            className="absolute -top-10 left-1/2 -translate-x-1/2 p-1.5 bg-card text-white rounded-full border-2 border-white hover:bg-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              rotateSection(section.id, sectionRotation);
                            }}
                            title="Rotate 15°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </motion.div>
                  );
                })}

                {/* Tables SVG Overlay */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  {sections.map((section) => {
                    if (!section.tables || section.tables.length === 0) return null;

                    return section.tables.map((table) => {
                      const isSelected = selectedTableId === table.id;

                      return (
                        <g
                          key={table.id}
                          className="pointer-events-auto"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleTableDragStart(
                              e as unknown as React.MouseEvent,
                              section.id,
                              table
                            );
                          }}
                        >
                          <TableRenderer
                            table={table}
                            isSelected={isSelected}
                            onClick={() => {
                              if (onTableSelect) {
                                onTableSelect(section.id, table.id);
                              }
                            }}
                            showSeats={true}
                            showLabel={true}
                            scale={1}
                          />
                        </g>
                      );
                    });
                  })}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
