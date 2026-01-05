import { redirect } from "next/navigation";

// Redirect old organizer/classes/[classId]/edit URLs to the new instructor routes
interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function OrganizerClassEditRedirect({ params }: PageProps) {
  const { classId } = await params;
  redirect(`/instructor/classes/${classId}/edit`);
}
