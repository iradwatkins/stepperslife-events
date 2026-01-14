import { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import EventsListClient from "./EventsListClient";

// Force dynamic rendering - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "All Events | SteppersLife Events",
  description:
    "Browse all upcoming stepping events, workshops, and socials. Find your next event on SteppersLife.com",
  openGraph: {
    title: "All Events | SteppersLife Events",
    description: "Browse all upcoming stepping events, workshops, and socials",
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
    console.error("[EventsPage] Query error:", error);
    return fallback;
  }
}

// Get current timestamp (server-side only, runs once per request)
function getServerTimestamp(): number {
  return Date.now();
}

export default async function EventsPage() {
  // Initialize Convex HTTP client for server-side data fetching
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  const convex = new ConvexHttpClient(convexUrl);

  // Calculate filter date ranges based on server's time
  const now = getServerTimestamp();
  const getEndOfDay = (date: Date) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  };
  const getWeekendStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const daysUntilFriday = day <= 5 ? 5 - day : 0;
    d.setDate(d.getDate() + daysUntilFriday);
    d.setHours(17, 0, 0, 0); // Friday 5pm
    return d;
  };
  const getWeekendEnd = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  };

  const nowDate = new Date(now);
  const filterDateRanges = {
    tonightStart: now,
    tonightEnd: getEndOfDay(nowDate).getTime(),
    weekendStart: getWeekendStart(nowDate).getTime(),
    weekendEnd: getWeekendEnd(nowDate).getTime(),
    monthEnd: getEndOfMonth(nowDate).getTime(),
  };

  // Fetch initial data in parallel
  const [initialEvents, initialCategories, initialFilterCounts] = await Promise.all([
    fetchWithTimeout(
      convex.query(api.public.queries.getFilteredEvents, {
        filter: "all",
        startTime: now,
        endTime: undefined,
        category: undefined,
        searchTerm: undefined,
      }),
      10000,
      { events: [], counts: { all: 0, tonight: 0, weekend: 0, month: 0 }, filter: "all" as const }
    ),
    fetchWithTimeout(
      convex.query(api.public.queries.getCategories, {}),
      5000,
      []
    ),
    fetchWithTimeout(
      convex.query(api.public.queries.getEventFilterCounts, {
        tonightStart: filterDateRanges.tonightStart,
        tonightEnd: filterDateRanges.tonightEnd,
        weekendStart: filterDateRanges.weekendStart,
        weekendEnd: filterDateRanges.weekendEnd,
        monthEnd: filterDateRanges.monthEnd,
        category: undefined,
        searchTerm: undefined,
      }),
      5000,
      { all: 0, tonight: 0, weekend: 0, month: 0 }
    ),
  ]);

  return (
    <EventsListClient
      initialEvents={initialEvents}
      initialCategories={initialCategories}
      initialFilterCounts={initialFilterCounts}
    />
  );
}
