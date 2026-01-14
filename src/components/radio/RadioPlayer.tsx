"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRadioPlayerSafe, RadioStation } from "./RadioPlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Users,
  Disc3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NowPlayingData {
  title?: string;
  artist?: string;
  album?: string;
  artUrl?: string;
}

export function RadioPlayer() {
  const player = useRadioPlayerSafe();
  const [isExpanded, setIsExpanded] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);

  // Fetch active stations from Convex
  const stations = useQuery(api.radioStreaming.getActiveStations) as RadioStation[] | undefined;

  // Poll for now-playing info when a station is selected
  useEffect(() => {
    if (!player?.currentStation?.slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional cleanup when station changes
      setNowPlaying(null);
      return;
    }

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(`/api/radio/azuracast/nowplaying`);
        if (response.ok) {
          const data = await response.json();
          // Find our station in the AzuraCast data
          const stationData = Array.isArray(data)
            ? data.find((s: { station?: { short_name?: string } }) =>
                s.station?.short_name === player.currentStation?.slug
              )
            : null;

          if (stationData?.now_playing?.song) {
            setNowPlaying({
              title: stationData.now_playing.song.title,
              artist: stationData.now_playing.song.artist,
              album: stationData.now_playing.song.album,
              artUrl: stationData.now_playing.song.art,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch now playing:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [player?.currentStation?.slug]);

  // Don't render if no player context
  if (!player) return null;

  const { currentStation, isPlaying, volume, isMuted, isLoading, error } = player;

  // Don't render if no station is selected
  if (!currentStation) return null;

  const displayNowPlaying = nowPlaying || currentStation.nowPlaying;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg transition-all duration-300",
        isExpanded ? "h-48" : "h-20"
      )}
    >
      {/* Main Player Bar */}
      <div className="h-20 px-4 flex items-center gap-4">
        {/* Station Logo / Album Art */}
        <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {displayNowPlaying?.artUrl || currentStation.logoUrl ? (
            <img
              src={displayNowPlaying?.artUrl || currentStation.logoUrl}
              alt={currentStation.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Radio className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {currentStation.isLive && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
              LIVE
            </div>
          )}
        </div>

        {/* Track / Station Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">
              {displayNowPlaying?.title || currentStation.name}
            </h4>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {displayNowPlaying?.artist
              ? `${displayNowPlaying.artist} • ${currentStation.djName}`
              : currentStation.djName}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {currentStation.currentListeners}
            </span>
            <span>•</span>
            <span>{currentStation.genre}</span>
          </div>
        </div>

        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => player.togglePlay()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>

        {/* Volume Control - Desktop only */}
        <div className="hidden md:flex items-center gap-2 w-32">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => player.toggleMute()}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={(value) => player.setVolume(value[0] / 100)}
            className="w-20"
          />
        </div>

        {/* Station Selector - Desktop only */}
        <div className="hidden lg:block w-48">
          <Select
            value={currentStation._id}
            onValueChange={(stationId) => {
              const station = stations?.find((s) => s._id === stationId);
              if (station) player.playStation(station);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              {stations?.map((station) => (
                <SelectItem key={station._id} value={station._id}>
                  <div className="flex items-center gap-2">
                    {station.isLive && (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <span>{station.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expand / Close buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => player.stop()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Panel - Mobile */}
      {isExpanded && (
        <div className="px-4 py-4 border-t bg-muted/30 md:hidden">
          {/* Volume Control */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => player.toggleMute()}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => player.setVolume(value[0] / 100)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(isMuted ? 0 : volume * 100)}%
            </span>
          </div>

          {/* Station Selector */}
          <Select
            value={currentStation._id}
            onValueChange={(stationId) => {
              const station = stations?.find((s) => s._id === stationId);
              if (station) player.playStation(station);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              {stations?.map((station) => (
                <SelectItem key={station._id} value={station._id}>
                  <div className="flex items-center gap-2">
                    {station.isLive && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <Disc3 className="h-3 w-3 text-muted-foreground" />
                    <span>{station.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({station.genre})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Error display */}
          {error && (
            <div className="mt-3 text-xs text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini player for embedding in other pages
export function RadioPlayerMini({ station }: { station: RadioStation }) {
  const player = useRadioPlayerSafe();

  if (!player) return null;

  const isCurrentStation = player.currentStation?._id === station._id;
  const isPlaying = isCurrentStation && player.isPlaying;
  const isLoading = isCurrentStation && player.isLoading;

  return (
    <Button
      variant={isPlaying ? "default" : "outline"}
      size="sm"
      className="gap-2"
      onClick={() => {
        if (isCurrentStation) {
          player.togglePlay();
        } else {
          player.playStation(station);
        }
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {isPlaying ? "Pause" : "Listen"}
    </Button>
  );
}
