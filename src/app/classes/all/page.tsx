import { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import ClassesListClient from "../ClassesListClient";

// Force dynamic rendering - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "All Classes | SteppersLife",
  description:
    "Browse all stepping classes, workshops, and lessons. View the complete class catalog on SteppersLife.com",
  openGraph: {
    title: "All Classes | SteppersLife",
    description: "Browse all stepping classes, workshops, and lessons",
    type: "website",
  },
};

// Server-side data fetching with timeout
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  fallback: T
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.error("[ClassesAllPage] Query error:", error);
    return fallback;
  }
}

export default async function ClassesAllPage() {
  // Initialize Convex HTTP client for server-side data fetching
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const convex = new ConvexHttpClient(convexUrl);

  // Fetch initial data in parallel - include past classes for "All Classes" view
  const [initialClasses, initialInstructors] = await Promise.all([
    fetchWithTimeout(
      convex.query(api.public.queries.getPublishedClasses, {
        searchTerm: undefined,
        categories: undefined,
        levels: undefined,
        includePast: true, // Show all classes including past ones
        daysOfWeek: undefined,
        instructorSlug: undefined,
      }),
      10000,
      []
    ),
    fetchWithTimeout(
      convex.query(api.public.queries.getClassInstructors, {}),
      5000,
      []
    ),
  ]);

  return (
    <ClassesListClient
      initialClasses={initialClasses}
      initialInstructors={initialInstructors}
      showPastByDefault={true}
    />
  );
}
