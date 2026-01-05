"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Utensils, Clock, MapPin } from "lucide-react";
import Image from "next/image";

interface EventDiningSectionProps {
  eventCity: string;
}

export function EventDiningSection({ eventCity }: EventDiningSectionProps) {
  const restaurants = useQuery(api.restaurants.getByCity, { city: eventCity });

  // Don't show section if no restaurants or still loading
  if (restaurants === undefined) {
    return null; // Loading state - don't show anything
  }

  if (restaurants.length === 0) {
    return null; // No restaurants in this city
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Utensils className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Dine Before the Event
          </h2>
          <p className="text-sm text-muted-foreground">
            Grab a bite near the venue in {eventCity}
          </p>
        </div>
      </div>

      {/* Restaurant Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant._id}
            href={`/restaurants/${restaurant.slug}`}
            className="group bg-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative h-28 overflow-hidden">
              {restaurant.coverImageUrl ? (
                <Image
                  src={restaurant.coverImageUrl}
                  alt={restaurant.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-sky-600 flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-primary-foreground opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Pickup Time Badge */}
              <div className="absolute bottom-2 left-2">
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-white/90 rounded-full text-foreground">
                  <Clock className="h-3 w-3" />
                  ~{restaurant.estimatedPickupTime || 30} min
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                <p className="text-xs text-primary mt-0.5 line-clamp-1">
                  {restaurant.cuisine.slice(0, 2).join(" • ")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 text-center">
        <Link
          href={`/restaurants?city=${encodeURIComponent(eventCity)}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          <MapPin className="h-4 w-4" />
          View all restaurants in {eventCity}
        </Link>
      </div>
    </section>
  );
}
