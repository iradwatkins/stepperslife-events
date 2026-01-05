"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useListenSession } from "@/hooks/useListenSession";
import { useAuth } from "@/hooks/useAuth";
import { Id } from "@/convex/_generated/dataModel";

// Types for radio player state
export interface RadioStation {
  _id: string;
  name: string;
  slug: string;
  djName: string;
  genre: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  streamUrl: string;
  isLive: boolean;
  currentListeners: number;
  peakListeners?: number;
  totalListenHours?: number;
  totalUniqueListeners?: number;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  nowPlaying?: {
    title?: string;
    artist?: string;
    album?: string;
    artUrl?: string;
    startedAt?: number;
    duration?: number;
  };
}

interface RadioPlayerState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RadioPlayerContextType extends RadioPlayerState {
  playStation: (station: RadioStation) => void;
  togglePlay: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Listen session tracking
  sessionId: string | null;
  isTrackingSession: boolean;
}

const RadioPlayerContext = createContext<RadioPlayerContextType | null>(null);

export function useRadioPlayer() {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error("useRadioPlayer must be used within a RadioPlayerProvider");
  }
  return context;
}

// Safe version that doesn't throw
export function useRadioPlayerSafe() {
  return useContext(RadioPlayerContext);
}

interface RadioPlayerProviderProps {
  children: React.ReactNode;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const [state, setState] = useState<RadioPlayerState>({
    currentStation: null,
    isPlaying: false,
    volume: 0.8,
    isMuted: false,
    isLoading: false,
    error: null,
  });

  // Track listen sessions for analytics
  const { sessionId, isTracking: isTrackingSession } = useListenSession({
    stationId: state.currentStation?._id as Id<"radioStations"> | null,
    isPlaying: state.isPlaying,
    userId: user?._id as Id<"users"> | undefined,
  });

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;

      // Event listeners
      audioRef.current.addEventListener("playing", () => {
        setState((prev) => ({ ...prev, isPlaying: true, isLoading: false, error: null }));
      });

      audioRef.current.addEventListener("pause", () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });

      audioRef.current.addEventListener("waiting", () => {
        setState((prev) => ({ ...prev, isLoading: true }));
      });

      audioRef.current.addEventListener("canplay", () => {
        setState((prev) => ({ ...prev, isLoading: false }));
      });

      audioRef.current.addEventListener("error", () => {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: "Failed to load stream. Please try again.",
        }));
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  }, [state.volume, state.isMuted]);

  const playStation = useCallback((station: RadioStation) => {
    if (!audioRef.current) return;

    // If same station and playing, do nothing
    if (state.currentStation?._id === station._id && state.isPlaying) {
      return;
    }

    setState((prev) => ({
      ...prev,
      currentStation: station,
      isLoading: true,
      error: null,
    }));

    // Set new source and play
    audioRef.current.src = station.streamUrl;
    audioRef.current.play().catch((err) => {
      console.error("Playback error:", err);
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: "Unable to play stream. Check your connection.",
      }));
    });
  }, [state.currentStation, state.isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !state.currentStation) return;

    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Playback error:", err);
        setState((prev) => ({
          ...prev,
          error: "Unable to resume playback.",
        }));
      });
    }
  }, [state.isPlaying, state.currentStation]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setState((prev) => ({
      ...prev,
      currentStation: null,
      isPlaying: false,
      isLoading: false,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume, isMuted: false }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const value: RadioPlayerContextType = {
    ...state,
    playStation,
    togglePlay,
    stop,
    setVolume,
    toggleMute,
    audioRef,
    sessionId,
    isTrackingSession,
  };

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}
    </RadioPlayerContext.Provider>
  );
}
