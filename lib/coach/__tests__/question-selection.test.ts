import { prepareQuestions } from "@/lib/coach/question-selection";
import { QUESTION_BANK } from "@/lib/data/question-bank";

describe("prepareQuestions", () => {
  it("returns the requested number of questions", () => {
    const result = prepareQuestions(5, false);
    expect(result).toHaveLength(5);
  });

  it("uses gentle questions when low-anxiety is enabled", () => {
    const gentleCount = QUESTION_BANK.filter((q) => q.isGentle).length;
    const requested = Math.min(4, gentleCount);
    const result = prepareQuestions(requested, true);
    expect(result.every((q) => q.is_gentle)).toBe(true);
  });

  it("maintains question order starting at 1", () => {
    const result = prepareQuestions(3, false);
    expect(result.map((q) => q.question_order)).toEqual([1, 2, 3]);
  });
});
