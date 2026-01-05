"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RadioSubNav } from "@/components/layout/RadioSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { StationCard, useRadioPlayerSafe, type RadioStation } from "@/components/radio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Radio,
  Disc3,
  Trophy,
  Play,
  Pause,
  ExternalLink,
  Star,
  MapPin,
  ChevronRight,
  Music,
  Headphones,
  Loader2,
  ArrowRight,
  Crown,
  Sparkles,
  Users,
  Wifi,
  Mic2,
} from "lucide-react";

// Genre filters
const GENRES = [
  { slug: "steppin", name: "Steppin'" },
  { slug: "r-and-b", name: "R&B" },
  { slug: "house", name: "House" },
  { slug: "soul", name: "Soul" },
  { slug: "jazz", name: "Jazz" },
  { slug: "funk", name: "Funk" },
  { slug: "neo-soul", name: "Neo Soul" },
  { slug: "old-school", name: "Old School" },
];

// Music embed component
function MusicEmbed({ url, type }: { url: string; type: string }) {
  if (type === "soundcloud") {
    return (
      <iframe
        width="100%"
        height="120"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
        className="rounded-lg"
      />
    );
  }

  if (type === "mixcloud") {
    return (
      <iframe
        width="100%"
        height="120"
        src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=${encodeURIComponent(url)}`}
        frameBorder="0"
        className="rounded-lg"
      />
    );
  }

  if (type === "spotify") {
    // Extract track/playlist ID from Spotify URL
    const spotifyMatch = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      const [, type, id] = spotifyMatch;
      return (
        <iframe
          src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
        />
      );
    }
  }

  if (type === "youtube") {
    // Extract video ID from YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return (
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    }
  }

  // Fallback - just show a link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-primary hover:underline"
    >
      <ExternalLink className="w-4 h-4" />
      Listen on external player
    </a>
  );
}

export function RadioPageClient() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const player = useRadioPlayerSafe();

  // Fetch radio streaming data
  const liveStations = useQuery(api.radioStreaming.getLiveStations) as RadioStation[] | undefined;
  const allStations = useQuery(api.radioStreaming.getActiveStations) as RadioStation[] | undefined;

  // Fetch DJ data from Convex
  const featuredDJs = useQuery(api.radio.getFeaturedDJs, { limit: 4 });
  const allDJs = useQuery(api.radio.getAllDJs, { limit: 8 });
  const top10 = useQuery(api.radio.getCurrentTop10, {});

  const isLoading = featuredDJs === undefined || allDJs === undefined;
  const isStationsLoading = allStations === undefined;

  // Calculate total listeners across all stations
  const totalListeners = allStations?.reduce((sum, s) => sum + (s.currentListeners || 0), 0) || 0;

  // Filter DJs by genre
  const filteredDJs = selectedGenre
    ? allDJs?.filter((dj) =>
        dj.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
      )
    : allDJs;

  return (
    <>
      <PublicHeader />
      <RadioSubNav />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-500/10 via-background to-red-500/5 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full mb-6">
                <Headphones className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  The Sound of Steppin'
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                SteppersLife Radio
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover the best DJs, listen to the Top 10 stepper songs, and find the perfect DJ for your next event.
              </p>

              {/* Quick Stats */}
              <div className="flex justify-center gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{liveStations?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Live Now</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{allStations?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Stations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{totalListeners}</div>
                  <div className="text-sm text-muted-foreground">Listeners</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{allDJs?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">DJs</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Radio Stations Section */}
        <section className="py-12 bg-gradient-to-b from-red-500/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Wifi className="w-6 h-6 text-red-500" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Live Radio Stations</h2>
                {liveStations && liveStations.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {liveStations.length} LIVE
                  </Badge>
                )}
              </div>
              <Link
                href="/radio/stations"
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                All Stations
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {isStationsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : liveStations && liveStations.length > 0 ? (
              <>
                {/* Featured Live Stations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {liveStations.slice(0, 3).map((station) => (
                    <StationCard key={station._id} station={station} variant="featured" />
                  ))}
                </div>

                {/* More Live Stations */}
                {liveStations.length > 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {liveStations.slice(3, 7).map((station) => (
                      <StationCard key={station._id} station={station} variant="compact" />
                    ))}
                  </div>
                )}
              </>
            ) : allStations && allStations.length > 0 ? (
              <>
                {/* No live stations, show available stations */}
                <div className="bg-muted/30 rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Radio className="w-5 h-5 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No DJs are streaming live right now. Check out our available stations:
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {allStations.slice(0, 8).map((station) => (
                    <StationCard key={station._id} station={station} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <Mic2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Radio Coming Soon</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We're launching SteppersLife Radio! DJs will be able to stream live 24/7.
                  Want to be one of the first DJs?
                </p>
                <Link href="/radio/become-a-dj">
                  <Button size="lg" className="gap-2">
                    <Mic2 className="w-4 h-4" />
                    Apply to Stream
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured DJ Spotlight */}
        {featuredDJs && featuredDJs.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-2xl font-bold text-foreground">Featured DJ</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Featured DJ */}
                <Link
                  href={`/radio/djs/${featuredDJs[0].slug}`}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="h-48 bg-gradient-to-br from-orange-500/20 to-red-500/20 relative">
                    {featuredDJs[0].bannerUrl ? (
                      <img
                        src={featuredDJs[0].bannerUrl}
                        alt={featuredDJs[0].stageName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Disc3 className="w-20 h-20 text-orange-500/30 animate-spin-slow" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {featuredDJs[0].photoUrl ? (
                          <img
                            src={featuredDJs[0].photoUrl}
                            alt={featuredDJs[0].stageName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Disc3 className="w-8 h-8 text-white" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                          {featuredDJs[0].stageName}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {featuredDJs[0].genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                        {featuredDJs[0].bio && (
                          <p className="text-muted-foreground mt-3 line-clamp-2">
                            {featuredDJs[0].bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Music Links */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      {featuredDJs[0].soundcloudUrl && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Music className="w-3 h-3" /> SoundCloud
                        </span>
                      )}
                      {featuredDJs[0].mixcloudUrl && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Music className="w-3 h-3" /> Mixcloud
                        </span>
                      )}
                      {featuredDJs[0].spotifyUrl && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Music className="w-3 h-3" /> Spotify
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Other Featured DJs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredDJs.slice(1, 5).map((dj) => (
                    <Link
                      key={dj._id}
                      href={`/radio/djs/${dj.slug}`}
                      className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-orange-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {dj.photoUrl ? (
                            <img
                              src={dj.photoUrl}
                              alt={dj.stageName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Disc3 className="w-6 h-6 text-orange-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-orange-500 truncate">
                            {dj.stageName}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {dj.genres.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top 10 Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-2xl font-bold text-foreground">Top 10 Stepper Songs</h2>
              </div>
              <Link
                href="/radio/top-10"
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {top10 && top10.length > 0 ? (
              <div className="space-y-4">
                {top10.slice(0, 5).map((song, index) => (
                  <div
                    key={song._id}
                    className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">{song.rank}</span>
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground">{song.title}</h3>
                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                          </div>
                          {song.coverImageUrl && (
                            <img
                              src={song.coverImageUrl}
                              alt={song.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                        </div>

                        {/* Embed Player */}
                        <div className="mt-3">
                          <MusicEmbed url={song.embedUrl} type={song.embedType} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Top 10 Coming Soon</h3>
                <p className="text-muted-foreground">
                  Check back soon for the weekly top 10 stepper songs!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Browse by Genre */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Genre</h2>

            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedGenre === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:border-primary/30"
                }`}
              >
                All Genres
              </button>
              {GENRES.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => setSelectedGenre(genre.slug)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedGenre === genre.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-primary/30"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            {/* DJ Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredDJs && filteredDJs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredDJs.map((dj) => (
                  <Link
                    key={dj._id}
                    href={`/radio/djs/${dj.slug}`}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-orange-500/30 transition-all group"
                  >
                    {/* DJ Photo */}
                    <div className="h-40 bg-gradient-to-br from-orange-500/20 to-red-500/20 relative">
                      {dj.bannerUrl ? (
                        <img
                          src={dj.bannerUrl}
                          alt={dj.stageName}
                          className="w-full h-full object-cover"
                        />
                      ) : dj.photoUrl ? (
                        <img
                          src={dj.photoUrl}
                          alt={dj.stageName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Disc3 className="w-16 h-16 text-orange-500/30" />
                        </div>
                      )}
                      {dj.verified && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                          Verified
                        </span>
                      )}
                    </div>

                    {/* DJ Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                        {dj.stageName}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dj.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {dj.averageRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {dj.averageRating.toFixed(1)}
                          </div>
                        )}
                        {(dj.soundcloudUrl || dj.mixcloudUrl || dj.spotifyUrl) && (
                          <div className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Music
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Disc3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No DJs Found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedGenre
                    ? `No DJs found for "${selectedGenre}" genre`
                    : "Be the first DJ to join the community!"}
                </p>
                <Link
                  href="/service-provider/apply?category=dj"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Become a DJ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* View All Link */}
            {filteredDJs && filteredDJs.length > 0 && (
              <div className="text-center mt-8">
                <Link
                  href="/radio/djs"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  View all DJs
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section - Become a Streaming DJ */}
        <section className="py-16 bg-gradient-to-br from-orange-500/5 to-red-500/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Stream Your Music */}
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <Mic2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Stream Your Music
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Get your own 24/7 radio station. Broadcast live, schedule pre-recorded shows,
                    and earn revenue from your streams.
                  </p>
                  <Link href="/radio/become-a-dj">
                    <Button size="lg" className="w-full gap-2">
                      <Wifi className="w-4 h-4" />
                      Apply to Stream
                    </Button>
                  </Link>
                </div>

                {/* Get Booked for Events */}
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <Disc3 className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Get Booked for Events
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create your DJ profile, showcase your mixes, and get hired for steppin' events
                    across the country.
                  </p>
                  <Link href="/service-provider/apply?category=dj">
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      <Music className="w-4 h-4" />
                      Create DJ Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
