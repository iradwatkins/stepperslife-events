"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Save, Eye, Info } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import SeatingTemplates, { seatingTemplates } from "@/components/seating/SeatingTemplates";
import TemplateBuilder from "@/components/template-builder/TemplateBuilder";

type SeatingStyle = "ROW_BASED" | "TABLE_BASED" | "MIXED";
type Category =
  | "theater"
  | "stadium"
  | "concert"
  | "conference"
  | "outdoor"
  | "wedding"
  | "gala"
  | "banquet"
  | "custom";

interface TemplateFormData {
  name: string;
  description: string;
  category: Category;
  seatingStyle: SeatingStyle;
  estimatedCapacity: number;
  isPublic: boolean;
}

function CreateTemplatePageContent() {
  const router = useRouter();

  // Seating/Template feature is currently disabled
  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <Info className="w-16 h-16 text-muted-foreground mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Template Creation Coming Soon</h1>
        <p className="text-muted-foreground mb-6">
          The template creation feature is currently being enhanced and will be available soon.
        </p>
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-card flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <CreateTemplatePageContent />
    </Suspense>
  );
}
