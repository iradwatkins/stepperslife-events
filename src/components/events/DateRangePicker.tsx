"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleClear = () => {
    onDateRangeChange(undefined);
    setOpen(false);
  };

  const handleApply = () => {
    setOpen(false);
  };

  const displayText = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Custom Dates";

  const hasSelection = !!dateRange?.from;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            hasSelection && "border-primary text-primary",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{displayText}</span>
          <span className="sm:hidden">
            {hasSelection ? format(dateRange.from!, "M/d") : "Dates"}
          </span>
          {hasSelection && (
            <X
              className="h-3 w-3 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          className="hidden md:block"
        />
        {/* Mobile: Single month view */}
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={1}
          disabled={{ before: new Date() }}
          className="block md:hidden"
        />
        <div className="flex justify-between gap-2 p-3 border-t">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!dateRange?.from}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
