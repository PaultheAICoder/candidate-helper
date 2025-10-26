import { createSessionSchema, submitAnswerSchema } from "../validators";

describe("Zod Validators", () => {
  describe("createSessionSchema", () => {
    it("should accept valid session data with text mode", () => {
      const valid = {
        mode: "text",
        questionCount: 8,
        lowAnxietyEnabled: false,
      };
      const result = createSessionSchema.parse(valid);
      expect(result.mode).toBe("text");
      expect(result.questionCount).toBe(8);
      expect(result.lowAnxietyEnabled).toBe(false);
      expect(result.perQuestionCoaching).toBe(false); // default value
    });

    it("should accept valid session data with audio mode", () => {
      const valid = {
        mode: "audio",
        questionCount: 5,
        lowAnxietyEnabled: true,
      };
      const result = createSessionSchema.parse(valid);
      expect(result.mode).toBe("audio");
      expect(result.questionCount).toBe(5);
      expect(result.lowAnxietyEnabled).toBe(true);
      expect(result.perQuestionCoaching).toBe(false); // default value
    });

    it("should accept question count of 3 (minimum)", () => {
      const valid = {
        mode: "text",
        questionCount: 3,
      };
      expect(() => createSessionSchema.parse(valid)).not.toThrow();
    });

    it("should accept question count of 10 (maximum)", () => {
      const valid = {
        mode: "text",
        questionCount: 10,
      };
      expect(() => createSessionSchema.parse(valid)).not.toThrow();
    });

    it("should reject question count < 3", () => {
      expect(() =>
        createSessionSchema.parse({
          mode: "text",
          questionCount: 2,
        })
      ).toThrow();
    });

    it("should reject question count > 10", () => {
      expect(() =>
        createSessionSchema.parse({
          mode: "text",
          questionCount: 11,
        })
      ).toThrow();
    });

    it("should reject invalid mode", () => {
      expect(() =>
        createSessionSchema.parse({
          mode: "video",
          questionCount: 5,
        })
      ).toThrow();
    });

    it("should use default lowAnxietyEnabled=false when not provided", () => {
      const result = createSessionSchema.parse({
        mode: "text",
        questionCount: 8,
      });
      expect(result.lowAnxietyEnabled).toBe(false);
    });
  });

  describe("submitAnswerSchema", () => {
    it("should accept valid answer submission", () => {
      const valid = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        transcriptText: "This is my answer with enough characters to pass validation.",
      };
      const result = submitAnswerSchema.parse(valid);
      expect(result.questionId).toBe(valid.questionId);
      expect(result.transcriptText).toBe(valid.transcriptText);
      expect(result.retakeUsed).toBe(false); // default
      expect(result.extensionUsed).toBe(false); // default
    });

    it("should accept answer with exactly 10 characters (minimum)", () => {
      const valid = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        transcriptText: "1234567890", // exactly 10
      };
      expect(() => submitAnswerSchema.parse(valid)).not.toThrow();
    });

    it("should accept answer with 5000 characters (maximum)", () => {
      const longText = "a".repeat(5000);
      const valid = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        transcriptText: longText,
      };
      expect(() => submitAnswerSchema.parse(valid)).not.toThrow();
    });

    it("should reject answer < 10 characters", () => {
      expect(() =>
        submitAnswerSchema.parse({
          questionId: "123e4567-e89b-12d3-a456-426614174001",
          transcriptText: "Short",
        })
      ).toThrow();
    });

    it("should reject answer > 5000 characters", () => {
      const longText = "a".repeat(5001);
      expect(() =>
        submitAnswerSchema.parse({
          questionId: "123e4567-e89b-12d3-a456-426614174001",
          transcriptText: longText,
        })
      ).toThrow();
    });

    it("should reject invalid UUID format for questionId", () => {
      expect(() =>
        submitAnswerSchema.parse({
          questionId: "invalid",
          transcriptText: "Valid answer text here",
        })
      ).toThrow();
    });

    it("should reject missing transcriptText", () => {
      expect(() =>
        submitAnswerSchema.parse({
          questionId: "123e4567-e89b-12d3-a456-426614174001",
        })
      ).toThrow();
    });
  });
});
