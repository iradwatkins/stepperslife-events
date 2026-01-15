"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { seatingTemplates, type SeatingTemplate } from "@/components/seating/SeatingTemplates";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Grid as GridIcon,
  List,
  ArrowLeft,
  Users,
  Sparkles,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

type ViewMode = "grid" | "list";
type CategoryFilter =
  | "all"
  | "theater"
  | "stadium"
  | "concert"
  | "conference"
  | "outdoor"
  | "wedding"
  | "gala"
  | "banquet"
  | "custom";

interface ExtendedTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: SeatingTemplate["category"];
  sections: unknown[];
  estimatedCapacity: number;
  isCustom: boolean;
  isFloorPlan: boolean;
}

interface UserTemplate {
  _id: Id<"roomTemplates">;
  name: string;
  description: string;
  category: string;
  sections: unknown[];
  estimatedCapacity: number;
}

interface FloorPlanTemplate {
  _id: string;
  name: string;
  description: string;
  category?: string;
  sections: unknown[];
  totalCapacity?: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    deletedCount: number;
    failedCount: number;
    failedTemplates: Array<{ templateId: string; reason: string }>;
  } | null>(null);

  // Get user's custom templates from database
  const userTemplates = useQuery(api.templates.queries.getUserTemplates);
  const templateStats = useQuery(api.templates.queries.getTemplateStats);

  // Get seating/floor plan templates from API
  // Uses the same roomTemplates table - floor plan templates are distinguished by their detailed sections data
  // The seating.templates API provides floor plan-specific CRUD operations
  const floorPlanTemplatesRaw = useQuery(api.templates.queries.getUserTemplates);
  const floorPlanTemplates: FloorPlanTemplate[] | undefined = floorPlanTemplatesRaw?.map((t) => ({
    _id: String(t._id),
    name: t.name,
    description: t.description,
    category: t.category,
    sections: t.sections,
    totalCapacity: t.estimatedCapacity,
  }));

  // Mutations
  const deleteTemplate = useMutation(api.templates.mutations.deleteRoomTemplate);
  const deleteFloorPlanMutation = useMutation(api.templates.mutations.deleteRoomTemplate);

  const bulkDeleteFloorPlanMutation = async (args: { templateIds: Id<"roomTemplates">[] }) => {
    // Bulk delete by calling single delete multiple times
    const results = { deletedCount: 0, failedCount: 0, failedTemplates: [] as Array<{ templateId: string; reason: string }> };
    for (const templateId of args.templateIds) {
      try {
        await deleteFloorPlanMutation({ templateId });
        results.deletedCount++;
      } catch (error) {
        results.failedCount++;
        results.failedTemplates.push({ templateId, reason: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    return results;
  };

  const deleteFloorPlanTemplate = async (args: { templateId: string }) => {
    await deleteFloorPlanMutation({ templateId: args.templateId as Id<"roomTemplates"> });
  };
  const bulkDeleteFloorPlanTemplates = async (args: { templateIds: string[] }) => {
    return await bulkDeleteFloorPlanMutation({
      templateIds: args.templateIds as Id<"roomTemplates">[],
    });
  };

  // Helper functions for selection
  const toggleTemplateSelection = (templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  const selectAllTemplates = () => {
    const customTemplates = allTemplates.filter((t): t is ExtendedTemplate => t.isCustom);
    setSelectedTemplates(new Set(customTemplates.map((t) => t.id)));
  };

  const selectFloorPlanTemplates = () => {
    const floorPlans = allTemplates.filter((t): t is ExtendedTemplate => t.isFloorPlan && t.isCustom);
    setSelectedTemplates(new Set(floorPlans.map((t) => t.id)));
  };

  const selectRoomTemplates = () => {
    const roomTemplates = allTemplates.filter((t): t is ExtendedTemplate => !t.isFloorPlan && t.isCustom);
    setSelectedTemplates(new Set(roomTemplates.map((t) => t.id)));
  };

  // Handle delete template
  const handleDeleteTemplate = async (
    templateId: string,
    templateName: string,
    isFloorPlan: boolean = false
  ) => {
    try {
      if (isFloorPlan) {
        await deleteFloorPlanTemplate({ templateId });
      } else {
        await deleteTemplate({ templateId: templateId as Id<"roomTemplates"> });
      }
      setOpenDropdownId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete template";
      toast.error(message);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTemplates.size === 0) return;

    setIsDeleting(true);
    try {
      // Separate floor plan templates from room templates
      const selectedFloorPlans: string[] = [];
      const selectedRoomTemplates: string[] = [];

      selectedTemplates.forEach((templateId) => {
        const template = allTemplates.find((t) => t.id === templateId);
        if (template && (template as ExtendedTemplate).isFloorPlan) {
          selectedFloorPlans.push(templateId);
        } else if (template && (template as ExtendedTemplate).isCustom) {
          selectedRoomTemplates.push(templateId);
        }
      });

      let totalDeleted = 0;
      let totalFailed = 0;
      const allFailedTemplates: Array<{ templateId: string; reason: string }> = [];

      // Delete floor plan templates
      if (selectedFloorPlans.length > 0) {
        const result = await bulkDeleteFloorPlanTemplates({
          templateIds: selectedFloorPlans,
        });
        totalDeleted += result.deletedCount;
        totalFailed += result.failedCount;
        allFailedTemplates.push(...result.failedTemplates);
      }

      // Delete room templates one by one (no bulk endpoint)
      for (const templateId of selectedRoomTemplates) {
        try {
          await deleteTemplate({ templateId: templateId as Id<"roomTemplates"> });
          totalDeleted++;
        } catch (error) {
          totalFailed++;
          allFailedTemplates.push({
            templateId,
            reason: error instanceof Error ? error.message : "Failed to delete",
          });
        }
      }

      setDeleteResult({
        deletedCount: totalDeleted,
        failedCount: totalFailed,
        failedTemplates: allFailedTemplates,
      });
      setSelectedTemplates(new Set());
      setShowDeleteConfirm(false);

      // Show result message for a few seconds
      setTimeout(() => {
        setDeleteResult(null);
      }, 5000);
    } catch (error) {
      console.error("Error deleting templates:", error);
      toast.error(
        `Error deleting templates: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Combine pre-built templates with user templates and floor plan templates
  const allTemplates: ExtendedTemplate[] = [
    ...seatingTemplates.map((t) => ({ ...t, isCustom: false, isFloorPlan: false })),
    ...(userTemplates || []).map((t: UserTemplate): ExtendedTemplate => ({
      id: t._id,
      name: t.name,
      description: t.description,
      icon: <Sparkles className="w-8 h-8" />,
      category: t.category as SeatingTemplate["category"],
      sections: t.sections,
      estimatedCapacity: t.estimatedCapacity,
      isCustom: true,
      isFloorPlan: false,
    })),
    ...(floorPlanTemplates || []).map((t: FloorPlanTemplate): ExtendedTemplate => ({
      id: t._id,
      name: t.name,
      description: t.description,
      icon: <GridIcon className="w-8 h-8" />,
      category: (t.category?.toLowerCase() as SeatingTemplate["category"]) || "custom",
      sections: t.sections,
      estimatedCapacity: t.totalCapacity || 0,
      isCustom: true,
      isFloorPlan: true,
    })),
  ];

  // Filter templates
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    {
      id: "all",
      name: "All Templates",
      color: "bg-muted text-foreground",
      icon: <GridIcon className="w-4 h-4" />,
    },
    { id: "theater", name: "Theater", color: "bg-accent text-primary" },
    { id: "stadium", name: "Stadium", color: "bg-accent text-primary" },
    { id: "concert", name: "Concert", color: "bg-destructive/10 text-destructive" },
    { id: "conference", name: "Conference", color: "bg-destructive/10 text-destructive" },
    { id: "outdoor", name: "Outdoor", color: "bg-success/10 text-success" },
    { id: "wedding", name: "Wedding", color: "bg-destructive/10 text-destructive" },
    { id: "gala", name: "Gala", color: "bg-accent text-primary" },
    { id: "banquet", name: "Banquet", color: "bg-warning/10 text-warning" },
    { id: "custom", name: "Custom", color: "bg-muted text-foreground" },
  ];

  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Seating & Floor Plan Templates</h1>
              <p className="text-muted-foreground mt-2">
                Browse and create reusable seating layouts and floor plans for your events
              </p>
            </div>

            <Link
              href="/organizer/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </Link>
          </div>
        </div>

        {/* Stats */}
        {templateStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Templates</span>
                <GridIcon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{allTemplates.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pre-built</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{seatingTemplates.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Custom</span>
                <Users className="w-5 h-5 text-success" />
              </div>
              <p className="text-3xl font-bold text-foreground">{userTemplates?.length || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Categories</span>
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {Object.keys(templateStats?.byCategory || {}).length}
              </p>
            </motion.div>
          </div>
        )}

        {/* Bulk Delete Controls */}
        {allTemplates.some((t) => t.isCustom) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Manage Templates</h2>
              {selectedTemplates.size > 0 && (
                <motion.button
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedTemplates.size})
                </motion.button>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">Quick Select:</span>
              <button
                type="button"
                onClick={selectAllTemplates}
                className="px-3 py-1.5 text-sm bg-accent text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                All Custom ({allTemplates.filter((t) => t.isCustom).length})
              </button>
              <button
                type="button"
                onClick={selectFloorPlanTemplates}
                className="px-3 py-1.5 text-sm bg-accent text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                Floor Plans ({allTemplates.filter((t) => t.isFloorPlan && t.isCustom).length})
              </button>
              <button
                type="button"
                onClick={selectRoomTemplates}
                className="px-3 py-1.5 text-sm bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors"
              >
                Room Templates (
                {allTemplates.filter((t) => !t.isFloorPlan && t.isCustom).length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplates(new Set())}
                className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
              >
                Clear Selection
              </button>
              {selectedTemplates.size > 0 && (
                <span className="ml-auto text-sm font-medium text-foreground">
                  {selectedTemplates.size} selected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Delete Result Notification */}
        {deleteResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg ${
              (deleteResult?.failedCount ?? 0) > 0
                ? "bg-warning/10 border border-warning"
                : "bg-success/10 border border-success"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {(deleteResult?.deletedCount ?? 0) > 0 && (
                    <span className="text-success">
                      Successfully deleted {deleteResult?.deletedCount ?? 0} template
                      {(deleteResult?.deletedCount ?? 0) !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                {(deleteResult?.failedCount ?? 0) > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-warning mb-1">
                      Failed to delete {deleteResult?.failedCount ?? 0} template
                      {(deleteResult?.failedCount ?? 0) !== 1 ? "s" : ""}:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {deleteResult?.failedTemplates.map((failed, i) => (
                        <li key={i}>• {failed.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDeleteResult(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            {/* Search */}
            <div className="flex-1 relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GridIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id as CategoryFilter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  categoryFilter === category.id
                    ? "ring-2 ring-primary " + category.color
                    : category.color + " hover:opacity-80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <GridIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by creating your first template"}
            </p>
            <Link
              href="/organizer/templates/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </Link>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden group relative"
              >
                {viewMode === "grid" ? (
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => {
                      // Store selected template data (without icon) in sessionStorage
                      const templateData = {
                        id: template.id,
                        name: template.name,
                        description: template.description,
                        category: template.category,
                        sections: template.sections,
                        estimatedCapacity: template.estimatedCapacity,
                        isCustom: template.isCustom,
                      };
                      try {
                        sessionStorage.setItem("selectedTemplate", JSON.stringify(templateData));
                        router.push("/organizer/templates/create?autoSelect=true");
                      } catch (error) {
                        console.error("Failed to store template:", error);
                        toast.error("Failed to select template. Please try again.");
                      }
                    }}
                  >
                    {/* Selection Checkbox for custom templates */}
                    {template.isCustom && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.has(String(template.id))}
                          onChange={() => toggleTemplateSelection(String(template.id))}
                          className="w-5 h-5 text-primary bg-white border-2 border-border rounded focus:ring-2 focus:ring-ring cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {template.isCustom && (
                          <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                        {template.isFloorPlan && (
                          <span className="px-3 py-1 bg-accent text-primary text-xs font-medium rounded-full">
                            Floor Plan
                          </span>
                        )}
                        {/* Action menu for custom templates */}
                        {template.isCustom && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === template.id ? null : String(template.id)
                                )
                              }
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {openDropdownId === String(template.id) && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    router.push(`/organizer/templates/${template.id}/edit`);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Template
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteTemplate(
                                      String(template.id),
                                      template.name,
                                      template.isFloorPlan
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Template
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        {template.estimatedCapacity} seats
                      </span>
                      <span className="px-2 py-1 bg-muted text-foreground rounded text-xs capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex items-center gap-6">
                    <div className="text-primary">{template.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                        {template.isCustom && (
                          <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                        {template.isFloorPlan && (
                          <span className="px-3 py-1 bg-accent text-primary text-xs font-medium rounded-full">
                            Floor Plan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <Users className="w-4 h-4 inline mr-1" />
                          {template.estimatedCapacity} seats
                        </span>
                        <span className="px-2 py-1 bg-muted text-foreground rounded text-xs capitalize">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Delete {selectedTemplates.size} Template
                    {selectedTemplates.size !== 1 ? "s" : ""}?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    This will permanently delete the selected template
                    {selectedTemplates.size !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-destructive text-sm font-semibold mt-2">
                    This action cannot be undone!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedTemplates.size} Template
                      {selectedTemplates.size !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
