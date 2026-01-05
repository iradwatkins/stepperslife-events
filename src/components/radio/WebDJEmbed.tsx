"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Mic2,
  Radio,
  Users,
  PlayCircle,
  StopCircle,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface WebDJEmbedProps {
  stationName: string;
  stationSlug: string;
  azuracastStationId?: number;
  azuracastShortcode?: string;
  isLive: boolean;
  currentListeners: number;
  onGoLive?: () => void;
  onStopBroadcast?: () => void;
}

export function WebDJEmbed({
  stationName,
  stationSlug,
  azuracastStationId,
  azuracastShortcode,
  isLive,
  currentListeners,
  onGoLive,
  onStopBroadcast,
}: WebDJEmbedProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // AzuraCast Web DJ embed URL
  const webDjUrl = azuracastShortcode
    ? `https://radio.stepperslife.com/public/${azuracastShortcode}/embed/webdj`
    : azuracastStationId
    ? `https://radio.stepperslife.com/public/${azuracastStationId}/embed/webdj`
    : null;

  // Check for microphone permission
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError("Microphone access denied. Please allow microphone access to broadcast.");
    }
  };

  useEffect(() => {
    // Check permission on mount
    if (navigator.mediaDevices) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setHasPermission(true);
          } else if (result.state === "denied") {
            setHasPermission(false);
            setError("Microphone access denied. Please enable in browser settings.");
          }
        })
        .catch(() => {
          // Permission API not supported, we'll check when user tries to broadcast
        });
    }
  }, []);

  const handleStartBroadcast = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await checkMicrophonePermission();
      if (hasPermission === false) {
        setIsConnecting(false);
        return;
      }

      // If we have an iframe, trigger the Web DJ
      if (iframeRef.current && webDjUrl) {
        // The Web DJ will handle the actual connection
        onGoLive?.();
      }
    } catch (err) {
      setError("Failed to start broadcast. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // If no AzuraCast configuration
  if (!webDjUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic2 className="w-5 h-5" />
            Web DJ Broadcasting
          </CardTitle>
          <CardDescription>
            Broadcast directly from your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 bg-muted/50 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="font-medium">Station Setup Required</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Your station is pending AzuraCast configuration.
                This will be set up automatically once the admin completes the setup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="w-5 h-5" />
              Web DJ Broadcasting
            </CardTitle>
            <CardDescription>
              Broadcast directly from your browser - no software needed
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <>
                <Badge className="bg-green-500 text-white animate-pulse">
                  LIVE
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{currentListeners}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Permission Check */}
        {hasPermission === false && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Microphone Access Required</p>
                <p className="text-sm mt-1">
                  To broadcast, you need to allow microphone access in your browser.
                  Click the lock icon in your address bar to enable it.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={checkMicrophonePermission}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Web DJ Embed */}
        <div className="rounded-lg overflow-hidden border bg-black">
          <iframe
            ref={iframeRef}
            src={webDjUrl}
            className="w-full h-[400px]"
            allow="microphone; autoplay"
            title={`${stationName} Web DJ`}
          />
        </div>

        {/* Alternative: Open in New Window */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            For best performance, you can open Web DJ in a separate window
          </p>
          <a
            href={webDjUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Window
            </Button>
          </a>
        </div>

        {/* Stop Broadcast Confirmation */}
        {isLive && onStopBroadcast && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Broadcasting
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stop Broadcasting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your live stream. {currentListeners > 0 && `${currentListeners} listeners are currently tuned in.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onStopBroadcast}>
                  Stop Broadcast
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
