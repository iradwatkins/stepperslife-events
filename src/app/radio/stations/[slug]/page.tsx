import { Metadata } from "next";
import { StationDetailClient } from "./StationDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | SteppersLife Radio`,
    description: `Listen to live radio streaming on SteppersLife Radio.`,
    openGraph: {
      title: `SteppersLife Radio Station`,
      description: `Listen to live radio streaming on SteppersLife Radio.`,
      type: "website",
    },
  };
}

export default async function StationDetailPage({ params }: Props) {
  const { slug } = await params;
  return <StationDetailClient slug={slug} />;
}
