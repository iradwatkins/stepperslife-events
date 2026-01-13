/**
 * Input Sanitization Tests
 *
 * Tests for XSS prevention and input sanitization utilities
 */

import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeFilename,
  sanitizeSlug,
  containsXssVectors,
  sanitizeRichText,
} from "@/lib/security/sanitize";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("AT&T")).toBe("AT&amp;T");
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
    expect(escapeHtml("'test'")).toBe("&#x27;test&#x27;");
  });

  it("handles empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("handles non-strings gracefully", () => {
    // @ts-expect-error Testing invalid input
    expect(escapeHtml(null)).toBe("");
    // @ts-expect-error Testing invalid input
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
  });

  it("removes HTML entities", () => {
    expect(stripHtml("Hello&nbsp;World")).toBe("HelloWorld");
  });

  it("removes script tags", () => {
    // Note: stripHtml only removes tags, not their content
    // Use sanitizeString for complete script removal
    expect(stripHtml("<script>alert('xss')</script>Hello")).toContain("Hello");
    expect(stripHtml("<script>alert('xss')</script>Hello")).not.toContain("<script>");
  });
});

describe("sanitizeString", () => {
  it("removes script tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).toBe("");
  });

  it("removes event handlers", () => {
    expect(sanitizeString('<div onclick="evil()">click</div>')).toBe(
      "<div>click</div>"
    );
  });

  it("removes javascript: URLs", () => {
    expect(sanitizeString("javascript:alert('xss')")).toBe("alert('xss')");
  });

  it("removes data: URLs and script content", () => {
    // sanitizeString removes both data: URLs and script tags
    const result = sanitizeString("data:text/html,<script>evil</script>");
    expect(result).not.toContain("data:");
    expect(result).not.toContain("<script>");
  });

  it("removes null bytes", () => {
    expect(sanitizeString("hello\0world")).toBe("helloworld");
  });
});

describe("sanitizeInput", () => {
  it("removes control characters", () => {
    // Control characters are removed entirely
    const result = sanitizeInput("hello\x00\x01\x02world");
    expect(result).not.toContain("\x00");
    expect(result).not.toContain("\x01");
    expect(result).not.toContain("\x02");
    expect(result).toBe("helloworld");
  });

  it("collapses multiple spaces", () => {
    expect(sanitizeInput("hello    world")).toBe("hello world");
  });

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });

  it("normalizes unicode", () => {
    const nfd = "café"; // Can be represented with combining characters
    const result = sanitizeInput(nfd);
    expect(result).toBe(result.normalize("NFC"));
  });
});

describe("sanitizeEmail", () => {
  it("lowercases email", () => {
    expect(sanitizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("removes invalid characters", () => {
    expect(sanitizeEmail("user<script>@example.com")).toBe("userscript@example.com");
  });

  it("limits length", () => {
    const longEmail = "a".repeat(300) + "@example.com";
    expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(254);
  });
});

describe("sanitizeUrl", () => {
  it("accepts valid http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("accepts valid https URLs", () => {
    expect(sanitizeUrl("https://example.com/path?query=1")).toBe(
      "https://example.com/path?query=1"
    );
  });

  it("rejects javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert('xss')")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>evil</script>")).toBeNull();
  });

  it("rejects invalid URLs", () => {
    expect(sanitizeUrl("not a url")).toBeNull();
  });

  it("handles empty strings", () => {
    expect(sanitizeUrl("")).toBeNull();
  });
});

describe("sanitizePhone", () => {
  it("extracts digits from formatted phone", () => {
    expect(sanitizePhone("(555) 123-4567")).toBe("5551234567");
  });

  it("handles phone with country code", () => {
    expect(sanitizePhone("+1-555-123-4567")).toBe("5551234567");
  });

  it("limits to 15 digits (E.164 max)", () => {
    const longNumber = "1".repeat(20);
    expect(sanitizePhone(longNumber).length).toBeLessThanOrEqual(15);
  });
});

describe("sanitizeFilename", () => {
  it("removes path separators", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
  });

  it("removes null bytes", () => {
    expect(sanitizeFilename("file\0.txt")).toBe("file.txt");
  });

  it("removes dangerous characters", () => {
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe("file.txt");
  });

  it("removes leading dots", () => {
    expect(sanitizeFilename(".hidden")).toBe("hidden");
  });

  it("limits filename length", () => {
    const longFilename = "a".repeat(300) + ".txt";
    expect(sanitizeFilename(longFilename).length).toBeLessThanOrEqual(255);
  });
});

describe("sanitizeSlug", () => {
  it("lowercases and removes spaces", () => {
    expect(sanitizeSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(sanitizeSlug("hello@world!")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeSlug("hello---world")).toBe("hello-world");
  });

  it("removes leading/trailing hyphens", () => {
    expect(sanitizeSlug("-hello-world-")).toBe("hello-world");
  });

  it("limits slug length", () => {
    const longSlug = "a".repeat(200);
    expect(sanitizeSlug(longSlug).length).toBeLessThanOrEqual(100);
  });
});

describe("containsXssVectors", () => {
  it("detects script tags", () => {
    expect(containsXssVectors("<script>")).toBe(true);
  });

  it("detects javascript: URLs", () => {
    expect(containsXssVectors("javascript:void(0)")).toBe(true);
  });

  it("detects event handlers", () => {
    expect(containsXssVectors('onclick="evil()"')).toBe(true);
  });

  it("detects iframe tags", () => {
    expect(containsXssVectors("<iframe src=")).toBe(true);
  });

  it("returns false for safe strings", () => {
    expect(containsXssVectors("Hello, World!")).toBe(false);
  });
});

describe("sanitizeRichText", () => {
  it("preserves allowed tags", () => {
    expect(sanitizeRichText("<p><strong>Hello</strong></p>")).toBe(
      "<p><strong>Hello</strong></p>"
    );
  });

  it("removes script tags", () => {
    expect(sanitizeRichText("<p>Hello</p><script>evil()</script>")).toBe(
      "<p>Hello</p>"
    );
  });

  it("removes event handlers from allowed tags", () => {
    expect(sanitizeRichText('<p onclick="evil()">Hello</p>')).toBe("<p>Hello</p>");
  });

  it("removes dangerous attributes from anchor tags", () => {
    const result = sanitizeRichText(
      '<a href="https://example.com" onclick="evil()">Link</a>'
    );
    expect(result).not.toContain("onclick");
    expect(result).toContain("href=");
  });

  it("removes anchor tags with javascript: href", () => {
    const result = sanitizeRichText('<a href="javascript:evil()">Link</a>');
    expect(result).not.toContain("javascript");
  });

  it("removes disallowed tags but keeps content", () => {
    expect(sanitizeRichText("<div>Hello</div>")).toBe("Hello");
  });
});
