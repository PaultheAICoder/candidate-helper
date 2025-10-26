/**
 * PII Detection Utility
 * Detects and redacts SSN and DOB from resume text
 */

export interface PIIDetectionResult {
  redactedText: string;
  piiFound: boolean;
  piiTypes: string[];
  warnings?: string[];
}

// SSN patterns (various formats)
const SSN_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // 123-45-6789
  /\b\d{3}\s\d{2}\s\d{4}\b/g, // 123 45 6789
  /\b\d{9}\b/g, // 123456789 (risky, may catch phone numbers)
];

// DOB patterns
const DOB_PATTERNS = [
  /\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g, // MM/DD/YYYY
  /\b(?:0?[1-9]|1[0-2])-(?:0?[1-9]|[12]\d|3[01])-(?:19|20)\d{2}\b/g, // MM-DD-YYYY
  /\b(?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}\b/g, // DD/MM/YYYY
  /\b(?:19|20)\d{2}\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\b/g, // YYYY/MM/DD
  /\b(?:19|20)\d{2}-(?:0?[1-9]|1[0-2])-(?:0?[1-9]|[12]\d|3[01])\b/g, // YYYY-MM-DD
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:0?[1-9]|[12]\d|3[01]),?\s+(?:19|20)\d{2}\b/gi, // Month DD, YYYY
];

const REDACTED_MARKER = "[REDACTED]";

/**
 * Detect and redact PII from text
 */
export function detectAndRedactPII(text: string): PIIDetectionResult {
  let redactedText = text;
  const piiTypes: string[] = [];
  const warnings: string[] = [];

  // Redact SSN
  for (const pattern of SSN_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      if (!piiTypes.includes("ssn")) {
        piiTypes.push("ssn");
      }
      redactedText = redactedText.replace(pattern, REDACTED_MARKER);
      warnings.push(`Detected and redacted ${matches.length} potential SSN(s)`);
    }
  }

  // Redact DOB
  for (const pattern of DOB_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      // Validate age (16-100) before redacting
      for (const match of matches) {
        const age = calculateAge(match);
        if (age >= 16 && age <= 100) {
          if (!piiTypes.includes("dob")) {
            piiTypes.push("dob");
          }
          redactedText = redactedText.replace(match, REDACTED_MARKER);
          warnings.push(`Detected and redacted DOB: ${match}`);
        }
      }
    }
  }

  return {
    redactedText,
    piiFound: piiTypes.length > 0,
    piiTypes,
    warnings,
  };
}

/**
 * Calculate age from date string
 * Handles various formats: MM/DD/YYYY, MM-DD-YYYY, YYYY/MM/DD, YYYY-MM-DD
 */
function calculateAge(dateString: string): number {
  try {
    let year: number, month: number, day: number;

    // Check for different formats
    if (dateString.includes("/")) {
      const parts = dateString.split("/").map((p) => parseInt(p));
      if (parts[0] > 1000) {
        // YYYY/MM/DD format
        [year, month, day] = parts;
        month = month - 1; // JS months are 0-indexed
      } else {
        // MM/DD/YYYY or DD/MM/YYYY format - assume MM/DD/YYYY
        [month, day, year] = parts;
        month = month - 1;
      }
    } else if (dateString.includes("-")) {
      const parts = dateString.split("-").map((p) => parseInt(p));
      if (parts[0] > 1000) {
        // YYYY-MM-DD format
        [year, month, day] = parts;
        month = month - 1;
      } else {
        // MM-DD-YYYY format
        [month, day, year] = parts;
        month = month - 1;
      }
    } else {
      return 0;
    }

    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch {
    return 0;
  }
}

/**
 * Check if text contains PII (without redaction)
 */
export function hasPII(text: string): boolean {
  const result = detectAndRedactPII(text);
  return result.piiFound;
}

/**
 * Legacy alias for hasPII
 * @deprecated Use hasPII instead
 */
export function containsPII(text: string): boolean {
  return hasPII(text);
}
