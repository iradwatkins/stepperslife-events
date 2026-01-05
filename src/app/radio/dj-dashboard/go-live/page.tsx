"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Radio,
  Users,
  PlayCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mic2,
  Settings,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { WebDJEmbed } from "@/components/radio/WebDJEmbed";
import { AudioInputTest } from "@/components/radio/AudioInputTest";
import { toast } from "sonner";

export default function GoLivePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get DJ's station
  const station = useQuery(
    api.radioStreaming.getMyStation,
    user?._id ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Loading state
  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or no station
  if (!user || !station) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need an active radio station to go live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/radio/dj-dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stream settings for external software
  const streamSettings = {
    server: "radio.stepperslife.com",
    port: "8020",
    mount: `/${station.slug}`,
    format: "MP3 / 128kbps",
    username: station.azuracastDjUsername || station.slug,
    // Password would come from a secure source
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/radio/dj-dashboard"
          className="text-sm text-muted-foreground hover:text-primary mb-2 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-green-600" />
          Go Live
        </h1>
        <p className="text-muted-foreground mt-1">
          Start broadcasting to your listeners
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-6 rounded-lg p-4 ${
          station.isLive
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-muted"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Badge
              variant={station.isLive ? "default" : "outline"}
              className={
                station.isLive
                  ? "bg-green-500 text-white animate-pulse"
                  : ""
              }
            >
              {station.isLive ? "● LIVE" : "Offline"}
            </Badge>
            <span className="font-medium">{station.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {station.isLive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{station.currentListeners || 0} listeners</span>
              </div>
            )}
            <Link href={`/radio/stations/${station.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Station
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Broadcasting Options */}
      <Tabs defaultValue="webdj" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="webdj" className="flex items-center gap-2">
            <Mic2 className="w-4 h-4" />
            <span className="hidden sm:inline">Web DJ</span>
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">External Software</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Audio Test</span>
          </TabsTrigger>
        </TabsList>

        {/* Web DJ Tab */}
        <TabsContent value="webdj" className="space-y-6">
          <WebDJEmbed
            stationName={station.name}
            stationSlug={station.slug}
            azuracastStationId={station.azuracastStationId}
            azuracastShortcode={station.azuracastShortcode}
            isLive={station.isLive || false}
            currentListeners={station.currentListeners || 0}
          />
        </TabsContent>

        {/* External Software Tab */}
        <TabsContent value="external" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Stream Settings
              </CardTitle>
              <CardDescription>
                Use these settings to connect from professional DJ software
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                {Object.entries({
                  Server: streamSettings.server,
                  Port: streamSettings.port,
                  "Mount Point": streamSettings.mount,
                  Username: streamSettings.username,
                  Format: streamSettings.format,
                }).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded text-sm">
                        {value}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(value, label)}
                      >
                        {copiedField === label ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">Password Required</p>
                <p>
                  Your streaming password was sent to your email when your station was approved.
                  Contact support if you need it reset.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Compatible Software:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { name: "BUTT", desc: "Free & simple" },
                    { name: "OBS Studio", desc: "Streaming suite" },
                    { name: "Mixxx", desc: "Free DJ software" },
                    { name: "Virtual DJ", desc: "Professional" },
                  ].map((software) => (
                    <div
                      key={software.name}
                      className="bg-muted rounded-lg p-3 text-center"
                    >
                      <p className="font-medium text-sm">{software.name}</p>
                      <p className="text-xs text-muted-foreground">{software.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Need help setting up? Check out our guides:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled>
                    BUTT Setup Guide
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    OBS Setup Guide
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Mixxx Setup Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <AudioInputTest />

          <Card>
            <CardHeader>
              <CardTitle>Pre-Broadcast Checklist</CardTitle>
              <CardDescription>
                Make sure everything is ready before going live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Audio levels are in the green zone",
                  "No background noise or echo",
                  "Using headphones to prevent feedback",
                  "Stable internet connection",
                  "Music/content is ready",
                  "Station info is up to date",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
