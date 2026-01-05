"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RadioSubNav } from "@/components/layout/RadioSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useRadioPlayerSafe, type RadioStation } from "@/components/radio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Play,
  Pause,
  Radio,
  Users,
  Clock,
  Music,
  Heart,
  Share2,
  ExternalLink,
  Loader2,
  Disc3,
  Calendar,
  Mic2,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SongHistoryItem {
  sh_id: number;
  played_at: number;
  duration: number;
  song: {
    title: string;
    artist: string;
    album?: string;
    art?: string;
  };
}

interface ScheduleItem {
  id: number;
  name: string;
  description?: string;
  start: string;
  end: string;
  is_now: boolean;
}

export function StationDetailClient({ slug }: { slug: string }) {
  const player = useRadioPlayerSafe();
  const [songHistory, setSongHistory] = useState<SongHistoryItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch station from Convex
  const station = useQuery(api.radioStreaming.getStationBySlug, { slug }) as RadioStation | null | undefined;

  const isCurrentStation = player?.currentStation?._id === station?._id;
  const isPlaying = isCurrentStation && player?.isPlaying;
  const isLoading = isCurrentStation && player?.isLoading;

  // Fetch song history and schedule from AzuraCast
  useEffect(() => {
    if (!station?.slug) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/radio/azuracast/station/${station.slug}/history`);
        if (response.ok) {
          const data = await response.json();
          setSongHistory(data.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    const fetchSchedule = async () => {
      try {
        const response = await fetch(`/api/radio/azuracast/station/${station.slug}/schedule`);
        if (response.ok) {
          const data = await response.json();
          setSchedule(data);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      }
    };

    Promise.all([fetchHistory(), fetchSchedule()]).finally(() => {
      setIsLoadingHistory(false);
    });

    // Refresh history every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [station?.slug]);

  // Loading state
  if (station === undefined) {
    return (
      <>
        <PublicHeader />
        <RadioSubNav />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <PublicFooter />
      </>
    );
  }

  // Station not found
  if (station === null) {
    return (
      <>
        <PublicHeader />
        <RadioSubNav />
        <main className="min-h-screen bg-background py-16">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Station Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The radio station you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/radio">
              <Button className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back to Radio
              </Button>
            </Link>
          </div>
        </main>
        <PublicFooter />
      </>
    );
  }

  const handlePlay = () => {
    if (isCurrentStation) {
      player?.togglePlay();
    } else {
      player?.playStation(station);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <PublicHeader />
      <RadioSubNav />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative">
          {/* Banner */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-red-500/20 to-orange-500/10 relative">
            {station.logoUrl && (
              <img
                src={station.logoUrl}
                alt={station.name}
                className="w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Station Info */}
          <div className="container mx-auto px-4 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-background shadow-lg bg-muted overflow-hidden flex-shrink-0">
                {station.logoUrl ? (
                  <img
                    src={station.logoUrl}
                    alt={station.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                    <Radio className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{station.name}</h1>
                  {station.isLive && (
                    <Badge variant="destructive" className="animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">by {station.djName}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {station.genre}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {station.currentListeners} listening
                  </span>
                  {station.totalListenHours && station.totalListenHours > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(station.totalListenHours)} total hours
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={handlePlay}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    {isPlaying ? "Pause" : "Listen Now"}
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Heart className="w-4 h-4" />
                    Follow
                  </Button>
                  <Button variant="ghost" size="icon" className="h-11 w-11">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="history">Recent Plays</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  </TabsList>

                  <TabsContent value="about">
                    <Card>
                      <CardHeader>
                        <CardTitle>About This Station</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {station.description || "No description available."}
                        </p>

                        {/* Social Links */}
                        {station.socialLinks && (
                          <div className="mt-6 pt-6 border-t">
                            <h4 className="font-semibold mb-3">Connect with {station.djName}</h4>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(station.socialLinks).map(([platform, url]) => (
                                url && (
                                  <a
                                    key={platform}
                                    href={url as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Disc3 className={cn("w-5 h-5", isPlaying && "animate-spin")} />
                          Recently Played
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingHistory ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : songHistory.length > 0 ? (
                          <div className="space-y-4">
                            {songHistory.map((item, index) => (
                              <div
                                key={item.sh_id}
                                className={cn(
                                  "flex items-center gap-4 p-3 rounded-lg",
                                  index === 0 && "bg-primary/5 border border-primary/20"
                                )}
                              >
                                {/* Album Art */}
                                <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                                  {item.song.art ? (
                                    <img
                                      src={item.song.art}
                                      alt={item.song.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Music className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {index === 0 && (
                                      <span className="text-xs text-primary mr-2">NOW</span>
                                    )}
                                    {item.song.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {item.song.artist}
                                  </p>
                                </div>

                                {/* Time */}
                                <div className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(item.played_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No song history available yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schedule">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Broadcast Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {schedule.length > 0 ? (
                          <div className="space-y-4">
                            {schedule.map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-start gap-4 p-3 rounded-lg border",
                                  item.is_now && "bg-primary/5 border-primary"
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{item.name}</p>
                                    {item.is_now && (
                                      <Badge variant="default" className="text-xs">
                                        ON NOW
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground text-right">
                                  <p>{item.start}</p>
                                  <p>to {item.end}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No scheduled shows at this time.</p>
                            <p className="text-sm">This station may be running 24/7 AutoDJ.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Now Playing Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Disc3 className={cn("w-4 h-4", isPlaying && "animate-spin")} />
                      Now Playing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {station.nowPlaying?.title ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {station.nowPlaying.artUrl ? (
                            <img
                              src={station.nowPlaying.artUrl}
                              alt={station.nowPlaying.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{station.nowPlaying.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {station.nowPlaying.artist}
                          </p>
                          {station.nowPlaying.album && (
                            <p className="text-xs text-muted-foreground truncate">
                              {station.nowPlaying.album}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {station.isLive ? "Live broadcast in progress" : "AutoDJ is playing"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Station Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Station Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Listeners</span>
                      <span className="font-semibold">{station.currentListeners}</span>
                    </div>
                    {station.peakListeners && station.peakListeners > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Peak Listeners</span>
                        <span className="font-semibold">{station.peakListeners}</span>
                      </div>
                    )}
                    {station.totalUniqueListeners && station.totalUniqueListeners > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Unique Listeners</span>
                        <span className="font-semibold">{station.totalUniqueListeners}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CTA */}
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/20">
                  <CardContent className="pt-6 text-center">
                    <Mic2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Want Your Own Station?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Apply to become a DJ and start streaming on SteppersLife Radio.
                    </p>
                    <Link href="/radio/become-a-dj">
                      <Button className="w-full">Apply Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
