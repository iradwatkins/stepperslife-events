/**
 * Unified Loading States
 *
 * Re-exports loading components with additional convenience wrappers
 * for consistent loading states across the application.
 */

export { LoadingSpinner, LoadingCard, LoadingTable } from "./loading-spinner";
import { LoadingSpinner } from "./loading-spinner";

/**
 * Page-level loading state
 * Use for full page loading (e.g., initial page load, auth checks)
 */
export function PageLoading({ text }: { text?: string }) {
  return <LoadingSpinner fullPage size="lg" text={text || "Loading..."} />;
}

/**
 * Section loading state
 * Use for loading content sections within a page
 */
export function SectionLoading({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`py-12 ${className || ""}`}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

/**
 * Inline loading state
 * Use for small loading indicators (e.g., buttons, form fields)
 */
export function InlineLoading({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" className={className} />;
}

/**
 * Dynamic import loading fallback
 * Use for next/dynamic loading states
 *
 * @example
 * const SeatSelection = dynamic(() => import("./SeatSelection"), {
 *   loading: () => <DynamicLoading />,
 *   ssr: false,
 * });
 */
export function DynamicLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text={text || "Loading component..."} />
    </div>
  );
}

/**
 * Button loading state
 * Use inside buttons to indicate loading action
 *
 * @example
 * <Button disabled={isLoading}>
 *   {isLoading ? <ButtonLoading /> : "Submit"}
 * </Button>
 */
export function ButtonLoading() {
  return <LoadingSpinner size="sm" className="mr-2" />;
}

/**
 * List skeleton for loading states
 * Provides consistent loading placeholder for list items
 */
export function LoadingList({
  items = 3,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse space-y-4 ${className || ""}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Grid skeleton for loading states
 * Provides consistent loading placeholder for card grids
 */
export function LoadingGrid({
  items = 6,
  cols = 3,
  className,
}: {
  items?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse grid gap-4 ${className || ""}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="aspect-video bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
