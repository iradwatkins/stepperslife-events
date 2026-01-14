import { type NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { jwtVerify } from "jose";
import { getJwtSecretEncoded } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecretEncoded();

// Verify user is authenticated and get their info
async function verifyAuth(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const token = request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

/**
 * Connect/Save PayPal Account for Organizer
 * POST /api/paypal/connect-account
 *
 * For personal accounts: Simply stores the PayPal email
 * For business accounts: Could use PayPal Partner Referrals (future enhancement)
 *
 * This is a simple flow that accepts PayPal email/merchant ID directly
 * and stores it for split payment purposes.
 *
 * SECURITY: The mutation now uses authentication to identify the user,
 * so no userId parameter is needed - only authenticated users can update their own account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalEmail, paypalMerchantId } = body;

    // Require either email or merchant ID
    if (!paypalEmail && !paypalMerchantId) {
      return NextResponse.json(
        { error: "PayPal email or merchant ID is required" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (paypalEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paypalEmail)) {
        return NextResponse.json(
          { error: "Invalid PayPal email format" },
          { status: 400 }
        );
      }
    }

    // Store the PayPal account in Convex
    // Use email as the merchant ID if no explicit merchant ID provided
    const merchantIdToStore = paypalMerchantId || paypalEmail;

    // The mutation now uses authentication - it will identify the user from the auth context
    await fetchMutation(api.payments.mutations.savePayPalAccount, {
      paypalMerchantId: merchantIdToStore,
      paypalEmail: paypalEmail || undefined,
    });

    console.log("[PayPal Connect] Account saved:", {
      merchantId: merchantIdToStore,
      hasEmail: !!paypalEmail,
    });

    return NextResponse.json({
      success: true,
      message: "PayPal account connected successfully",
      merchantId: merchantIdToStore,
    });
  } catch (error) {
    console.error("[PayPal Connect] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect PayPal account",
      },
      { status: 500 }
    );
  }
}

/**
 * Get PayPal Account Status
 * GET /api/paypal/connect-account?userId=xxx
 *
 * SECURITY: User can only access their own PayPal data (or admins can access any)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    if (!requestedUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Security: Users can only access their own PayPal data (admins can access any)
    if (auth.userId !== requestedUserId && auth.role !== "admin") {
      console.error(`[PayPal Connect] Unauthorized access attempt: ${auth.userId} tried to access ${requestedUserId}`);
      return NextResponse.json(
        { error: "Unauthorized - Cannot access other user's data" },
        { status: 403 }
      );
    }

    // Get user's PayPal status from Convex
    const user = await fetchQuery(api.users.queries.getUserById, {
      userId: requestedUserId as Id<"users">,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: !!user.paypalMerchantId,
      merchantId: user.paypalMerchantId || null,
      setupComplete: user.paypalAccountSetupComplete || false,
    });
  } catch (error) {
    console.error("[PayPal Connect] Get status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get PayPal account status",
      },
      { status: 500 }
    );
  }
}

/**
 * Disconnect PayPal Account
 * DELETE /api/paypal/connect-account
 *
 * SECURITY: The mutation now uses authentication to identify the user,
 * so no userId parameter is needed - only authenticated users can disconnect their own account.
 */
export async function DELETE(request: NextRequest) {
  try {
    // The mutation now uses authentication - it will identify the user from the auth context
    await fetchMutation(api.payments.mutations.disconnectPayPalAccount, {});

    console.log("[PayPal Connect] Account disconnected");

    return NextResponse.json({
      success: true,
      message: "PayPal account disconnected successfully",
    });
  } catch (error) {
    console.error("[PayPal Connect] Disconnect error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to disconnect PayPal account",
      },
      { status: 500 }
    );
  }
}
