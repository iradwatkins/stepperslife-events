"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Grid,
  AlertCircle,
  Loader2,
  LayoutTemplate,
  Settings2,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import VisualSeatingCanvas from "@/components/seating/VisualSeatingCanvas";
import SeatingTemplates, { type SeatingTemplate } from "@/components/seating/SeatingTemplates";
import { type TableShape } from "@/components/seating/TableShapePalette";
import { toast } from "sonner";

type SeatType = "STANDARD" | "WHEELCHAIR" | "COMPANION" | "VIP" | "BLOCKED" | "STANDING" | "PARKING" | "TENT";
type SeatStatus = "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
type SeatingStyle = "ROW_BASED" | "TABLE_BASED" | "MIXED";
type ContainerType = "ROWS" | "TABLES";

// Convex-compatible types for mutation args
type ConvexTableShape = "ROUND" | "RECTANGULAR" | "SQUARE" | "CUSTOM";

interface ConvexSeat {
  id: string;
  number: string;
  type: SeatType;
  status: SeatStatus;
}

interface ConvexRow {
  id: string;
  label: string;
  curved?: boolean;
  seats: ConvexSeat[];
}

interface ConvexTable {
  id: string;
  number: string | number;
  shape: ConvexTableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  customPath?: string;
  capacity: number;
  seats: ConvexSeat[];
}

interface ConvexSection {
  id: string;
  name: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  containerType?: ContainerType;
  rows?: ConvexRow[];
  tables?: ConvexTable[];
  ticketTierId?: Id<"ticketTiers">;
}

interface Seat {
  id: string;
  number: string;
  type: SeatType;
  status: SeatStatus;
}

interface Row {
  id: string;
  label: string;
  seats: Seat[];
}

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
  containerType?: ContainerType;
  rows?: Row[];
  tables?: Table[];
  ticketTierId?: Id<"ticketTiers">;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const generateSeats = (count: number, type: SeatType = "STANDARD"): Seat[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    number: String(i + 1),
    type,
    status: "AVAILABLE" as SeatStatus,
  }));
};

export default function SeatingChartBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  // State
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [seatingStyle, setSeatingStyle] = useState<SeatingStyle>("TABLE_BASED");
  const [chartName, setChartName] = useState("Seating Chart");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Quick setup state
  const [quickTableCount, setQuickTableCount] = useState(10);
  const [quickSeatsPerTable, setQuickSeatsPerTable] = useState(8);
  const [quickTableShape, setQuickTableShape] = useState<TableShape>("ROUND");

  // Convex queries and mutations
  const event = useQuery(api.events.queries.getEventById, { eventId });
  const existingChart = useQuery(api.seating.queries.getEventSeatingChart, { eventId });
  const createSeatingChart = useMutation(api.seating.mutations.createSeatingChart);
  const updateSeatingChart = useMutation(api.seating.mutations.updateSeatingChart);

  // Load existing chart
  useEffect(() => {
    if (existingChart) {
      setSections(existingChart.sections as Section[]);
      setChartName(existingChart.name);
      setSeatingStyle(existingChart.seatingStyle as SeatingStyle);
    }
  }, [existingChart]);

  // Track changes
  useEffect(() => {
    if (existingChart) {
      const hasDataChanges = JSON.stringify(sections) !== JSON.stringify(existingChart.sections);
      setHasChanges(hasDataChanges);
    } else if (sections.length > 0) {
      setHasChanges(true);
    }
  }, [sections, existingChart]);

  // Section update handler
  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<Section>) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  }, []);

  // Table update handler
  const handleTableUpdate = useCallback(
    (sectionId: string, tableId: string, updates: Partial<Table>) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId || !section.tables) return section;
          return {
            ...section,
            tables: section.tables.map((table) =>
              table.id === tableId ? { ...table, ...updates } : table
            ),
          };
        })
      );
    },
    []
  );

  // Add new section
  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      name: `Section ${sections.length + 1}`,
      color: "#3B82F6",
      x: 200 + sections.length * 50,
      y: 200 + sections.length * 30,
      width: 300,
      height: 250,
      containerType: "TABLES",
      tables: [],
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  // Add table to selected section
  const addTableToSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const tableCount = section.tables?.length || 0;
        const newTable: Table = {
          id: generateId(),
          number: tableCount + 1,
          shape: "ROUND",
          x: (section.x || 200) + 50 + (tableCount % 4) * 120,
          y: (section.y || 200) + 50 + Math.floor(tableCount / 4) * 120,
          width: 100,
          height: 100,
          rotation: 0,
          capacity: 8,
          seats: generateSeats(8),
        };

        return {
          ...section,
          tables: [...(section.tables || []), newTable],
        };
      })
    );
  };

  // Delete table
  const deleteTable = (sectionId: string, tableId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId || !section.tables) return section;
        return {
          ...section,
          tables: section.tables.filter((t) => t.id !== tableId),
        };
      })
    );
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: SeatingTemplate) => {
    setSections(template.sections as Section[]);
    setSeatingStyle(
      template.sections.some((s) => s.tables) ? "TABLE_BASED" : "ROW_BASED"
    );
    toast.success(`Template "${template.name}" applied!`);
  };

  // Quick setup - generate ballroom tables
  const applyQuickSetup = () => {
    const tables: Table[] = [];
    const cols = Math.ceil(Math.sqrt(quickTableCount));
    const spacing = 150;

    for (let i = 0; i < quickTableCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      tables.push({
        id: generateId(),
        number: i + 1,
        shape: quickTableShape,
        x: 150 + col * spacing,
        y: 200 + row * spacing,
        width: quickTableShape === "ROUND" ? 100 : 120,
        height: quickTableShape === "ROUND" ? 100 : 80,
        rotation: 0,
        capacity: quickSeatsPerTable,
        seats: generateSeats(quickSeatsPerTable),
      });
    }

    const newSection: Section = {
      id: generateId(),
      name: "Ballroom",
      color: "#8B5CF6",
      x: 100,
      y: 150,
      width: 50 + cols * spacing,
      height: 100 + Math.ceil(quickTableCount / cols) * spacing,
      containerType: "TABLES",
      tables,
    };

    setSections([newSection]);
    setSeatingStyle("TABLE_BASED");
    setShowQuickSetup(false);
    toast.success(`Created ${quickTableCount} tables with ${quickSeatsPerTable} seats each!`);
  };

  // Save seating chart
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (existingChart) {
        await updateSeatingChart({
          seatingChartId: existingChart._id,
          name: chartName,
          seatingStyle,
          sections: sections as ConvexSection[],
        });
        toast.success("Seating chart updated!");
      } else {
        await createSeatingChart({
          eventId,
          name: chartName,
          seatingStyle,
          sections: sections as ConvexSection[],
        });
        toast.success("Seating chart created!");
      }
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save seating chart:", error);
      toast.error("Failed to save seating chart");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total seats
  const totalSeats = sections.reduce((total, section) => {
    if (section.tables) {
      return total + section.tables.reduce((sum, table) => sum + table.seats.length, 0);
    }
    if (section.rows) {
      return total + section.rows.reduce((sum, row) => sum + row.seats.length, 0);
    }
    return total;
  }, 0);

  if (!event) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/organizer/events/${eventId}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Seating Chart Builder</h1>
                <p className="text-sm text-muted-foreground">{event.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{totalSeats}</span> total seats
              </div>

              {hasChanges && (
                <span className="text-xs text-warning font-medium bg-warning/10 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Chart
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">Quick Start</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  Choose Template
                </button>
                <button
                  onClick={() => setShowQuickSetup(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Table2 className="w-4 h-4" />
                  Quick Table Setup
                </button>
              </div>
            </div>

            {/* Sections Panel */}
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Sections</h3>
                <button
                  onClick={addSection}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  title="Add Section"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sections yet. Use a template or add a section to get started.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSectionId === section.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted hover:bg-muted/80 border border-transparent"
                      }`}
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{section.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="p-1 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {section.tables?.length || 0} tables,{" "}
                        {section.tables?.reduce((sum, t) => sum + t.seats.length, 0) || 0} seats
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Section Details */}
            {selectedSectionId && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Section Settings
                </h3>

                {(() => {
                  const section = sections.find((s) => s.id === selectedSectionId);
                  if (!section) return null;

                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Name</label>
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) =>
                            handleSectionUpdate(section.id, { name: e.target.value })
                          }
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                        />
                      </div>

                      <button
                        onClick={() => addTableToSection(section.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Table
                      </button>

                      {section.tables && section.tables.length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground">Tables</label>
                          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                            {section.tables.map((table) => (
                              <div
                                key={table.id}
                                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                                  selectedTableId === table.id
                                    ? "bg-primary/10"
                                    : "bg-muted"
                                }`}
                                onClick={() => setSelectedTableId(table.id)}
                              >
                                <span>
                                  Table {table.number} ({table.seats.length} seats)
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTable(section.id, table.id);
                                  }}
                                  className="p-0.5 hover:bg-destructive/10 rounded text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <VisualSeatingCanvas
              sections={sections}
              onSectionUpdate={handleSectionUpdate}
              selectedSectionId={selectedSectionId || undefined}
              onSectionSelect={setSelectedSectionId}
              selectedTableId={selectedTableId || undefined}
              onTableSelect={(sectionId, tableId) => {
                setSelectedSectionId(sectionId);
                setSelectedTableId(tableId);
              }}
              onTableUpdate={handleTableUpdate}
            />
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplates && (
        <SeatingTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Quick Setup Modal */}
      {showQuickSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Table2 className="w-5 h-5" />
              Quick Table Setup
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Quickly generate a ballroom-style layout with round or rectangular tables.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Number of Tables
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quickTableCount}
                  onChange={(e) => setQuickTableCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Seats per Table
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={quickSeatsPerTable}
                  onChange={(e) => setQuickSeatsPerTable(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Table Shape
                </label>
                <select
                  value={quickTableShape}
                  onChange={(e) => setQuickTableShape(e.target.value as TableShape)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="ROUND">Round</option>
                  <option value="RECTANGULAR">Rectangular</option>
                  <option value="SQUARE">Square</option>
                </select>
              </div>

              <div className="bg-accent rounded-lg p-3">
                <p className="text-sm text-foreground">
                  This will create{" "}
                  <span className="font-bold">{quickTableCount * quickSeatsPerTable} total seats</span>{" "}
                  across {quickTableCount} tables.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowQuickSetup(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyQuickSetup}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Generate Tables
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
