"use client";

import { Hotel, ExternalLink, Copy, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, isBefore, addDays } from "date-fns";

interface HotelBlockProps {
  hotelBlock: {
    hotelName: string;
    bookingUrl: string;
    groupCode?: string;
    rate?: string;
    cutoffDate?: number;
    notes?: string;
  };
}

export function HotelBlock({ hotelBlock }: HotelBlockProps) {
  const {
    hotelName,
    bookingUrl,
    groupCode,
    rate,
    cutoffDate,
    notes,
  } = hotelBlock;

  // Check if cutoff date is approaching or passed
  const cutoffDateObj = cutoffDate ? new Date(cutoffDate) : null;
  const isCutoffPast = cutoffDateObj ? isPast(cutoffDateObj) : false;
  const isCutoffSoon = cutoffDateObj
    ? isBefore(new Date(), addDays(cutoffDateObj, 7)) && !isCutoffPast
    : false;

  const handleCopyCode = () => {
    if (groupCode) {
      navigator.clipboard.writeText(groupCode);
      toast.success("Group code copied to clipboard!");
    }
  };

  const handleBookNow = () => {
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  };

  // Don't show if cutoff has passed
  if (isCutoffPast) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hotel className="h-5 w-5" />
            <span className="text-sm">
              The hotel group rate for this event has expired.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hotel className="h-5 w-5 text-primary" />
          Hotel Block
          {isCutoffSoon && (
            <Badge variant="destructive" className="ml-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Book Soon
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hotel Name */}
        <div>
          <h4 className="font-semibold text-foreground">{hotelName}</h4>
          {notes && (
            <p className="text-sm text-muted-foreground mt-1">{notes}</p>
          )}
        </div>

        {/* Rate and Group Code */}
        <div className="grid grid-cols-2 gap-4">
          {rate && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Group Rate
              </p>
              <p className="font-semibold text-lg text-primary">{rate}</p>
            </div>
          )}
          {groupCode && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Group Code
              </p>
              <div className="flex items-center gap-2">
                <code className="font-mono font-semibold text-lg bg-muted px-2 py-1 rounded">
                  {groupCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyCode}
                  aria-label="Copy group code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Cutoff Date Warning */}
        {cutoffDateObj && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isCutoffSoon ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>
              Book by{" "}
              <strong>{format(cutoffDateObj, "MMMM d, yyyy")}</strong>
              {isCutoffSoon && (
                <span className="ml-1">
                  ({formatDistanceToNow(cutoffDateObj, { addSuffix: true })})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Book Now Button */}
        <Button
          onClick={handleBookNow}
          className="w-full"
          size="lg"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      </CardContent>
    </Card>
  );
}
