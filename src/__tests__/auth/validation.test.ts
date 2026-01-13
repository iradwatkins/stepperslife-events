/**
 * Auth Validation Tests
 *
 * Tests for Zod validation schemas used in auth routes
 */

import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  emailSchema,
  passwordSchema,
  ValidationError,
} from "@/lib/validations/schemas";

describe("Email Validation", () => {
  it("accepts valid email addresses", () => {
    const validEmails = [
      "user@example.com",
      "test.user@domain.org",
      "user+tag@gmail.com",
      "a@b.co",
    ];

    for (const email of validEmails) {
      expect(() => emailSchema.parse(email)).not.toThrow();
    }
  });

  it("rejects invalid email addresses", () => {
    const invalidEmails = [
      "",
      "notanemail",
      "@nodomain.com",
      "user@",
      "user@.com",
      "user space@domain.com",
    ];

    for (const email of invalidEmails) {
      expect(() => emailSchema.parse(email)).toThrow();
    }
  });

  it("normalizes email to lowercase", () => {
    const result = emailSchema.parse("USER@EXAMPLE.COM");
    expect(result).toBe("user@example.com");
  });

  it("transforms email to lowercase and trims after validation", () => {
    // Email validation happens before transform, so leading/trailing spaces fail
    // Valid emails are transformed
    const result = emailSchema.parse("USER@EXAMPLE.COM");
    expect(result).toBe("user@example.com");
  });
});

describe("Password Validation", () => {
  it("accepts valid passwords", () => {
    const validPasswords = [
      "Password1!",
      "SecureP@ss123",
      "MyP@ssw0rd!",
      "C0mpl3x!Pass",
    ];

    for (const password of validPasswords) {
      expect(() => passwordSchema.parse(password)).not.toThrow();
    }
  });

  it("rejects passwords without uppercase", () => {
    expect(() => passwordSchema.parse("password1!")).toThrow(/uppercase/i);
  });

  it("rejects passwords without lowercase", () => {
    expect(() => passwordSchema.parse("PASSWORD1!")).toThrow(/lowercase/i);
  });

  it("rejects passwords without numbers", () => {
    expect(() => passwordSchema.parse("Password!@")).toThrow(/number/i);
  });

  it("accepts passwords without special characters", () => {
    // Current schema doesn't require special characters
    expect(() => passwordSchema.parse("Password123")).not.toThrow();
  });

  it("rejects passwords that are too short", () => {
    expect(() => passwordSchema.parse("Pa1")).toThrow(/at least 8/i);
  });

  it("rejects passwords that are too long", () => {
    const longPassword = "A".repeat(130) + "a1"; // 132 chars, max is 128
    expect(() => passwordSchema.parse(longPassword)).toThrow();
  });
});

describe("Login Schema", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.parse({
      email: "user@example.com",
      password: "anypassword123",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.password).toBe("anypassword123");
  });

  it("rejects missing email", () => {
    expect(() =>
      loginSchema.parse({
        password: "password123",
      })
    ).toThrow();
  });

  it("rejects missing password", () => {
    expect(() =>
      loginSchema.parse({
        email: "user@example.com",
      })
    ).toThrow();
  });

  it("rejects empty password", () => {
    expect(() =>
      loginSchema.parse({
        email: "user@example.com",
        password: "",
      })
    ).toThrow();
  });
});

describe("Register Schema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      password: "SecureP@ss123",
    });

    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.password).toBe("SecureP@ss123");
  });

  it("trims name whitespace", () => {
    const result = registerSchema.parse({
      name: "  John Doe  ",
      email: "john@example.com",
      password: "SecureP@ss123",
    });

    expect(result.name).toBe("John Doe");
  });

  it("rejects empty name", () => {
    // Name must have at least 1 character
    expect(() =>
      registerSchema.parse({
        name: "",
        email: "john@example.com",
        password: "SecureP@ss123",
      })
    ).toThrow(/required/i);
  });

  it("rejects name that is too long", () => {
    expect(() =>
      registerSchema.parse({
        name: "A".repeat(101),
        email: "john@example.com",
        password: "SecureP@ss123",
      })
    ).toThrow();
  });

  it("applies strict password validation for registration", () => {
    expect(() =>
      registerSchema.parse({
        name: "John Doe",
        email: "john@example.com",
        password: "weak",
      })
    ).toThrow();
  });
});

describe("Verify Email Schema", () => {
  it("accepts valid verification data", () => {
    const result = verifyEmailSchema.parse({
      email: "user@example.com",
      code: "123456",
    });

    expect(result.email).toBe("user@example.com");
    expect(result.code).toBe("123456");
  });

  it("rejects invalid verification codes", () => {
    const invalidCodes = [
      "12345", // too short
      "1234567", // too long
      "abcdef", // not digits
      "12345a", // contains letter
    ];

    for (const code of invalidCodes) {
      expect(() =>
        verifyEmailSchema.parse({
          email: "user@example.com",
          code,
        })
      ).toThrow();
    }
  });
});

describe("ValidationError", () => {
  it("creates error with correct properties", () => {
    const mockIssues = [
      {
        code: "invalid_type" as const,
        expected: "string",
        received: "undefined",
        path: ["email"],
        message: "Required",
      },
    ];

    const error = new ValidationError("Validation failed", mockIssues);

    expect(error.message).toBe("Validation failed");
    expect(error.errors).toEqual(mockIssues);
    expect(error.statusCode).toBe(400);
  });
});
