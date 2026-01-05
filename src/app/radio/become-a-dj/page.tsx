import { Metadata } from "next";
import { BecomeADJClient } from "./BecomeADJClient";

export const metadata: Metadata = {
  title: "Become a DJ | SteppersLife Radio",
  description:
    "Apply to get your own 24/7 radio station on SteppersLife. Stream live, schedule pre-recorded shows, and earn revenue from your broadcasts.",
  openGraph: {
    title: "Become a DJ | SteppersLife Radio",
    description:
      "Get your own radio station and stream to the steppin' community.",
    type: "website",
  },
};

export default function BecomeADJPage() {
  return <BecomeADJClient />;
}
