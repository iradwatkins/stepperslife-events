'use client';

import { motion } from 'framer-motion';
import { Calendar, Moon, Sun, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventFilter } from '@/lib/date-utils';

interface QuickFiltersProps {
  activeFilter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  counts?: {
    tonight: number;
    weekend: number;
    month: number;
    all: number;
  };
  className?: string;
}

const filters: { id: EventFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'tonight', label: 'Tonight', icon: Moon },
  { id: 'weekend', label: 'This Weekend', icon: Sun },
  { id: 'month', label: 'This Month', icon: CalendarDays },
  { id: 'all', label: 'All Events', icon: Calendar },
];

export function QuickFilters({
  activeFilter,
  onFilterChange,
  counts,
  className,
}: QuickFiltersProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Time period filter"
      className={cn("flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = counts?.[filter.id];
        const Icon = filter.icon;

        return (
          <motion.button
            key={filter.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onFilterChange(filter.id)}
            aria-label={`${filter.label}${count !== undefined ? `, ${count} events` : ''}`}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              "transition-colors duration-200 whitespace-nowrap min-h-[44px]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{filter.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/10 text-foreground"
                )}
              >
                {count}
              </span>
            )}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-primary rounded-full -z-10"
                layoutId="activeFilter"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
