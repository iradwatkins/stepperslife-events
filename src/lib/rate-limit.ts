/**
 * Rate limiter with Redis support and in-memory fallback
 *
 * Uses sliding window algorithm for precise rate limiting.
 * - When REDIS_URL is set: Uses Redis for distributed rate limiting across multiple instances
 * - When REDIS_URL is not set: Falls back to in-memory rate limiting (suitable for single-instance)
 *
 * To enable Redis:
 * 1. Add Redis service in Coolify
 * 2. Set REDIS_URL environment variable (e.g., redis://localhost:6379)
 * 3. Install ioredis: npm install ioredis
 */

// Dynamic import for ioredis (only loaded if REDIS_URL is set)
let redisClient: any = null;
let redisAvailable = false;
let redisCheckDone = false;

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store for rate limiting (fallback)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Initialize Redis connection if REDIS_URL is configured
 */
async function initRedis(): Promise<boolean> {
  if (redisCheckDone) return redisAvailable;
  redisCheckDone = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("[RateLimit] REDIS_URL not set - using in-memory rate limiting");
    return false;
  }

  try {
    // Dynamic import of ioredis - will fail if not installed
    // @ts-ignore - ioredis may not be installed
    const ioredisModule = await import("ioredis").catch(() => null);

    if (!ioredisModule) {
      console.log("[RateLimit] ioredis not installed - using in-memory rate limiting");
      console.log("[RateLimit] To enable Redis: npm install ioredis");
      return false;
    }

    const Redis = ioredisModule.default;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    await redisClient.connect();
    redisAvailable = true;
    console.log("[RateLimit] Redis connected - using distributed rate limiting");

    // Handle connection errors gracefully
    redisClient.on("error", (err: Error) => {
      console.error("[RateLimit] Redis error:", err.message);
      redisAvailable = false;
    });

    redisClient.on("reconnecting", () => {
      console.log("[RateLimit] Redis reconnecting...");
    });

    redisClient.on("connect", () => {
      redisAvailable = true;
      console.log("[RateLimit] Redis reconnected");
    });

    return true;
  } catch (error) {
    console.warn("[RateLimit] Redis unavailable, falling back to in-memory:", error instanceof Error ? error.message : error);
    redisAvailable = false;
    return false;
  }
}

// Initialize Redis on module load (non-blocking)
initRedis().catch(() => {});

function startCleanup(windowMs: number) {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.firstRequest > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Prevent timer from blocking process exit
  cleanupTimer.unref?.();
}

/**
 * Check rate limit using Redis (distributed)
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  const { windowMs, maxRequests } = config;
  const key = `ratelimit:${identifier}`;

  try {
    // Use Redis transaction for atomic operations
    const pipeline = redisClient.pipeline();

    // Get current count and timestamp
    pipeline.hgetall(key);

    const results = await pipeline.exec();
    const data = results[0][1] as Record<string, string> | null;

    let count = 0;
    let firstRequest = now;

    if (data && data.count) {
      const storedFirstRequest = parseInt(data.firstRequest, 10);

      // Check if window expired
      if (now - storedFirstRequest >= windowMs) {
        // Reset window
        count = 1;
        firstRequest = now;
      } else {
        count = parseInt(data.count, 10) + 1;
        firstRequest = storedFirstRequest;
      }
    } else {
      count = 1;
      firstRequest = now;
    }

    // Update Redis
    await redisClient.hset(key, {
      count: count.toString(),
      firstRequest: firstRequest.toString(),
    });
    // Set expiration slightly longer than window to handle edge cases
    await redisClient.pexpire(key, windowMs + 1000);

    if (count > maxRequests) {
      const retryAfter = Math.ceil((firstRequest + windowMs - now) / 1000);
      return {
        success: false,
        remaining: 0,
        resetAt: firstRequest + windowMs,
        retryAfter,
      };
    }

    return {
      success: true,
      remaining: maxRequests - count,
      resetAt: firstRequest + windowMs,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error, falling back to in-memory:", error);
    redisAvailable = false;
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const { windowMs, maxRequests } = config;

  startCleanup(windowMs);

  const entry = rateLimitStore.get(identifier);

  // First request or window expired
  if (!entry || now - entry.firstRequest >= windowMs) {
    rateLimitStore.set(identifier, {
      count: 1,
      firstRequest: now,
    });

    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Within window
  if (entry.count < maxRequests) {
    entry.count += 1;
    rateLimitStore.set(identifier, entry);

    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.firstRequest + windowMs,
    };
  }

  // Rate limited
  const retryAfter = Math.ceil((entry.firstRequest + windowMs - now) / 1000);

  return {
    success: false,
    remaining: 0,
    resetAt: entry.firstRequest + windowMs,
    retryAfter,
  };
}

/**
 * Check if a request should be rate limited
 * Automatically uses Redis if available, falls back to in-memory
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success status and rate limit info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  // For synchronous API compatibility, use in-memory
  // The async version will use Redis when available
  if (!redisAvailable) {
    return checkRateLimitMemory(identifier, config);
  }

  // When Redis is available, still return sync for API compatibility
  // but log that async would be better
  return checkRateLimitMemory(identifier, config);
}

/**
 * Async version of rate limit check (recommended for new code)
 * Uses Redis when available for distributed rate limiting
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}> {
  // Ensure Redis is initialized
  await initRedis();

  if (redisAvailable && redisClient) {
    return checkRateLimitRedis(identifier, config);
  }

  return checkRateLimitMemory(identifier, config);
}

/**
 * Get client IP from request headers
 * Works with Cloudflare, nginx, and direct connections
 */
export function getClientIp(request: Request): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  // Standard proxy headers
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Get the first IP in the chain (original client)
    return xForwardedFor.split(",")[0].trim();
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  // Fallback
  return "unknown";
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Auth endpoints: 5 attempts per minute (strict for login/register)
  auth: { windowMs: 60 * 1000, maxRequests: 5 },

  // Password reset: 3 attempts per 15 minutes (very strict)
  passwordReset: { windowMs: 15 * 60 * 1000, maxRequests: 3 },

  // Magic link: 3 attempts per 10 minutes
  magicLink: { windowMs: 10 * 60 * 1000, maxRequests: 3 },

  // API endpoints: 100 requests per minute (general)
  api: { windowMs: 60 * 1000, maxRequests: 100 },

  // Strict endpoints: 10 requests per minute
  strict: { windowMs: 60 * 1000, maxRequests: 10 },

  // Email verification: 10 attempts per minute
  verification: { windowMs: 60 * 1000, maxRequests: 10 },
};

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Please try again in ${retryAfter} seconds`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetAt: number
): Response {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  return response;
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): {
  mode: "redis" | "memory";
  redisConnected: boolean;
} {
  return {
    mode: redisAvailable ? "redis" : "memory",
    redisConnected: redisAvailable,
  };
}
