/**
 * Rate Limiting Utility
 * Per-IP and per-account rate limiting for API routes
 */

import { createClient } from "@/lib/supabase/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

// In-memory store for rate limiting (consider Redis for production)
const requestStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
  ip: string,
  config: RateLimitConfig = { interval: 60000, maxRequests: 60 }
): Promise<RateLimitResult> {
  const key = `ip:${ip}`;
  return checkRateLimit(key, config);
}

/**
 * Rate limit by user account
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = { interval: 60000, maxRequests: 100 }
): Promise<RateLimitResult> {
  const key = `user:${userId}`;
  return checkRateLimit(key, config);
}

/**
 * Check session creation limits (2 sessions per day per user)
 */
export async function checkSessionLimit(
  userId: string
): Promise<{ allowed: boolean; sessionsToday: number }> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (error) {
    console.error("Error checking session limit:", error);
    return { allowed: true, sessionsToday: 0 }; // Fail open
  }

  const sessionsToday = data?.length ?? 0;
  const maxSessionsPerDay = 2; // From system_config

  return {
    allowed: sessionsToday < maxSessionsPerDay,
    sessionsToday,
  };
}

/**
 * Core rate limiting logic
 */
function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = requestStore.get(key);

  // Clean up expired entries
  if (record && record.resetAt <= now) {
    requestStore.delete(key);
  }

  const currentRecord = requestStore.get(key);

  if (!currentRecord) {
    // First request in this window
    const resetAt = now + config.interval;
    requestStore.set(key, { count: 1, resetAt });

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(resetAt),
    };
  }

  // Check if limit exceeded
  if (currentRecord.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(currentRecord.resetAt),
    };
  }

  // Increment count
  currentRecord.count += 1;
  requestStore.set(key, currentRecord);

  return {
    success: true,
    remaining: config.maxRequests - currentRecord.count,
    resetAt: new Date(currentRecord.resetAt),
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

/**
 * Cleanup old entries periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (record.resetAt <= now) {
      requestStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === "undefined") {
  // Server-side only
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
