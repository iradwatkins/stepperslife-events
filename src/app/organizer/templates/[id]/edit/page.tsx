"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import TemplateBuilder from "@/components/template-builder/TemplateBuilder";
import { sectionsToCanvasItems } from "@/components/template-builder/converters";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as Id<"roomTemplates">;

  // Fetch the template
  const template = useQuery(api.templates.queries.getRoomTemplate, {
    templateId,
  });

  // Update mutation
  const updateTemplate = useMutation(api.templates.mutations.updateRoomTemplate);

  // Convert sections to canvas items once template is loaded
  const [initialItems, setInitialItems] = useState<any[]>([]);
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    if (template && !isConverted) {
      try {
        const canvasItems = sectionsToCanvasItems(template.sections || []);
        setInitialItems(canvasItems);
        setIsConverted(true);
      } catch (error) {
        console.error("Failed to convert template sections:", error);
        toast.error("Failed to load template layout. Starting with empty canvas.");
        setIsConverted(true);
      }
    }
  }, [template, isConverted]);

  // Handle save
  const handleSave = async (sections: any[], totalCapacity: number) => {
    if (!template) return;

    try {
      // Determine seating style based on sections
      let seatingStyle: "ROW_BASED" | "TABLE_BASED" | "MIXED" = "MIXED";
      const hasTables = sections.some((s) => s.tables && s.tables.length > 0);
      const hasRows = sections.some((s) => s.rows && s.rows.length > 0);

      if (hasTables && !hasRows) {
        seatingStyle = "TABLE_BASED";
      } else if (hasRows && !hasTables) {
        seatingStyle = "ROW_BASED";
      }

      // Update the template
      await updateTemplate({
        templateId,
        sections,
        estimatedCapacity: totalCapacity,
        seatingStyle,
      });

      router.push("/organizer/templates");
    } catch (error: any) {
      console.error("Failed to update template:", error);
      toast.error(error.message || "Failed to update template. Please try again.");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (confirm("Are you sure? Any unsaved changes will be lost.")) {
      router.push("/organizer/templates");
    }
  };

  // Loading state
  if (template === undefined) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading template...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (template === null) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The template you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <Link
            href="/organizer/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  // Wait for conversion to complete
  if (!isConverted) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Preparing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <div className="bg-white border-b-2 border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/organizer/templates"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Template: {template.name}</h1>
            <p className="text-muted-foreground mt-1">{template.description}</p>
          </div>
        </div>
      </div>

      {/* Template Builder */}
      <div className="h-[calc(100vh-140px)]">
        <TemplateBuilder initialItems={initialItems} onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
}
