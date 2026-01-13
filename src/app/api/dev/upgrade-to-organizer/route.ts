import { NextRequest, NextResponse } from "next/server";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { api } from "@/convex/_generated/api";

/**
 * DEV ONLY: Upgrade a user to organizer role
 * This bypasses the normal auth flow for local testing
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find user by email and update their role
    const result = await convex.mutation(api.users.mutations.devUpgradeToOrganizer, {
      email: email.toLowerCase(),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[DevUpgrade] Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
