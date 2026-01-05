"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RadioSubNav } from "@/components/layout/RadioSubNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Loader2, Trophy, ExternalLink, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    const spotifyMatch = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      const [, trackType, id] = spotifyMatch;
      return (
        <iframe
          src={`https://open.spotify.com/embed/${trackType}/${id}?utm_source=generator&theme=0`}
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

export default function Top10Page() {
  const top10 = useQuery(api.radio.getCurrentTop10, {});
  const isLoading = top10 === undefined;

  return (
    <>
      <PublicHeader />
      <RadioSubNav />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-yellow-500/10 via-background to-orange-500/5 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link
              href="/radio"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Radio
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Top 10 Stepper Songs
                </h1>
                <p className="text-muted-foreground mt-1">
                  This week's hottest tracks for the stepper community
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Top 10 List */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : top10 && top10.length > 0 ? (
              <div className="max-w-3xl mx-auto space-y-6">
                {top10.map((song, index) => (
                  <div
                    key={song._id}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-6">
                      {/* Rank Badge */}
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          song.rank === 1
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : song.rank === 2
                              ? "bg-gradient-to-br from-gray-300 to-gray-500"
                              : song.rank === 3
                                ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                : "bg-gradient-to-br from-orange-500/80 to-red-500/80"
                        }`}
                      >
                        <span className="text-2xl font-bold text-white">{song.rank}</span>
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-foreground">{song.title}</h2>
                            <p className="text-muted-foreground">{song.artist}</p>
                          </div>
                          {song.coverImageUrl && (
                            <img
                              src={song.coverImageUrl}
                              alt={song.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                        </div>

                        {/* Embed Player */}
                        <div className="mt-4">
                          <MusicEmbed url={song.embedUrl} type={song.embedType} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 max-w-md mx-auto">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Top 10 Coming Soon
                </h3>
                <p className="text-muted-foreground mb-6">
                  We're curating the best stepper songs for you. Check back soon for the weekly
                  countdown!
                </p>
                <Link
                  href="/radio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                >
                  <Music className="w-4 h-4" />
                  Explore Radio
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
