/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for API input validation.
 * Provides type-safe validation with clear error messages.
 */

import { z } from "zod";

// ================================
// Common Validators
// ================================

/**
 * Email validation with lowercase normalization
 */
export const emailSchema = z
  .string()
  .email("Please provide a valid email address")
  .max(255, "Email must be 255 characters or less")
  .transform((val) => val.toLowerCase().trim());

/**
 * Password validation with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Simple password for login (no strength requirements)
 */
export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password must be 128 characters or less");

/**
 * Name validation
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or less")
  .transform((val) => val.trim());

/**
 * Phone number validation (flexible format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^[\d\s\-+()]+$/,
    "Phone number can only contain digits, spaces, dashes, plus signs, and parentheses"
  )
  .min(10, "Phone number must be at least 10 characters")
  .max(20, "Phone number must be 20 characters or less")
  .optional();

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Invalid ID format"
  );

/**
 * Convex ID validation (Convex uses specific format)
 */
export const convexIdSchema = z
  .string()
  .min(1, "ID is required")
  .max(100, "Invalid ID format");

/**
 * Positive integer validation
 */
export const positiveIntSchema = z
  .number()
  .int("Must be a whole number")
  .positive("Must be a positive number");

/**
 * Non-negative integer validation
 */
export const nonNegativeIntSchema = z
  .number()
  .int("Must be a whole number")
  .nonnegative("Cannot be negative");

/**
 * Price validation (in cents)
 */
export const priceInCentsSchema = z
  .number()
  .int("Price must be a whole number (in cents)")
  .nonnegative("Price cannot be negative")
  .max(99999999, "Price exceeds maximum allowed");

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url("Please provide a valid URL")
  .max(2000, "URL must be 2000 characters or less");

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z
  .string()
  .datetime("Invalid date format. Use ISO 8601 format.");

// ================================
// Auth Schemas
// ================================

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: passwordSchema,
});

// ================================
// Event Schemas
// ================================

export const eventIdSchema = z.object({
  eventId: convexIdSchema,
});

export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(5000, "Description must be 5000 characters or less")
    .optional(),
  date: dateStringSchema,
  endDate: dateStringSchema.optional(),
  venue: z.string().max(200, "Venue must be 200 characters or less").optional(),
  address: z.string().max(500, "Address must be 500 characters or less").optional(),
  city: z.string().max(100, "City must be 100 characters or less").optional(),
  state: z.string().max(50, "State must be 50 characters or less").optional(),
  zipCode: z.string().max(20, "Zip code must be 20 characters or less").optional(),
  category: z.enum([
    "dance",
    "music",
    "social",
    "workshop",
    "competition",
    "other",
  ]).optional(),
  status: z.enum(["draft", "published", "cancelled"]).default("draft"),
});

// ================================
// Ticket Schemas
// ================================

export const ticketTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Ticket name is required")
    .max(100, "Ticket name must be 100 characters or less"),
  price: priceInCentsSchema,
  quantity: positiveIntSchema,
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  maxPerOrder: positiveIntSchema.max(100, "Maximum per order is 100").optional(),
});

export const purchaseTicketSchema = z.object({
  eventId: convexIdSchema,
  ticketTypeId: convexIdSchema,
  quantity: positiveIntSchema.max(20, "Maximum 20 tickets per order"),
  buyerEmail: emailSchema,
  buyerName: nameSchema,
  buyerPhone: phoneSchema,
});

// ================================
// Payment Schemas
// ================================

export const stripePaymentIntentSchema = z.object({
  orderId: convexIdSchema,
  amount: priceInCentsSchema,
});

export const paypalOrderSchema = z.object({
  orderId: convexIdSchema,
  amount: priceInCentsSchema,
});

export const refundSchema = z.object({
  orderId: convexIdSchema,
  reason: z
    .string()
    .max(500, "Reason must be 500 characters or less")
    .optional(),
  amount: priceInCentsSchema.optional(), // For partial refunds
});

// ================================
// Contact/Support Schemas
// ================================

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be 200 characters or less"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be 5000 characters or less"),
});

// ================================
// Pagination Schema
// ================================

export const paginationSchema = z.object({
  page: nonNegativeIntSchema.default(0),
  limit: positiveIntSchema.max(100, "Maximum limit is 100").default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.string().max(50).optional(),
});

// ================================
// Helper Functions
// ================================

/**
 * Validate request body against a schema
 * Returns parsed data or throws formatted error
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(messages, error.issues);
    }
    throw new ValidationError("Invalid request body");
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      throw new ValidationError(messages, error.issues);
    }
    throw new ValidationError("Invalid query parameters");
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: z.ZodIssue[];
  public readonly statusCode = 400;

  constructor(message: string, errors: z.ZodIssue[] = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }

  toJSON() {
    return {
      error: "Validation Error",
      message: this.message,
      details: this.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    };
  }
}

// ================================
// Type Exports
// ================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type PurchaseTicketInput = z.infer<typeof purchaseTicketSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
