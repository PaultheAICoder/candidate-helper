import { QUESTION_BANK, getRandomQuestions } from "../question-bank";

describe("Question Bank", () => {
  describe("QUESTION_BANK constant", () => {
    it("should have at least 18 questions", () => {
      expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(18);
    });

    it("should have questions across all required categories", () => {
      const categories = QUESTION_BANK.map((q) => q.category);
      const uniqueCategories = new Set(categories);

      expect(uniqueCategories.has("soft_skills_conflict")).toBe(true);
      expect(uniqueCategories.has("soft_skills_leadership")).toBe(true);
      expect(uniqueCategories.has("soft_skills_ownership")).toBe(true);
      expect(uniqueCategories.has("soft_skills_collaboration")).toBe(true);
      expect(uniqueCategories.has("soft_skills_failure")).toBe(true);
      expect(uniqueCategories.has("soft_skills_communication")).toBe(true);
    });

    it("should have all questions with required fields", () => {
      QUESTION_BANK.forEach((question) => {
        expect(question.text).toBeTruthy();
        expect(typeof question.text).toBe("string");
        expect(question.text.length).toBeGreaterThan(0);

        expect(question.category).toBeTruthy();
        expect(typeof question.category).toBe("string");

        expect(typeof question.isGentle).toBe("boolean");
      });
    });

    it("should have at least some gentle questions for low-anxiety mode", () => {
      const gentleQuestions = QUESTION_BANK.filter((q) => q.isGentle);
      expect(gentleQuestions.length).toBeGreaterThan(0);
    });

    it("should have at least 3 gentle questions (minimum for low-anxiety mode)", () => {
      const gentleQuestions = QUESTION_BANK.filter((q) => q.isGentle);
      expect(gentleQuestions.length).toBeGreaterThanOrEqual(3);
    });

    it("should have question text in proper format (question-like)", () => {
      QUESTION_BANK.forEach((question) => {
        // Most questions should either start with common question words or contain question marks
        const lowerText = question.text.toLowerCase();
        const startsWithQuestionWord =
          lowerText.startsWith("tell me") ||
          lowerText.startsWith("describe") ||
          lowerText.startsWith("give me") ||
          lowerText.startsWith("what") ||
          lowerText.startsWith("how") ||
          lowerText.startsWith("when") ||
          lowerText.startsWith("why") ||
          lowerText.startsWith("can you");

        const hasQuestionMark = question.text.includes("?");

        expect(startsWithQuestionWord || hasQuestionMark).toBe(true);
      });
    });
  });

  describe("getRandomQuestions", () => {
    it("should return requested number of questions", () => {
      const questions = getRandomQuestions(5, false);
      expect(questions.length).toBe(5);
    });

    it("should return maximum 3 questions in low-anxiety mode", () => {
      const questions = getRandomQuestions(3, true);
      expect(questions.length).toBe(3);
    });

    it("should return all gentle questions in low-anxiety mode", () => {
      const questions = getRandomQuestions(3, true);
      expect(questions.every((q) => q.isGentle)).toBe(true);
    });

    it("should return non-duplicate questions", () => {
      const questions = getRandomQuestions(10, false);
      const texts = questions.map((q) => q.text);
      const uniqueTexts = new Set(texts);

      expect(texts.length).toBe(uniqueTexts.size);
    });

    it("should handle request for 10 questions", () => {
      const questions = getRandomQuestions(10, false);
      expect(questions.length).toBe(10);
    });

    it("should handle request for minimum 3 questions", () => {
      const questions = getRandomQuestions(3, false);
      expect(questions.length).toBe(3);
    });

    it("should return different questions on multiple calls (randomness)", () => {
      const questions1 = getRandomQuestions(8, false);
      const questions2 = getRandomQuestions(8, false);

      const texts1 = questions1.map((q) => q.text).sort();
      const texts2 = questions2.map((q) => q.text).sort();

      // With randomization, it's very unlikely the order is exactly the same
      // We test if at least one position differs
      const allSame = texts1.every((text, index) => text === texts2[index]);
      expect(allSame).toBe(false);
    });

    it("should maintain question structure in returned objects", () => {
      const questions = getRandomQuestions(5, false);

      questions.forEach((question) => {
        expect(question).toHaveProperty("text");
        expect(question).toHaveProperty("category");
        expect(question).toHaveProperty("isGentle");
        expect(typeof question.text).toBe("string");
        expect(typeof question.category).toBe("string");
        expect(typeof question.isGentle).toBe("boolean");
      });
    });

    it("should return mix of categories when not in low-anxiety mode", () => {
      const questions = getRandomQuestions(8, false);
      const categories = new Set(questions.map((q) => q.category));

      // With 8 questions and 6 categories, we should have some variety
      // This is probabilistic but very likely to pass
      expect(categories.size).toBeGreaterThan(1);
    });

    it("should handle edge case of requesting exactly available gentle questions", () => {
      const gentleCount = QUESTION_BANK.filter((q) => q.isGentle).length;
      const questions = getRandomQuestions(gentleCount, true);

      expect(questions.length).toBe(gentleCount);
      expect(questions.every((q) => q.isGentle)).toBe(true);
    });

    it("should cap at available questions if request exceeds bank size", () => {
      const totalQuestions = QUESTION_BANK.length;
      const questions = getRandomQuestions(totalQuestions + 5, false);

      // Should return at most the total number of questions available
      expect(questions.length).toBeLessThanOrEqual(totalQuestions);
    });

    it("should return empty array when requesting 0 questions", () => {
      const questions = getRandomQuestions(0, false);
      expect(questions.length).toBe(0);
    });

    it("should handle negative count gracefully", () => {
      const questions = getRandomQuestions(-5, false);
      expect(questions.length).toBe(0);
    });
  });
});
