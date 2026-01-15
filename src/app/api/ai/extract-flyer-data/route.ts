import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jwtVerify } from "jose";
import { getJwtSecretEncoded } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecretEncoded();

// Initialize Gemini AI - reads env var at runtime
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// Type definitions for extracted data
interface ExtractedData {
  description: string;
  eventName: string;
  eventDate: string;
  eventEndDate?: string | null;
  eventTime: string;
  eventEndTime?: string | null;
  eventTimezone?: string | null;
  venueName: string;
  address?: string | null;
  city: string;
  state: string;
  zipCode?: string | null;
  hostOrganizer?: string | null;
  contacts?: Array<{
    name: string;
    phoneNumber?: string;
    email?: string;
    role?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      tiktok?: string;
    };
  }>;
  ticketPrices: never[];
  ageRestriction?: string | null;
  specialNotes?: string | null;
  containsSaveTheDateText: boolean;
  eventType: "FREE_EVENT" | "TICKETED_EVENT" | "SAVE_THE_DATE";
  categories: string[];
}

interface ExtractionResult {
  success: boolean;
  extractedData?: ExtractedData;
  provider?: string;
  error?: string;
  message?: string;
  partialData?: Partial<ExtractedData>;
  warning?: string;
}

// Comprehensive extraction prompt
const EXTRACTION_PROMPT = `EXPERT EVENT FLYER EXTRACTION PROMPT - TWO-PHASE EXTRACTION

You are an expert at extracting event information from party flyers, club flyers, and promotional event materials.

Your task: Extract ALL text from this flyer using a TWO-PHASE APPROACH and return it as clean, structured JSON.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL #1: SAVE THE DATE DETECTION
═══════════════════════════════════════════════════════════════════

⚠️ **SAVE THE DATE DETECTION IS MANDATORY:**

If the flyer contains ANY of these phrases, you MUST set eventType to "SAVE_THE_DATE":
- "SAVE THE DATE" (in any case/style)
- "SAVE-THE-DATE"
- "STD" (as abbreviation)
- "Details to follow"
- "More info coming"
- "Hotel link and more info to come"

**CRITICAL RULE:** When "SAVE THE DATE" text appears on the flyer:
- eventType: MUST be "SAVE_THE_DATE" (not "TICKETED_EVENT")
- containsSaveTheDateText: MUST be true
- venueName, eventTime: Can be extracted if present (Save the Date can still have venue info)

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL #2: EVENT NAME EXTRACTION FROM STYLIZED TEXT
═══════════════════════════════════════════════════════════════════

⚠️ **EVENT NAMES ARE OFTEN SPLIT ACROSS MULTIPLE LINES:**

Many flyers display event names in large stylized text split across lines. You MUST:
1. Combine words that form a single event name even if on separate lines
2. Look for the LARGEST, most prominent text - this is usually the event name
3. Include modifiers like "Annual", "1st", "2nd", etc.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL #3: CITY AND STATE EXTRACTION
═══════════════════════════════════════════════════════════════════

⚠️ **PARSE CITY/STATE FROM ALL COMMON FORMATS:**

1. "CITY, STATE" → city: "City", state: "ST"
2. "CITY STATE" (no comma) → city: "City", state: "ST"
3. "CITY, ST ZIP" → city: "City", state: "ST"

**STATE ABBREVIATIONS:** Always convert full state names to 2-letter codes

═══════════════════════════════════════════════════════════════════
🎯 TWO-PHASE EXTRACTION STRATEGY
═══════════════════════════════════════════════════════════════════

**PHASE 1: COMPLETE TEXT EXTRACTION WITH FORMATTING (MOST IMPORTANT)**
First, you MUST extract 100% of ALL visible text from the entire flyer image.
This goes in the "description" field and is the foundation for Phase 2.

Read the ENTIRE flyer carefully and capture:
- Main event title/headline
- All dates and times mentioned anywhere
- Venue name and address details
- ALL performer names, DJ names, special guests
- TICKET PRICING INFORMATION
- Contact information (phone, email, social media)
- Age restrictions, dress codes, parking info
- Sponsors, hosts, organizers
- Fine print, disclaimers, legal text

🚫 **CRITICAL EXCLUSION - DO NOT INCLUDE DESIGNER INFORMATION IN DESCRIPTION:**
- COMPLETELY EXCLUDE any text about graphic design, flyer design, or designer credits

**CRITICAL JSON FORMATTING:**
- In the JSON output, use the escape sequence \\n (backslash-n) for line breaks
- DO NOT use actual/literal newlines in the JSON string - this breaks JSON parsing

**PHASE 2: STRUCTURED FIELD EXTRACTION**
After Phase 1 is complete, use the description text you extracted to fill out the structured fields.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL MANDATORY FIELDS (CANNOT BE NULL)
═══════════════════════════════════════════════════════════════════

1. DESCRIPTION (description) - ALL visible text from the flyer with proper formatting
2. EVENT NAME (eventName) - The main title, theme, or name of the event
3. EVENT DATE (eventDate) - Extract EXACTLY as shown on flyer - DO NOT REFORMAT
4. EVENT TIME (eventTime) - Format as "H:MM PM" or "H:MM AM"
5. VENUE NAME (venueName) - The name of the location/club/venue
6. CITY (city) - Extract the city name
7. STATE (state) - Extract state as 2-letter abbreviation

═══════════════════════════════════════════════════════════════════
📋 ADDITIONAL FIELDS (Extract if present, null if not)
═══════════════════════════════════════════════════════════════════

8. EVENT END DATE (eventEndDate) - Only for multi-day events
9. EVENT END TIME (eventEndTime) - If the flyer shows when the event ENDS
10. FULL ADDRESS (address) - Include street number AND street name
11. ZIP CODE (zipCode) - Extract if visible
12. TIMEZONE (eventTimezone) - ONLY if explicitly mentioned
13. HOST/ORGANIZER (hostOrganizer) - Person or organization hosting
14. TICKET PRICES (ticketPrices) - Leave as empty array [], pricing goes in description
15. AGE RESTRICTION (ageRestriction) - "21+", "18+", "All ages"
16. CONTACT INFORMATION (contacts) - Array with name, phone, email, socialMedia
17. SPECIAL NOTES (specialNotes) - Important notes not in other fields
18. SAVE THE DATE CHECK (containsSaveTheDateText) - Boolean: true or false
19. EVENT TYPE (eventType) - "FREE_EVENT", "TICKETED_EVENT", or "SAVE_THE_DATE"
20. EVENT CATEGORIES (categories) - Array: "Set", "Workshop", "Cruise", "Holiday Event", "Weekend Event"

═══════════════════════════════════════════════════════════════════
📤 JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════

Return this EXACT structure:

{
  "description": "string (REQUIRED - ALL text from flyer)",
  "eventName": "string (REQUIRED)",
  "eventDate": "string (REQUIRED - EXACT text as shown on flyer)",
  "eventEndDate": "string or null",
  "eventTime": "string (REQUIRED - formatted as 'H:MM PM/AM')",
  "eventEndTime": "string or null",
  "eventTimezone": "string or null",
  "venueName": "string (REQUIRED)",
  "address": "string or null",
  "city": "string (REQUIRED)",
  "state": "string (REQUIRED)",
  "zipCode": "string or null",
  "hostOrganizer": "string or null",
  "contacts": [],
  "ticketPrices": [],
  "ageRestriction": "string or null",
  "specialNotes": "string or null",
  "containsSaveTheDateText": boolean,
  "eventType": "FREE_EVENT or TICKETED_EVENT or SAVE_THE_DATE",
  "categories": []
}

CRITICAL RULES:
✅ Return ONLY valid JSON - no markdown, no code blocks, no explanations
✅ Use null for missing fields (not empty strings, not "N/A")
✅ Use \\n for line breaks in description, NOT actual newlines

BEGIN TWO-PHASE EXTRACTION NOW.`;

/**
 * Verify user is authenticated and is an admin or organizer
 */
async function verifyAuth(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const token = request.cookies.get("session_token")?.value || request.cookies.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    // Allow admin and organizer roles to use AI extraction
    if (role !== "admin" && role !== "organizer") return null;
    return { userId: payload.userId as string, role };
  } catch {
    return null;
  }
}

/**
 * Extract image data from filepath via URL fetch
 */
async function getImageData(filepath: string): Promise<{ base64: string; mimeType: string }> {
  // Build the full URL
  const imageUrl = filepath.startsWith("http")
    ? filepath
    : `${process.env.NEXT_PUBLIC_APP_URL || "https://events.stepperslife.com"}${filepath}`;

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  return {
    base64: Buffer.from(imageBuffer).toString("base64"),
    mimeType: contentType.split(";")[0].trim(),
  };
}

/**
 * State name to abbreviation mapping
 */
const STATE_ABBREVIATIONS: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
  "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
  "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
  "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
  "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
  "wisconsin": "WI", "wyoming": "WY"
};

/**
 * Post-process extracted data to fix common model errors
 */
function postProcessExtractedData(data: Partial<ExtractedData>): Partial<ExtractedData> {
  const processed = { ...data };
  const descriptionLower = (processed.description || "").toLowerCase();

  // Fix: Save the Date detection from description text
  const saveTheDatePatterns = [
    "save the date",
    "save-the-date",
    "savethedate",
    "details to follow",
    "more info coming",
    "more info to come",
    "hotel link and more info to come"
  ];

  const hasSaveTheDate = saveTheDatePatterns.some(pattern =>
    descriptionLower.includes(pattern)
  );

  if (hasSaveTheDate) {
    processed.containsSaveTheDateText = true;
    processed.eventType = "SAVE_THE_DATE";
  }

  // Fix: Normalize state to 2-letter abbreviation
  if (processed.state && processed.state.length > 2) {
    const stateLower = processed.state.toLowerCase();
    if (STATE_ABBREVIATIONS[stateLower]) {
      processed.state = STATE_ABBREVIATIONS[stateLower];
    }
  }

  // Fix: Clean up event name - remove extra whitespace
  if (processed.eventName) {
    processed.eventName = processed.eventName
      .replace(/\s+/g, " ")
      .trim();
  }

  return processed;
}

/**
 * Parse and validate the AI response
 */
function parseExtractionResponse(
  responseText: string,
  provider: string
): ExtractionResult {
  let cleanedText = responseText.trim();

  // Remove markdown code blocks if present
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.substring(7);
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.substring(3);
  }
  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
  }
  cleanedText = cleanedText.trim();

  // Parse JSON
  let extractedData = JSON.parse(cleanedText);

  // Apply post-processing to fix common model errors
  extractedData = postProcessExtractedData(extractedData);

  // Check if AI returned an error response
  if (extractedData.error === "EXTRACTION_FAILED") {
    const partialData = extractedData.partialData || {};
    const isSaveTheDate =
      partialData.containsSaveTheDateText === true ||
      partialData.eventType === "SAVE_THE_DATE";

    if (isSaveTheDate && partialData.eventName && partialData.eventDate) {
      return {
        success: true,
        extractedData: partialData,
        provider,
        warning: "Save the Date flyer - missing venue/time details (expected)",
      };
    }

    return {
      success: false,
      error: "INCOMPLETE_FLYER_DATA",
      message: extractedData.message || "The flyer is missing required information.",
      partialData,
    };
  }

  // Validate required fields
  const isSaveTheDate =
    extractedData.containsSaveTheDateText === true ||
    extractedData.eventType === "SAVE_THE_DATE" ||
    (extractedData.description &&
      extractedData.description.toLowerCase().includes("save the date"));

  const requiredFields = isSaveTheDate
    ? ["description", "eventName", "eventDate"]
    : ["description", "eventName", "eventDate", "eventTime", "venueName", "city", "state"];

  const missingFields = requiredFields.filter((field) => !extractedData[field]);

  if (missingFields.length > 0) {
    return {
      success: false,
      error: "INCOMPLETE_FLYER_DATA",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      partialData: extractedData,
    };
  }

  return {
    success: true,
    extractedData,
    provider,
  };
}

/**
 * Extract flyer data using Google Gemini
 */
async function extractWithGemini(
  base64Image: string,
  mimeType: string
): Promise<ExtractionResult> {
  const genAI = getGeminiClient();

  if (!genAI) {
    throw new Error("Gemini API not configured - GEMINI_API_KEY required");
  }

  // Use Gemini 2.0 Flash for fast, accurate vision extraction
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
  ]);

  const response = await result.response;
  const extractedText = response.text();

  if (!extractedText) {
    throw new Error("No response from Gemini");
  }

  return parseExtractionResponse(extractedText, "gemini-2.0-flash");
}

/**
 * Main POST handler
 * Uses Google Gemini for AI-powered flyer extraction
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication - admin/organizer only
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized - Admin or organizer access required" },
        { status: 401 }
      );
    }

    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json({ error: "No filepath provided" }, { status: 400 });
    }

    // Get image data
    let imageData: { base64: string; mimeType: string };
    try {
      imageData = await getImageData(filepath);
    } catch (imageError) {
      console.error("[AI Extraction] Failed to get image:", imageError);
      return NextResponse.json(
        {
          error: "Failed to load flyer image",
          details: imageError instanceof Error ? imageError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Extract using Gemini
    let result: ExtractionResult;
    try {
      result = await extractWithGemini(imageData.base64, imageData.mimeType);
    } catch (error) {
      console.error("[AI Extraction] Gemini failed:", error);

      // Check for specific Gemini API errors
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          return NextResponse.json(
            {
              error: "Gemini API key invalid or expired",
              details: error.message,
            },
            { status: 401 }
          );
        }
        if (error.message.includes("quota") || error.message.includes("rate")) {
          return NextResponse.json(
            {
              error: "Gemini API rate limit exceeded",
              details: error.message,
            },
            { status: 429 }
          );
        }
      }

      throw new Error(
        `AI extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Return the result
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
          partialData: result.partialData,
          provider: result.provider,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      extractedData: result.extractedData,
      provider: result.provider,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (error) {
    console.error("[AI Extraction] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to extract flyer data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to check AI provider status
 */
export async function GET() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiConfigured = !!geminiApiKey;

  // Check Gemini availability by attempting to list models
  let geminiAvailable = false;
  if (geminiConfigured) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      // Simple check - try to get the model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      geminiAvailable = !!model;
    } catch {
      geminiAvailable = false;
    }
  }

  return NextResponse.json({
    providers: {
      gemini: {
        available: geminiAvailable,
        configured: geminiConfigured,
        model: "gemini-2.0-flash",
        description: "Google Gemini AI - Fast and accurate vision model",
      },
    },
    strategy: "Google Gemini (gemini-2.0-flash)",
    recommendation: geminiAvailable ? "gemini" : "none",
  });
}
