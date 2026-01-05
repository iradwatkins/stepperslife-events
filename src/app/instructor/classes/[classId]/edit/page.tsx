"use client";

import { use } from "react";
import ClassForm from "@/components/classes/ClassForm";
import { Id } from "@/convex/_generated/dataModel";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default function EditClassPage({ params }: PageProps) {
  const { classId } = use(params);

  return <ClassForm mode="edit" classId={classId as Id<"events">} />;
}
