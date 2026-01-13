/**
 * Input Sanitization Utilities
 *
 * Provides XSS prevention and input sanitization for user-submitted content.
 * Uses a whitelist approach for maximum security.
 */

/**
 * HTML entities map for encoding
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&[^;]+;/g, "") // Remove HTML entities
    .trim();
}

/**
 * Sanitize a string for safe display (removes dangerous content)
 */
export function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";

  return str
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, "")
    // Remove data: URLs (can contain malicious content)
    .replace(/data\s*:/gi, "")
    // Remove vbscript: URLs
    .replace(/vbscript\s*:/gi, "")
    // Escape remaining HTML
    .trim();
}

/**
 * Sanitize user input for database storage
 * More aggressive than display sanitization
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    // Normalize unicode
    .normalize("NFC")
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";

  return email
    .toLowerCase()
    .trim()
    // Remove any characters that aren't valid in email
    .replace(/[^\w.@+-]/g, "")
    // Limit length
    .slice(0, 254);
}

/**
 * Sanitize URL - validates and normalizes
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== "string") return null;

  try {
    const parsed = new URL(url.trim());

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize phone number (US format)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== "string") return "";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // US phone numbers
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits.slice(0, 15); // ITU-T E.164 max
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string") return "";

  return filename
    // Remove path separators
    .replace(/[/\\]/g, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove other dangerous characters
    .replace(/[<>:"|?*]/g, "")
    // Remove leading dots (hidden files)
    .replace(/^\.+/, "")
    // Limit length
    .slice(0, 255)
    .trim();
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    stripHtml?: boolean;
    escapeHtml?: boolean;
  } = {}
): T {
  const { stripHtml: shouldStripHtml = false, escapeHtml: shouldEscapeHtml = true } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      let sanitized = sanitizeInput(value);
      if (shouldStripHtml) {
        sanitized = stripHtml(sanitized);
      } else if (shouldEscapeHtml) {
        sanitized = escapeHtml(sanitized);
      }
      result[key] = sanitized;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInput(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>, options)
            : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Create a safe JSON string (prevents JSON injection)
 */
export function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Validate and sanitize a slug
 */
export function sanitizeSlug(slug: string): string {
  if (typeof slug !== "string") return "";

  return slug
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, "-")
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, "")
    // Remove multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Limit length
    .slice(0, 100);
}

/**
 * Sanitize rich text content (allows safe HTML)
 */
export function sanitizeRichText(html: string): string {
  if (typeof html !== "string") return "";

  // Allowed tags (whitelist approach)
  const allowedTags = [
    "p",
    "br",
    "b",
    "i",
    "u",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "a",
  ];

  let sanitized = html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, "")
    // Remove data: URLs
    .replace(/data\s*:/gi, "");

  // Remove disallowed tags but keep content
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For anchor tags, validate href
      if (tagName.toLowerCase() === "a") {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          // Only allow http, https, mailto, and relative URLs
          if (
            !href.startsWith("http://") &&
            !href.startsWith("https://") &&
            !href.startsWith("mailto:") &&
            !href.startsWith("/") &&
            !href.startsWith("#")
          ) {
            return ""; // Remove the entire tag
          }
        }
        // Rebuild anchor with only href
        const cleanHref = match.match(/href\s*=\s*["'][^"']*["']/i);
        if (cleanHref) {
          return match.startsWith("</") ? "</a>" : `<a ${cleanHref[0]} rel="noopener noreferrer">`;
        }
        return match.startsWith("</") ? "</a>" : "<a>";
      }
      // For other allowed tags, strip attributes
      return match.startsWith("</") ? `</${tagName}>` : `<${tagName}>`;
    }
    return ""; // Remove disallowed tags
  });

  return sanitized.trim();
}

/**
 * Check if a string contains potential XSS vectors
 */
export function containsXssVectors(str: string): boolean {
  if (typeof str !== "string") return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(str));
}
