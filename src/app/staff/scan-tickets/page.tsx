"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import {
  QrCode,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Camera,
  Clock,
  Play,
  Square,
  Calendar,
  MapPin,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Utility function to find "current" event (happening now or starting soon)
function findCurrentEvent(
  events: Array<{ _id: string; startDate?: number }>
): (typeof events)[0] | null {
  const now = Date.now();
  const HOURS_BEFORE = 2 * 60 * 60 * 1000; // 2 hours before event
  const HOURS_AFTER = 4 * 60 * 60 * 1000; // 4 hours after event start

  const windowStart = now - HOURS_AFTER;
  const windowEnd = now + HOURS_BEFORE;

  const currentEvents = events.filter((event) => {
    if (!event.startDate) return false;
    return event.startDate >= windowStart && event.startDate <= windowEnd;
  });

  if (currentEvents.length === 0) return null;

  // Prioritize ongoing events (already started)
  const ongoingEvents = currentEvents.filter((e) => e.startDate && e.startDate <= now);

  if (ongoingEvents.length > 0) {
    // Return most recently started ongoing event
    return ongoingEvents.sort((a, b) => (b.startDate || 0) - (a.startDate || 0))[0];
  }

  // Return upcoming event closest to now
  return currentEvents.sort((a, b) => (a.startDate || 0) - (b.startDate || 0))[0];
}

export default function StaffScanTicketsPage() {
  const router = useRouter();
  const events = useQuery(api.scanning.queries.getMyScannableEvents);

  // Scanner state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [autoSelectedEventId, setAutoSelectedEventId] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannerError, setScannerError] = useState<string>("");
  const [lastScannedCode, setLastScannedCode] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const stats = useQuery(
    api.scanning.queries.getEventScanStats,
    selectedEventId ? { eventId: selectedEventId as any } : "skip"
  );
  const recentScans = useQuery(
    api.scanning.queries.getRecentScans,
    selectedEventId ? { eventId: selectedEventId as any, limit: 10 } : "skip"
  );
  const scanTicket = useMutation(api.scanning.mutations.scanTicket);

  const processTicket = async (ticketCode: string) => {
    if (!selectedEventId) return;
    if (ticketCode === lastScannedCode) return;

    setLastScannedCode(ticketCode);
    setIsProcessing(true);

    try {
      const result = await scanTicket({
        ticketCode: ticketCode.trim(),
        eventId: selectedEventId as any,
      });

      setLastScanResult(result);

      setTimeout(() => {
        setLastScanResult(null);
        setLastScannedCode("");
      }, 3000);
    } catch (error) {
      console.error("Scan error:", error);
      setLastScanResult({
        success: false,
        error: "SCAN_ERROR",
        message: "Failed to process ticket. Please try again.",
      });
      setTimeout(() => {
        setLastScanResult(null);
        setLastScannedCode("");
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanner = async () => {
    if (!videoRef.current || scannerRef.current) return;

    setIsStarting(true);
    setScannerError("");

    try {
      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error("No camera detected on this device");
      }

      if (videoRef.current) {
        videoRef.current.setAttribute("autoplay", "");
        videoRef.current.setAttribute("muted", "");
        videoRef.current.setAttribute("playsinline", "");
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          let ticketCode = result.data;
          if (result.data.includes("/ticket/")) {
            const parts = result.data.split("/ticket/");
            ticketCode = parts[1];
          }
          processTicket(ticketCode);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
          maxScansPerSecond: 5,
        }
      );

      await scanner.start();
      scannerRef.current = scanner;
      setIsScanning(true);
      setIsStarting(false);
    } catch (error: any) {
      let errorMessage = "Failed to start camera.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use.";
      } else {
        errorMessage = error?.message || errorMessage;
      }
      setScannerError(errorMessage);
      setIsScanning(false);
      setIsStarting(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualScan = async () => {
    if (!manualTicketCode.trim()) return;
    await processTicket(manualTicketCode);
    setManualTicketCode("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Auto-select current event on mount
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      const currentEvent = findCurrentEvent(events);
      if (currentEvent) {
        setSelectedEventId(currentEvent._id);
        setAutoSelectedEventId(currentEvent._id);
      }
    }
  }, [events, selectedEventId]);

  if (events === undefined) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  // Event selection view
  if (!selectedEventId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Select an event to start scanning tickets
          </p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Events Available</h2>
              <p className="text-muted-foreground">
                You don't have permission to scan tickets for any events.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <Card
                key={event._id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedEventId(event._id)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {event.imageUrl ? (
                      <div className="w-32 h-32 flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex-shrink-0 bg-primary/10 flex items-center justify-center rounded-l-lg">
                        <Calendar className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold mb-2">{event.name}</h3>
                      {event.startDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="w-4 h-4" />
                          {format(event.startDate, "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                      {event.location && typeof event.location === "object" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {event.location.venueName || event.location.city}
                        </div>
                      )}
                      <div className="mt-2 flex items-center text-primary font-medium">
                        Start Scanning <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Scanner view
  const selectedEvent = events.find((e) => e._id === selectedEventId);

  return (
    <div className="p-6 space-y-6">
      {/* Header with back button and change event option */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopScanner();
              setSelectedEventId(null);
              setAutoSelectedEventId(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{selectedEvent?.name}</h1>
            <p className="text-sm text-muted-foreground">Scanning tickets</p>
          </div>
        </div>

        {/* Show "Change Event" link when auto-selected and multiple events available */}
        {autoSelectedEventId && events && events.length > 1 && (
          <Button
            variant="link"
            size="sm"
            className="text-primary"
            onClick={() => {
              stopScanner();
              setSelectedEventId(null);
              setAutoSelectedEventId(null);
            }}
          >
            Change Event
          </Button>
        )}
      </div>

      {/* Auto-selection indicator */}
      {autoSelectedEventId && selectedEventId === autoSelectedEventId && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Auto-selected based on event timing
          </span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.scanned}</div>
              <div className="text-xs text-muted-foreground">Scanned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.remaining}</div>
              <div className="text-xs text-muted-foreground">Ready</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {(stats.pending || 0) + (stats.pendingActivation || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Video Preview */}
          <div className="relative bg-muted rounded-xl mb-4" style={{ minHeight: "300px" }}>
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "cover",
                borderRadius: "0.75rem",
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {!isScanning ? (
              <Button
                className="w-full"
                size="lg"
                onClick={startScanner}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Scanner
                  </>
                )}
              </Button>
            ) : (
              <>
                <div className="bg-success/10 border border-success rounded-lg p-3 text-center">
                  <p className="text-success font-semibold">✓ Scanner Active</p>
                </div>
                <Button
                  className="w-full"
                  variant="destructive"
                  size="lg"
                  onClick={stopScanner}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Scanner
                </Button>
              </>
            )}

            {scannerError && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                <p className="text-destructive text-sm text-center">{scannerError}</p>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Manual Entry</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualTicketCode}
                onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                placeholder="TKT-XXXXXXXX"
                className="flex-1 px-4 py-2 text-center font-mono font-bold bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                disabled={isProcessing}
              />
              <Button
                onClick={handleManualScan}
                disabled={!manualTicketCode.trim() || isProcessing}
              >
                {isProcessing ? "..." : "Check In"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result Modal */}
      {lastScanResult && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            lastScanResult.success ? "bg-success" : "bg-destructive"
          }`}
        >
          <div className="text-center px-6 max-w-md">
            {lastScanResult.success ? (
              <CheckCircle className="w-24 h-24 text-white mx-auto mb-4" />
            ) : (
              <XCircle className="w-24 h-24 text-white mx-auto mb-4" />
            )}
            <h3 className="text-3xl font-bold text-white mb-2">
              {lastScanResult.success ? "✓ Valid!" : "✗ Invalid"}
            </h3>
            <p className="text-white text-lg mb-4">{lastScanResult.message}</p>
            {lastScanResult.ticket && (
              <div className="bg-white/20 rounded-xl p-4 text-white">
                <p className="text-xl font-bold">{lastScanResult.ticket.attendeeName}</p>
                <p>{lastScanResult.ticket.tierName}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {recentScans && recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{scan.attendeeName}</div>
                    <div className="text-sm text-muted-foreground">{scan.tierName}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {scan.scannedAt && format(scan.scannedAt, "h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
