"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface CapacityProgressBarProps {
  capacity: number;
  allocated: number;
  sold?: number;
  showBreakdown?: boolean;
  breakdown?: Array<{
    name: string;
    quantity: number;
    color: string;
  }>;
}

export function CapacityProgressBar({
  capacity,
  allocated,
  sold = 0,
  showBreakdown = false,
  breakdown = [],
}: CapacityProgressBarProps) {
  const percentage = capacity > 0 ? (allocated / capacity) * 100 : 0;
  const soldPercentage = capacity > 0 ? (sold / capacity) * 100 : 0;
  const remaining = capacity - allocated;
  const isOver = allocated > capacity;
  const isAtCapacity = allocated === capacity;
  const isNearCapacity = percentage >= 90 && !isAtCapacity && !isOver;

  // Determine status
  let status: "success" | "warning" | "error" = "success";
  let statusIcon = CheckCircle;
  let statusMessage = "Capacity looks good";
  let statusColor = "text-success";
  let barColor = "bg-success";

  if (isOver) {
    status = "error";
    statusIcon = AlertCircle;
    statusMessage = `Over capacity by ${allocated - capacity} tickets`;
    statusColor = "text-destructive";
    barColor = "bg-destructive";
  } else if (isAtCapacity) {
    status = "success";
    statusIcon = CheckCircle;
    statusMessage = "Capacity fully allocated";
    statusColor = "text-success";
    barColor = "bg-success";
  } else if (isNearCapacity) {
    status = "warning";
    statusIcon = AlertTriangle;
    statusMessage = `Only ${remaining} tickets remaining`;
    statusColor = "text-warning";
    barColor = "bg-warning";
  }

  const StatusIcon = statusIcon;

  return (
    <div className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <span className={`text-sm font-medium ${statusColor}`}>{statusMessage}</span>
        </div>
        <div className="text-sm font-semibold text-foreground">
          {allocated.toLocaleString()}/{capacity.toLocaleString()} tickets
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${barColor} relative`}
          >
            {/* Sold tickets overlay (darker shade) */}
            {sold > 0 && (
              <div
                className="absolute inset-0 bg-black/20"
                style={{ width: `${(soldPercentage / percentage) * 100}%` }}
              />
            )}
          </motion.div>

          {/* Over-capacity indicator */}
          {isOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-destructive/10 border-2 border-destructive rounded-full"
            />
          )}
        </div>

        {/* Capacity marker line */}
        {!isOver && percentage > 0 && (
          <div
            className="absolute top-0 h-4 w-0.5 bg-muted-foreground"
            style={{ right: 0 }}
          />
        )}
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {sold > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-success rounded-sm opacity-70" />
              <span>{sold.toLocaleString()} sold</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 ${barColor} rounded-sm`} />
            <span>{allocated.toLocaleString()} allocated</span>
          </div>
          {!isOver && remaining > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm" />
              <span>{remaining.toLocaleString()} remaining</span>
            </div>
          )}
        </div>
        <span className="font-medium">
          {percentage > 100 ? "100+" : Math.round(percentage)}% used
        </span>
      </div>

      {/* Breakdown by tier (optional) */}
      {showBreakdown && breakdown.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="text-xs font-medium text-foreground mb-2">
            Ticket Breakdown
          </div>
          <div className="space-y-1.5">
            {breakdown.map((tier, index) => {
              const tierPercentage = capacity > 0 ? (tier.quantity / capacity) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-foreground">{tier.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {tier.quantity.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground w-10 text-right">
                      {Math.round(tierPercentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning/Error messages */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive rounded-lg p-3"
        >
          <p className="text-sm text-destructive">
            <strong>Error:</strong> Total ticket allocation ({allocated.toLocaleString()}) exceeds
            event capacity ({capacity.toLocaleString()}). Please reduce ticket quantities by{" "}
            {(allocated - capacity).toLocaleString()} tickets.
          </p>
        </motion.div>
      )}
    </div>
  );
}
