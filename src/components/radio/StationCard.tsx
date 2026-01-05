"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioPlayerMini, useRadioPlayerSafe, RadioStation } from "./index";
import {
  Radio,
  Users,
  Disc3,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: RadioStation;
  variant?: "default" | "compact" | "featured";
}

export function StationCard({ station, variant = "default" }: StationCardProps) {
  const player = useRadioPlayerSafe();

  const isCurrentStation = player?.currentStation?._id === station._id;
  const isPlaying = isCurrentStation && player?.isPlaying;
  const isLoading = isCurrentStation && player?.isLoading;

  if (variant === "compact") {
    return (
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-3 flex items-center gap-3">
          {/* Logo */}
          <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {station.logoUrl ? (
              <img
                src={station.logoUrl}
                alt={station.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Radio className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            {station.isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{station.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{station.djName}</p>
          </div>

          {/* Play Button */}
          <Button
            variant={isPlaying ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (isCurrentStation) {
                player?.togglePlay();
              } else {
                player?.playStation(station);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (variant === "featured") {
    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        {/* Banner Image */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
          {station.logoUrl ? (
            <img
              src={station.logoUrl}
              alt={station.name}
              className="h-full w-full object-cover opacity-60"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Radio className="h-16 w-16 text-primary/30" />
            </div>
          )}

          {/* Live Badge */}
          {station.isLive && (
            <Badge
              variant="destructive"
              className="absolute top-3 left-3 animate-pulse"
            >
              LIVE NOW
            </Badge>
          )}

          {/* Listener Count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <Users className="h-3 w-3" />
            {station.currentListeners}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg"
              onClick={() => {
                if (isCurrentStation) {
                  player?.togglePlay();
                } else {
                  player?.playStation(station);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/radio/stations/${station.slug}`}
                className="font-semibold text-lg hover:underline block truncate"
              >
                {station.name}
              </Link>
              <p className="text-sm text-muted-foreground truncate">
                by {station.djName}
              </p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {station.genre}
            </Badge>
          </div>

          {/* Now Playing */}
          {station.nowPlaying?.title && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Disc3 className={cn("h-4 w-4", isPlaying && "animate-spin")} />
              <span className="text-muted-foreground truncate">
                {station.nowPlaying.artist
                  ? `${station.nowPlaying.title} - ${station.nowPlaying.artist}`
                  : station.nowPlaying.title}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {station.logoUrl ? (
              <img
                src={station.logoUrl}
                alt={station.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Radio className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {station.isLive && (
              <div className="absolute top-1 left-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/radio/stations/${station.slug}`}
                className="font-semibold hover:underline truncate"
              >
                {station.name}
              </Link>
              {station.isLive && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              by {station.djName}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {station.currentListeners}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {station.genre}
              </Badge>
            </div>
          </div>

          {/* Play Button */}
          <RadioPlayerMini station={station} />
        </div>

        {/* Now Playing */}
        {station.nowPlaying?.title && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
            <Disc3 className={cn("h-4 w-4 flex-shrink-0", isPlaying && "animate-spin")} />
            <span className="text-muted-foreground truncate">
              {station.nowPlaying.artist
                ? `${station.nowPlaying.title} - ${station.nowPlaying.artist}`
                : station.nowPlaying.title}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
