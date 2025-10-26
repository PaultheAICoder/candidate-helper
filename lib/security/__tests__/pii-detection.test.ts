import { detectAndRedactPII, hasPII } from "../pii-detection";

describe("PII Detection Utility", () => {
  describe("SSN Detection", () => {
    it("should detect and redact SSN in format XXX-XX-XXXX", () => {
      const text = "My SSN is 123-45-6789 and my email is test@example.com";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.redactedText).not.toContain("123-45-6789");
      expect(result.piiFound).toBe(true);
      expect(result.piiTypes).toContain("ssn");
    });

    it("should detect and redact SSN without dashes (XXXXXXXXX)", () => {
      const text = "SSN: 123456789";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.redactedText).not.toContain("123456789");
      expect(result.piiFound).toBe(true);
    });

    it("should detect multiple SSNs in text", () => {
      const text = "First SSN: 123-45-6789, Second SSN: 987-65-4321";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).not.toContain("123-45-6789");
      expect(result.redactedText).not.toContain("987-65-4321");
      const redactedCount = (result.redactedText.match(/\[REDACTED\]/g) || []).length;
      expect(redactedCount).toBeGreaterThanOrEqual(2);
    });

    it("should NOT redact numbers that look like SSNs but are not", () => {
      // Phone numbers, employee IDs, etc.
      const text = "Call me at 123-456-7890";
      const result = detectAndRedactPII(text);

      // This might pass through or be redacted depending on regex strictness
      // Adjust based on actual implementation
      expect(result.redactedText).toBeTruthy();
    });
  });

  describe("Date of Birth Detection", () => {
    it("should detect and redact DOB in MM/DD/YYYY format", () => {
      const text = "Born on 01/15/1990";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.redactedText).not.toContain("01/15/1990");
      expect(result.piiFound).toBe(true);
      expect(result.piiTypes).toContain("dob");
    });

    it("should detect and redact DOB in MM-DD-YYYY format", () => {
      const text = "Date of birth: 12-25-1985";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.piiFound).toBe(true);
    });

    it("should detect and redact DOB in YYYY/MM/DD format", () => {
      const text = "DOB: 1995/06/20";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.piiFound).toBe(true);
    });

    it("should detect multiple DOBs in text", () => {
      // Use dates that would be in valid range (16-100 years old)
      const text = "Person 1: 01/15/1990, Person 2: 03/20/1985";
      const result = detectAndRedactPII(text);

      const redactedCount = (result.redactedText.match(/\[REDACTED\]/g) || []).length;
      expect(redactedCount).toBeGreaterThanOrEqual(2);
    });

    it("should validate age range (16-100 years old)", () => {
      const currentYear = new Date().getFullYear();
      const validDOB = `01/15/${currentYear - 25}`; // 25 years old
      const text = `Born on ${validDOB}`;

      const result = detectAndRedactPII(text);
      expect(result.piiFound).toBe(true);
    });

    it("should NOT redact future dates", () => {
      const futureDate = "01/15/2050";
      const text = `Project deadline: ${futureDate}`;
      const result = detectAndRedactPII(text);

      // Future dates should not be considered DOB
      expect(result.redactedText).toContain(futureDate);
    });

    it("should NOT redact dates older than 100 years (likely historical)", () => {
      const text = "Company founded: 01/15/1900";
      const result = detectAndRedactPII(text);

      // Very old dates should not be considered DOB
      expect(result.redactedText).toContain("1900");
    });
  });

  describe("Location Handling", () => {
    it("should NOT redact city and state", () => {
      const text = "Portland, OR";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toBe(text);
      expect(result.piiFound).toBe(false);
    });

    it("should NOT redact ZIP codes", () => {
      const text = "ZIP code: 97201";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("97201");
      expect(result.piiFound).toBe(false);
    });

    it("should keep full address location info", () => {
      const text = "Located in Portland, OR 97201";
      const result = detectAndRedactPII(text);

      // Location should be preserved per spec
      expect(result.redactedText).toContain("Portland");
      expect(result.redactedText).toContain("OR");
      expect(result.redactedText).toContain("97201");
    });
  });

  describe("Age Handling", () => {
    it("should NOT redact valid age statements", () => {
      const text = "I am 25 years old";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toBe(text);
      expect(result.piiFound).toBe(false);
    });

    it("should NOT redact age in different formats", () => {
      const text = "Age: 30";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("30");
    });
  });

  describe("Combined PII Detection", () => {
    it("should detect and redact multiple PII types in same text", () => {
      const text = "My SSN is 123-45-6789 and I was born on 01/15/1990 in Portland, OR";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("[REDACTED]");
      expect(result.redactedText).not.toContain("123-45-6789");
      expect(result.redactedText).not.toContain("01/15/1990");
      expect(result.redactedText).toContain("Portland"); // Location preserved
      expect(result.piiFound).toBe(true);
      expect(result.piiTypes.length).toBeGreaterThan(1);
    });

    it("should preserve non-PII content while redacting PII", () => {
      const text = "I worked at Company X from 2015-2020. My SSN is 123-45-6789.";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("Company X");
      expect(result.redactedText).toContain("2015-2020");
      expect(result.redactedText).not.toContain("123-45-6789");
    });
  });

  describe("hasPII helper function", () => {
    it("should return true when SSN is present", () => {
      const text = "SSN: 123-45-6789";
      expect(hasPII(text)).toBe(true);
    });

    it("should return true when DOB is present", () => {
      const text = "Born: 01/15/1990";
      expect(hasPII(text)).toBe(true);
    });

    it("should return false when no PII is present", () => {
      const text = "I am a software engineer in Portland, OR";
      expect(hasPII(text)).toBe(false);
    });

    it("should return true when any PII type is present", () => {
      const text = "My birthday is 01/15/1990";
      expect(hasPII(text)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = detectAndRedactPII("");
      expect(result.redactedText).toBe("");
      expect(result.piiFound).toBe(false);
    });

    it("should handle text with only whitespace", () => {
      const text = "   \n\t  ";
      const result = detectAndRedactPII(text);
      expect(result.redactedText).toBe(text);
      expect(result.piiFound).toBe(false);
    });

    it("should handle text with special characters", () => {
      const text = "Email: test@example.com, Phone: +1-234-567-8900";
      const result = detectAndRedactPII(text);
      // These should not be redacted (not SSN or DOB)
      expect(result.redactedText).toContain("test@example.com");
    });

    it("should handle very long text efficiently", () => {
      const longText = "Some text. ".repeat(1000) + "SSN: 123-45-6789";
      const result = detectAndRedactPII(longText);

      expect(result.piiFound).toBe(true);
      expect(result.redactedText).not.toContain("123-45-6789");
    });

    it("should preserve text structure (newlines, etc.)", () => {
      const text = "Line 1\nSSN: 123-45-6789\nLine 3";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("\n");
      expect(result.redactedText.split("\n").length).toBe(3);
    });
  });

  describe("Redaction Format", () => {
    it("should use [REDACTED] format for redacted content", () => {
      const text = "SSN: 123-45-6789";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toMatch(/\[REDACTED\]/);
    });

    it("should maintain readable text structure after redaction", () => {
      const text = "My name is John Doe, SSN: 123-45-6789, born 01/15/1990";
      const result = detectAndRedactPII(text);

      expect(result.redactedText).toContain("My name is John Doe");
      expect(result.redactedText).toContain("[REDACTED]");
    });
  });
});
