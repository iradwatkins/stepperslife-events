import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { jwtVerify } from "jose";
import { getJwtSecretEncoded } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecretEncoded();

// Verify user is authenticated and is an admin
async function verifyAdminAuth(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const token = request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    // Only allow admin role to delete files
    if (role !== "admin") return null;
    return { userId: payload.userId as string, role };
  } catch {
    return null;
  }
}

/**
 * API endpoint to physically delete flyer image files from the filesystem
 * This is called when a flyer is deleted from the database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json({ error: "No filepath provided" }, { status: 400 });
    }

    // Define allowed directory
    const ALLOWED_DIR = "/root/websites/events-stepperslife/STEPFILES/event-flyers";

    // Extract filename from filepath
    // Handles both formats:
    // Old: /STEPFILES/event-flyers/filename.jpg
    // New: /api/flyers/filename.jpg
    let filename: string;
    if (filepath.includes("/api/flyers/")) {
      filename = filepath.split("/api/flyers/")[1];
    } else if (filepath.includes("/STEPFILES/event-flyers/")) {
      filename = filepath.split("/STEPFILES/event-flyers/")[1];
    } else {
      filename = path.basename(filepath);
    }

    // Security: Validate filename doesn't contain path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      console.error(`🚨 Path traversal attempt detected: ${filename}`);
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Construct full path to the file
    const fullPath = path.join(ALLOWED_DIR, filename);

    // Security: Verify resolved path is within allowed directory
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(ALLOWED_DIR)) {
      console.error(`🚨 Path traversal attempt: ${resolvedPath} is outside ${ALLOWED_DIR}`);
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Delete the physical file
    try {
      await unlink(fullPath);

      // Verify file is actually gone
      const { existsSync } = require("fs");
      if (existsSync(fullPath)) {
        console.error(`⚠️ File still exists after deletion attempt: ${fullPath}`);
        throw new Error("File deletion verification failed - file still exists");
      }


      return NextResponse.json({
        success: true,
        message: "File deleted and verified successfully",
        deletedPath: fullPath,
      });
    } catch (unlinkError) {
      const nodeError = unlinkError as NodeJS.ErrnoException;
      // If file doesn't exist, that's okay - it's already gone
      if (nodeError.code === "ENOENT") {
        return NextResponse.json({
          success: true,
          message: "File already deleted or doesn't exist",
          deletedPath: fullPath,
        });
      }

      // Other errors are actual problems
      console.error(`❌ Failed to delete file: ${fullPath}`, unlinkError);
      throw unlinkError;
    }
  } catch (error) {
    console.error("❌ Error deleting flyer file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
