"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, GraduationCap, User } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/date-format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedClassesProps {
  eventId: Id<"events">;
}

function RelatedClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-32 w-full" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RelatedClasses({ eventId }: RelatedClassesProps) {
  const relatedClasses = useQuery(api.public.queries.getRelatedClasses, {
    eventId,
  });

  // Loading state
  if (relatedClasses === undefined) {
    return (
      <section className="mt-8" aria-labelledby="related-classes-heading">
        <h2
          id="related-classes-heading"
          className="text-xl font-semibold mb-4 flex items-center gap-2"
        >
          <GraduationCap className="h-5 w-5 text-primary" />
          Prepare for this event
        </h2>
        <RelatedClassesSkeleton />
      </section>
    );
  }

  // No related classes found
  if (!relatedClasses || relatedClasses.length === 0) {
    return null; // Don't show section if no related classes
  }

  return (
    <section className="mt-8" aria-labelledby="related-classes-heading">
      <h2
        id="related-classes-heading"
        className="text-xl font-semibold mb-4 flex items-center gap-2"
      >
        <GraduationCap className="h-5 w-5 text-primary" />
        Prepare for this event
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Take a class before the event to brush up on your skills
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedClasses.map((classItem) => (
          <Link
            key={classItem._id}
            href={`/classes/${classItem._id}`}
            className="group block"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
              {/* Class Image */}
              <div className="relative h-32 bg-muted overflow-hidden">
                {classItem.imageUrl ? (
                  <Image
                    src={classItem.imageUrl}
                    alt={classItem.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
                    <GraduationCap className="h-12 w-12 text-primary/30" />
                  </div>
                )}

                {/* Level Badge */}
                {classItem.classLevel && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-xs"
                  >
                    {classItem.classLevel}
                  </Badge>
                )}
              </div>

              {/* Class Info */}
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {classItem.name}
                </h3>

                {/* Instructor */}
                {classItem.instructorName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{classItem.instructorName}</span>
                  </div>
                )}

                {/* Date & Time */}
                {classItem.startDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatEventDate(classItem.startDate)} •{" "}
                      {formatEventTime(classItem.startDate)}
                    </span>
                  </div>
                )}

                {/* Location */}
                {classItem.location &&
                  typeof classItem.location === "object" &&
                  classItem.location.city && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {classItem.location.city}
                        {classItem.location.state && `, ${classItem.location.state}`}
                      </span>
                    </div>
                  )}

                {/* Categories */}
                {classItem.categories && classItem.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {classItem.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* View all classes link */}
      <div className="mt-4 text-center">
        <Link
          href="/classes"
          className="text-sm text-primary hover:underline font-medium"
        >
          View all classes →
        </Link>
      </div>
    </section>
  );
}
