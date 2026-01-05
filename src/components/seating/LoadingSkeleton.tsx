/**
 * Loading Skeleton Component
 * Professional loading states for seating charts
 */

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ className = "", width, height, count = 1 }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`seating-skeleton ${className}`} style={style} />
      ))}
    </>
  );
}

export function SeatingChartSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm border border p-6">
        <Skeleton height={32} width="40%" />
        <div className="mt-2">
          <Skeleton height={16} width="60%" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-sm border border p-6">
            <Skeleton height={40} width={40} className="mb-2 rounded-full" />
            <Skeleton height={20} width="60%" />
            <Skeleton height={32} width="40%" className="mt-2" />
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <Skeleton height={600} className="rounded-lg" />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg shadow-md p-6">
            <Skeleton height={24} width="30%" className="mb-4" />
            <div className="space-y-2">
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableLibrarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={24} width="60%" className="mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-card rounded-lg border-2 border p-4">
          <Skeleton height={40} width={40} className="mx-auto mb-2 rounded-full" />
          <Skeleton height={16} width="80%" className="mx-auto mb-1" />
          <Skeleton height={14} width="60%" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  return <div className={`seating-spinner ${sizeClasses[size]} ${className}`} />;
}

export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-card flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
