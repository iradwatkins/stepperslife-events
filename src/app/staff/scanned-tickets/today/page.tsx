"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TodayScansPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const scanData = useQuery(api.scanning.queries.getMyScannedTickets, { limit: 100 });

  // Loading state
  if (scanData === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter for today's scans
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const scans = scanData.recentScans.filter(
    (scan) => scan.scannedAt && scan.scannedAt >= todayStart && scan.scannedAt < todayEnd
  );

  // All scans from staff are valid (they wouldn't be recorded otherwise)
  const validScans = scans.length;
  const invalidScans = 0; // Failed scans aren't recorded

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/staff/scanned-tickets" className="hover:text-foreground">
            Scanned Tickets
          </Link>
          <span>/</span>
          <span>Today's Scans</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Today's Scans</h1>
        <p className="text-muted-foreground mt-2">
          All tickets scanned today
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold mt-1">{scans.length}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid</p>
                <p className="text-2xl font-bold mt-1 text-success">{validScans}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invalid</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{invalidScans}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scans List */}
      <Card>
        <CardContent className="p-6">
          {scans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scans today</p>
              <p className="text-sm mt-2">Scanned tickets will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scans.map((scan) => (
                <div
                  key={scan.ticketId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">{scan.attendeeName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{scan.eventName}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{scan.ticketCode}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {scan.scannedAt && formatTime(scan.scannedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
