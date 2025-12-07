/**
 * reCAPTCHA Verification Utility
 * Verifies reCAPTCHA v3 tokens with score threshold
 */

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5; // Minimum acceptable score for reCAPTCHA v3

/**
 * Verify reCAPTCHA token
 * @param token - reCAPTCHA token from client
 * @param expectedAction - Expected action name (e.g., 'login', 'upload')
 * @returns Promise<boolean> - True if verification passes
 */
export async function verifyRecaptcha(
  token?: string,
  expectedAction?: string
): Promise<{
  success: boolean;
  score?: number;
  error?: string;
  token?: string;
}> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn("RECAPTCHA_SECRET_KEY not configured; skipping verification");
    return {
      success: true,
      token: token,
    };
  }

  if (!token) {
    return {
      success: false,
      error: "No reCAPTCHA token provided",
    };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${data["error-codes"]?.join(", ")}`,
      };
    }

    // Check score threshold (v3 only)
    if (data.score < MIN_SCORE) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score} (minimum: ${MIN_SCORE})`,
      };
    }

    // Check action if provided
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        error: `Action mismatch: expected "${expectedAction}", got "${data.action}"`,
      };
    }

    return {
      success: true,
      score: data.score,
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "reCAPTCHA verification failed",
    };
  }
}

/**
 * Middleware helper to verify reCAPTCHA from request body
 */
export async function verifyRecaptchaFromRequest(
  request: Request,
  expectedAction?: string
): Promise<{
  success: boolean;
  score?: number;
  error?: string;
  token?: string;
}> {
  try {
    const body = await request.json();
    const token = body.recaptchaToken;

    if (!token) {
      return {
        success: false,
        error: "No reCAPTCHA token in request",
      };
    }

    return await verifyRecaptcha(token, expectedAction);
  } catch {
    return {
      success: false,
      error: "Failed to parse request body",
    };
  }
}
