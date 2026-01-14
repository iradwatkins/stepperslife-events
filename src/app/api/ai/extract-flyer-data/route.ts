import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretEncoded } from "@/lib/auth/jwt-secret";

const JWT_SECRET = getJwtSecretEncoded();

// Open WebUI Configuration (self-hosted, uses Ollama backend)
// Model: qwen2.5vl:7b - Best open source OCR (~75% accuracy, GPT-4o level)
const OPENWEBUI_BASE_URL = process.env.OPENWEBUI_BASE_URL;
const OPENWEBUI_API_KEY = process.env.OPENWEBUI_API_KEY;
const OPENWEBUI_MODEL = process.env.OPENWEBUI_MODEL || "qwen2.5vl:7b";

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

// Comprehensive extraction prompt - Two-Phase extraction strategy
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

**EXAMPLES of split event names:**
- "BOSS" on line 1 + "BRIM" on line 2 + "BASH" on line 3 = eventName: "Boss Brim Bash"
- "HOSTILE" on line 1 + "TAKEOVER" on line 2 = eventName: "Hostile Takeover"
- "POWER" on line 1 + "OF LOVE" on line 2 = eventName: "Power of Love"
- "ANNUAL" above + "MIDWEST" + "AFFAIR" = eventName: "Annual Midwest Affair"

**CRITICAL:** Always combine related stylized text into ONE event name. Do NOT extract just part of it.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL #3: CITY AND STATE EXTRACTION
═══════════════════════════════════════════════════════════════════

⚠️ **PARSE CITY/STATE FROM ALL COMMON FORMATS:**

1. "CITY, STATE" → city: "City", state: "ST" (e.g., "Toledo, Ohio" → city: "Toledo", state: "OH")
2. "CITY STATE" (no comma) → city: "City", state: "ST" (e.g., "ATLANTA GA" → city: "Atlanta", state: "GA")
3. "CITY, ST ZIP" → city: "City", state: "ST" (e.g., "Chicago, IL 60637" → city: "Chicago", state: "IL")
4. From full address: "123 Street, City, ST" → Extract city and state

**STATE ABBREVIATIONS:** Always convert full state names to 2-letter codes:
- "Georgia" or "GA" → "GA"
- "Ohio" → "OH"
- "Illinois" or "IL" → "IL"
- "Florida" → "FL"

**CRITICAL:** Even if the address shows "NE ATLANTA GA" or similar, extract city: "Atlanta", state: "GA"

═══════════════════════════════════════════════════════════════════
📋 SAVE THE DATE FLYER RULES
═══════════════════════════════════════════════════════════════════

**FOR SAVE THE DATE FLYERS - DATE EXTRACTION RULES:**

1. **THE DATE IS MANDATORY - YOU MUST FIND IT**
   - Search the ENTIRE flyer for date information
   - Look EVERYWHERE: top, bottom, center, corners, sides, watermarks, background
   - Check ALL text sizes: large headlines, small print, decorative text
   - Look for ANY date format: "January 8-11", "Jan 8", "1/8/26", "January 2026"

2. **For Save the Date flyers:**
   - Description field: MUST include "Save the Date" and the DATE
   - eventName: Required
   - **eventDate: ABSOLUTELY REQUIRED - THIS IS THE MOST IMPORTANT FIELD**
   - venueName: Extract if shown (can have venue even for Save the Date)
   - eventTime: Extract if shown (can have time even for Save the Date)
   - city/state: Extract if shown
   - containsSaveTheDateText: Must be true
   - eventType: Must be "SAVE_THE_DATE"

═══════════════════════════════════════════════════════════════════
🎯 TWO-PHASE EXTRACTION STRATEGY
═══════════════════════════════════════════════════════════════════

**PHASE 1: COMPLETE TEXT EXTRACTION WITH FORMATTING (MOST IMPORTANT)**
First, you MUST extract 100% of ALL visible text from the entire flyer image.
This goes in the "description" field and is the foundation for Phase 2.

Read the ENTIRE flyer carefully and capture:
- Main event title/headline
- All dates and times mentioned anywhere (including END time if shown)
- Venue name and address details
- ALL performer names, DJ names, special guests
- **TICKET PRICING INFORMATION** (very important - include all ticket types, prices, and details)
- Contact information (phone, email, social media)
- Age restrictions, dress codes, parking info
- Sponsors, hosts, organizers
- Fine print, disclaimers, legal text
- Any other visible text (don't skip anything!)

🚫 **CRITICAL EXCLUSION - DO NOT INCLUDE DESIGNER INFORMATION IN DESCRIPTION:**
- **COMPLETELY EXCLUDE** any text about graphic design, flyer design, or designer credits
- **DO NOT include** phrases like: "Design by", "Designed by", "Graphics by", "Flyer by"

**CRITICAL JSON FORMATTING:**
- In the JSON output, use the escape sequence \\n (backslash-n) for line breaks
- DO NOT use actual/literal newlines in the JSON string - this breaks JSON parsing
- Example CORRECT: "description": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3"

**PHASE 2: STRUCTURED FIELD EXTRACTION**
After Phase 1 is complete, use the description text you extracted to fill out the structured fields below.

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
    : `${process.env.NEXT_PUBLIC_APP_URL || "https://stepperslife.com"}${filepath}`;

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
 * This runs AFTER the model extraction to ensure data quality
 */
function postProcessExtractedData(data: Partial<ExtractedData>): Partial<ExtractedData> {
  const processed = { ...data };
  const descriptionLower = (processed.description || "").toLowerCase();

  // 1. FIX: Save the Date detection from description text
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

  // 2. FIX: Extract city/state from description or address if missing
  if (!processed.city || !processed.state) {
    // Common patterns: "ATLANTA GA", "Toledo, Ohio", "Chicago, IL 60637"
    const locationPatterns = [
      // "City, State" or "City, ST"
      /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/g,
      // "City, Full State Name"
      /\b([A-Z][a-zA-Z\s]+),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/gi,
      // "CITY ST" (no comma, like "ATLANTA GA")
      /\b([A-Z]{3,})\s+([A-Z]{2})\b/g,
    ];

    const textToSearch = `${processed.description || ""} ${processed.address || ""}`;

    for (const pattern of locationPatterns) {
      const matches = [...textToSearch.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[2]) {
          const potentialCity = match[1].trim();
          let potentialState = match[2].trim();

          // Skip if it looks like a street address component
          if (/^(street|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)$/i.test(potentialCity)) {
            continue;
          }

          // Convert full state name to abbreviation
          const stateLower = potentialState.toLowerCase();
          if (STATE_ABBREVIATIONS[stateLower]) {
            potentialState = STATE_ABBREVIATIONS[stateLower];
          }

          // Only update if not already set and looks valid
          if (!processed.city && potentialCity.length >= 3) {
            // Title case the city
            processed.city = potentialCity.charAt(0).toUpperCase() +
                           potentialCity.slice(1).toLowerCase();
          }
          if (!processed.state && potentialState.length === 2) {
            processed.state = potentialState.toUpperCase();
          }

          if (processed.city && processed.state) break;
        }
      }
      if (processed.city && processed.state) break;
    }
  }

  // 3. FIX: Normalize state to 2-letter abbreviation
  if (processed.state && processed.state.length > 2) {
    const stateLower = processed.state.toLowerCase();
    if (STATE_ABBREVIATIONS[stateLower]) {
      processed.state = STATE_ABBREVIATIONS[stateLower];
    }
  }

  // 4. FIX: Clean up event name - remove extra whitespace
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
 * Extract flyer data using Open WebUI (self-hosted)
 * Uses OpenAI-compatible API with vision model (qwen2.5vl:7b)
 */
async function extractWithOpenWebUI(
  base64Image: string,
  mimeType: string
): Promise<ExtractionResult> {
  if (!OPENWEBUI_BASE_URL || !OPENWEBUI_API_KEY) {
    throw new Error("Open WebUI not configured - OPENWEBUI_BASE_URL and OPENWEBUI_API_KEY required");
  }

  const response = await fetch(`${OPENWEBUI_BASE_URL}/api/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENWEBUI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENWEBUI_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Open WebUI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content;

  if (!extractedText) {
    throw new Error("No response from Open WebUI");
  }

  return parseExtractionResponse(extractedText, OPENWEBUI_MODEL);
}

/**
 * Main POST handler
 * Uses Open WebUI with qwen2.5vl:7b (self-hosted, GPT-4o level OCR)
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

    // Extract using Open WebUI
    let result: ExtractionResult;
    try {
      result = await extractWithOpenWebUI(imageData.base64, imageData.mimeType);
    } catch (error) {
      console.error("[AI Extraction] Open WebUI failed:", error);
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
  const openwebuiConfigured = !!(OPENWEBUI_BASE_URL && OPENWEBUI_API_KEY);

  // Check Open WebUI availability
  let openwebuiAvailable = false;
  if (openwebuiConfigured) {
    try {
      const response = await fetch(`${OPENWEBUI_BASE_URL}/api/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${OPENWEBUI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      openwebuiAvailable = response.ok;
    } catch {
      openwebuiAvailable = false;
    }
  }

  return NextResponse.json({
    providers: {
      openwebui: {
        available: openwebuiAvailable,
        configured: openwebuiConfigured,
        url: OPENWEBUI_BASE_URL || "not configured",
        model: OPENWEBUI_MODEL,
        description: "Self-hosted Open WebUI with Ollama backend",
      },
    },
    strategy: "Open WebUI (self-hosted) with qwen2.5vl:7b",
    recommendation: openwebuiAvailable ? "openwebui" : "none",
  });
}
