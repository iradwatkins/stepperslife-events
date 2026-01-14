import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getJwtSecretEncoded, validateJwtSecret } from "@/lib/auth/jwt-secret";
import { getBaseUrl } from "@/lib/constants/app-config";
import { getPrivateKey, getKeyId } from "@/lib/auth/jwks";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session token using centralized secret
    const validation = validateJwtSecret();
    if (!validation.valid) {
      console.error("[Convex Token] JWT_SECRET not configured:", validation.error);
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const secret = getJwtSecretEncoded();

    try {
      const { payload } = await jwtVerify(sessionToken.value, secret);

      // Create a Convex-compatible JWT token using RS256
      // Convex expects specific fields in the token
      // The token identifier format: domain|applicationID|subject
      const baseUrl = getBaseUrl(request);
      const tokenIdentifier = `${baseUrl}|convex|${payload.userId}`;

      // Get the RSA private key for signing
      let privateKey;
      try {
        privateKey = await getPrivateKey();
      } catch (keyError) {
        console.error("[Convex Token] Failed to get private key:", keyError);
        return NextResponse.json({ error: "Key configuration error" }, { status: 500 });
      }

      const convexToken = await new SignJWT({
        sub: tokenIdentifier,
        iss: baseUrl,
        aud: "convex",
        email: payload.email as string,
        name: payload.name,
        role: payload.role,
      })
        .setProtectedHeader({ alg: "RS256", kid: getKeyId(), typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(privateKey);

      return NextResponse.json({ token: convexToken });
    } catch (error) {
      // Check if this is a JWT verification error or signing error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("JWS") || errorMessage.includes("signature") || errorMessage.includes("expired")) {
        console.error("[Convex Token] Invalid session token:", error);
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      // Otherwise it's a signing error
      console.error("[Convex Token] Token signing error:", error);
      return NextResponse.json({ error: "Token signing failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("[Convex Token] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
