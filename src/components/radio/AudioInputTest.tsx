"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Volume2,
  Mic,
  MicOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function AudioInputTest() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get available audio input devices
  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        }));

      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting devices:", err);
    }
  }, [selectedDevice]);

  // Request microphone permission and get devices
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      setError(null);
      await getDevices();
    } catch (err) {
      setHasPermission(false);
      setError("Microphone access denied. Please allow access in your browser settings.");
    }
  };

  // Start listening to audio input
  const startListening = async () => {
    try {
      setError(null);

      // Create audio context
      audioContextRef.current = new AudioContext();

      // Get audio stream
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice
          ? { deviceId: { exact: selectedDevice } }
          : true,
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      setHasPermission(true);

      // Create analyser
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setIsListening(true);

      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.round(average));
          animationRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();

      // Refresh device list
      await getDevices();
    } catch (err) {
      setHasPermission(false);
      setError("Failed to access microphone. Please check your browser permissions.");
      setIsListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsListening(false);
    setAudioLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Check initial permission state
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            setHasPermission(true);
            getDevices();
          } else if (result.state === "denied") {
            setHasPermission(false);
          }
        })
        .catch(() => {
          // Permission API not supported
        });
    }
  }, [getDevices]);

  // Get level bar color based on level
  const getLevelColor = (level: number) => {
    if (level < 30) return "bg-green-500";
    if (level < 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Audio Input Test
        </CardTitle>
        <CardDescription>
          Test your microphone before going live
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Permission Request */}
        {hasPermission === null && (
          <div className="text-center py-6">
            <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-2">Microphone Access Required</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to allow microphone access
            </p>
            <Button onClick={requestPermission}>
              <Mic className="w-4 h-4 mr-2" />
              Allow Microphone
            </Button>
          </div>
        )}

        {/* Permission Denied */}
        {hasPermission === false && (
          <div className="text-center py-6">
            <MicOff className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="font-medium mb-2">Microphone Access Denied</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please enable microphone access in your browser settings
            </p>
            <Button variant="outline" onClick={requestPermission}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Audio Test Interface */}
        {hasPermission === true && (
          <>
            {/* Device Selector */}
            <div className="space-y-2">
              <Label htmlFor="audio-device">Microphone</Label>
              <Select
                value={selectedDevice}
                onValueChange={setSelectedDevice}
                disabled={isListening}
              >
                <SelectTrigger id="audio-device">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audio Level Meter */}
            <div className="space-y-2">
              <Label>Audio Level</Label>
              <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-75 ${getLevelColor(audioLevel)}`}
                  style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                  {isListening ? (
                    audioLevel > 10 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Audio detected
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Speak into your microphone...
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">
                      Click &quot;Start Test&quot; to begin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Level Indicator Bars */}
            <div className="flex gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => {
                const threshold = (i + 1) * 6.4; // 128 / 20 = 6.4
                const isActive = isListening && audioLevel >= threshold;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded transition-all duration-75 ${
                      isActive
                        ? i < 12
                          ? "bg-green-500"
                          : i < 16
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-muted"
                    }`}
                  />
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!isListening ? (
                <Button onClick={startListening} className="flex-1">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Test
                </Button>
              ) : (
                <Button onClick={stopListening} variant="outline" className="flex-1">
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Test
                </Button>
              )}
              <Button variant="outline" onClick={getDevices} disabled={isListening}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Tips */}
            <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-medium">Tips for best audio quality:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Keep audio levels in the green zone</li>
                <li>Avoid clipping (red zone)</li>
                <li>Use a headset to prevent echo</li>
                <li>Minimize background noise</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
