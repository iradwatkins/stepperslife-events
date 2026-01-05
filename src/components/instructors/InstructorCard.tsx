"use client";

import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Doc } from "../../../convex/_generated/dataModel";

interface InstructorCardProps {
  instructor: Doc<"instructors">;
  className?: string;
}

export function InstructorCard({ instructor, className }: InstructorCardProps) {
  return (
    <Link href={`/instructors/${instructor.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
          className
        )}
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {instructor.photoUrl ? (
            <Image
              src={instructor.photoUrl}
              alt={instructor.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Users className="w-16 h-16 text-primary/30" />
            </div>
          )}
          {instructor.verified && (
            <div className="absolute top-3 right-3">
              <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {instructor.name}
                </h3>
                {instructor.title && (
                  <p className="text-sm text-muted-foreground">
                    {instructor.title}
                  </p>
                )}
              </div>
            </div>

            {instructor.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{instructor.location}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {instructor.specialties.slice(0, 3).map((specialty) => (
                <Badge
                  key={specialty}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {specialty}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t">
              {instructor.classCount !== undefined && instructor.classCount > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{instructor.classCount} classes</span>
                </div>
              )}
              {instructor.studentCount !== undefined && instructor.studentCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{instructor.studentCount}+ students</span>
                </div>
              )}
              {instructor.experienceYears && (
                <span>{instructor.experienceYears}+ years</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
