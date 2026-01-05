import { Metadata } from "next";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import ClassDetailClient from "./ClassDetailClient";
import { mockCourses } from "@/lib/mock-data/classes";

interface PageProps {
  params: Promise<{ classId: string }>;
}

// Get class from mock data by slug
function getMockClassBySlug(slug: string) {
  const course = mockCourses.find((c) => c.slug === slug);
  if (!course) return null;

  // Transform mock course to match expected class detail format
  return {
    _id: course.id,
    name: course.title,
    description: course.shortDescription,
    imageUrl: course.thumbnailUrl,
    organizerName: course.instructorName,
    categories: [course.level],
    price: course.price,
    totalLessons: course.totalLessons,
    enrollmentCount: course.enrollmentCount,
    averageRating: course.averageRating,
    instructorPhoto: course.instructorPhoto,
    isMockData: true,
  };
}

// Fetch class data directly from Convex HTTP API for metadata
async function getClassData(classId: string) {
  // First check if it's a mock class slug
  const mockClass = getMockClassBySlug(classId);
  if (mockClass) {
    return mockClass;
  }

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
    }

    const response = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "public/queries:getPublicClassDetails",
        args: { classId },
        format: "json",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching class data:", error);
    return null;
  }
}

function formatClassDate(timestamp: number, timezone?: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone || "America/New_York",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { classId } = await params;

  if (!classId) {
    return {
      title: "Class | SteppersLife",
      description: "Discover stepping classes at SteppersLife.com",
    };
  }

  const classDetails = await getClassData(classId);

  if (!classDetails) {
    return {
      title: "Class Not Found | SteppersLife",
      description: "This class doesn't exist or is no longer available.",
    };
  }

  // Format class date for description
  const classDateStr = classDetails.startDate
    ? formatClassDate(classDetails.startDate, classDetails.timezone)
    : "";

  const description = `${classDetails.name}${classDateStr ? " - " + classDateStr : ""}. Find stepping classes on SteppersLife.com`;

  // Use OG image if available
  const imageUrl = classDetails.imageUrl || "https://stepperslife.com/og-default.png";

  // Get the class URL
  const classUrl = `https://stepperslife.com/classes/${classId}`;

  return {
    title: `${classDetails.name} | SteppersLife Classes`,
    description: description,

    openGraph: {
      type: "website",
      url: classUrl,
      title: classDetails.name,
      description: description,
      siteName: "SteppersLife",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: classDetails.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: classDetails.name,
      description: description,
      images: [imageUrl],
    },

    keywords: [
      "stepping classes",
      "dance classes",
      "steppers",
      classDetails.name,
      ...(classDetails.categories || []),
      ...(classDetails.location ? [classDetails.location.city, classDetails.location.state] : []),
    ],
  };
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { classId } = await params;

  // Check if class exists - if not, return 404
  const classDetails = await getClassData(classId);
  if (!classDetails) {
    notFound();
  }

  // If it's mock data, pass it directly to the client
  if (classDetails.isMockData) {
    return <ClassDetailClient classId={classId} mockData={classDetails} />;
  }

  const typedClassId = classId as Id<"events">;

  return <ClassDetailClient classId={typedClassId} />;
}
