import { Metadata } from "next";
import { RadioPageClient } from "./RadioPageClient";

export const metadata: Metadata = {
  title: "Radio | SteppersLife",
  description:
    "Discover the best stepper music, top 10 songs, and talented DJs. Listen to mixes, find DJs for hire, and explore the sounds of the steppin' community.",
  openGraph: {
    title: "Radio | SteppersLife",
    description:
      "Discover the best stepper music, top 10 songs, and talented DJs.",
    type: "website",
  },
};

export default function RadioPage() {
  return <RadioPageClient />;
}
