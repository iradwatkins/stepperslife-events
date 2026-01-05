"use client";

import { Grid3x3, List, LayoutGrid } from "lucide-react";

interface ViewToggleProps {
  currentView: "grid" | "list" | "masonry";
  onViewChange: (view: "grid" | "list" | "masonry") => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views = [
    { id: "masonry" as const, icon: LayoutGrid, label: "Masonry" },
    { id: "grid" as const, icon: Grid3x3, label: "Grid" },
    { id: "list" as const, icon: List, label: "List" },
  ];

  return (
    <div className="flex items-center gap-1 bg-card rounded-lg border border p-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;

        return (
          <button
            type="button"
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
            aria-label={view.label}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
