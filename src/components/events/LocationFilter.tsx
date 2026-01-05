"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";

export type LocationFilter =
  | { type: "coords"; lat: number; lng: number; radius: number }
  | { type: "city"; city: string };

interface LocationFilterProps {
  onLocationChange: (location: LocationFilter | null) => void;
  currentFilter: LocationFilter | null;
  className?: string;
}

const RADIUS_OPTIONS = [
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 100, label: "100 mi" },
  { value: 250, label: "250 mi" },
];

export function LocationFilter({
  onLocationChange,
  currentFilter,
  className,
}: LocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(50);
  const { lat, lng, loading, error, requestLocation, clearLocation } =
    useGeolocation();

  // When location is obtained, auto-apply with selected radius
  useEffect(() => {
    if (lat && lng && !currentFilter) {
      // Don't auto-apply, wait for user to click Apply
    }
  }, [lat, lng, currentFilter]);

  const handleUseLocation = () => {
    requestLocation();
  };

  const handleApplyLocation = () => {
    if (lat && lng) {
      onLocationChange({ type: "coords", lat, lng, radius: selectedRadius });
      setOpen(false);
    }
  };

  const handleCitySearch = () => {
    if (cityInput.trim()) {
      onLocationChange({ type: "city", city: cityInput.trim() });
      setOpen(false);
      setCityInput("");
    }
  };

  const handleClear = () => {
    onLocationChange(null);
    setCityInput("");
    clearLocation();
    setOpen(false);
  };

  const displayLabel = currentFilter
    ? currentFilter.type === "city"
      ? currentFilter.city
      : `Within ${currentFilter.radius}mi`
    : "Location";

  const hasFilter = !!currentFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            hasFilter && "border-primary text-primary",
            className
          )}
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{displayLabel}</span>
          {hasFilter && (
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
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="font-medium text-sm">Filter by Location</div>

          {/* Use My Location */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleUseLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {loading ? "Locating..." : "Use My Location"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Distance selector (when location available) */}
          {lat && lng && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Location found. Select distance:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {RADIUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      selectedRadius === option.value ? "default" : "outline"
                    }
                    size="sm"
                    className="text-xs"
                    onClick={() => setSelectedRadius(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Button className="w-full mt-2" onClick={handleApplyLocation}>
                Apply Location Filter
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* City search */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter city name..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handleCitySearch}
                disabled={!cityInput.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Clear */}
          {currentFilter && (
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Clear Location Filter
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
