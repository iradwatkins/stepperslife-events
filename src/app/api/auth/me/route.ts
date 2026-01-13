import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convexClient as convex } from "@/lib/auth/convex-client";
import { getJwtSecretEncoded } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecretEncoded();

/**
 * Get current authenticated user
 *
 * Admin status is determined from the user's role in the database.
 * The admin email list is maintained in convex/lib/roles.ts and
 * admin role is assigned during user creation/login via the
 * isAdminEmail() check in Convex mutations.
 */
export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Get fresh user data from Convex (without password hash)
    const user = await convex.query(api.users.queries.getUserByIdPublic, {
      userId: payload.userId as Id<"users">,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin flag comes from the user's role in the database
    // This is set during user creation/login in Convex based on isAdminEmail()
    const userWithAdminFlag = {
      ...user,
      isAdmin: user.role === "admin",
    };

    return NextResponse.json({ user: userWithAdminFlag }, { status: 200 });
  } catch (error) {
    console.error("[Auth /me] Verification error:", error);
    console.error("[Auth /me] Error name:", error instanceof Error ? error.name : typeof error);
    console.error("[Auth /me] Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      error: "Invalid token",
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 401 });
  }
}
