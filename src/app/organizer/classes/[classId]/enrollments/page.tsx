import { redirect } from "next/navigation";

// Redirect old organizer/classes/[classId]/enrollments URLs to the new instructor routes
interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function OrganizerClassEnrollmentsRedirect({ params }: PageProps) {
  const { classId } = await params;
  redirect(`/instructor/classes/${classId}/enrollments`);
}
