/**
 * Referral Link Generator
 * Creates unique referral codes for users to share with friends
 */

/**
 * Generate a unique referral code from a user ID
 * Uses base64 encoding for simplicity (not for security)
 */
export function generateReferralCode(userId: string): string {
  // Add timestamp to make each link unique
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;

  // Encode to base64 and make URL-safe
  const base64 = Buffer.from(payload).toString("base64");
  const urlSafe = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return urlSafe;
}

/**
 * Decode a referral code to get the user ID
 * Returns null if the code is invalid
 */
export function decodeReferralCode(code: string): string | null {
  try {
    // Convert from URL-safe base64 back to standard base64
    let base64 = code.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode from base64
    const payload = Buffer.from(base64, "base64").toString("utf-8");

    // Extract user ID (before the colon)
    const [userId] = payload.split(":");

    // Validate that it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      return null;
    }

    return userId;
  } catch (error) {
    console.error("Error decoding referral code:", error);
    return null;
  }
}

/**
 * Create a shareable referral link
 */
export function createReferralLink(userId: string, baseUrl?: string): string {
  const code = generateReferralCode(userId);
  const base = baseUrl || "https://teamcinder.com/coach";

  return `${base}?ref=${code}`;
}

/**
 * Extract referral code from URL
 */
export function extractReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("ref");
  } catch {
    return null;
  }
}
