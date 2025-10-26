import {
  parseSTARScores,
  calculateAverageSTAR,
  getMissingSTARElements,
  getScoreDescription,
  getTagDisplay,
  generateFollowUpQuestion,
  meetsRecruitingThreshold,
  formatScoresForDB,
} from "../star";
import type { CoachingResponse } from "@/types/models";

describe("STAR Scoring Utilities", () => {
  const mockCoachingResponse: CoachingResponse = {
    star_scores: { situation: 4, task: 3, action: 5, result: 4 },
    specificity_tag: "specific",
    impact_tag: "high_impact",
    clarity_tag: "clear",
    honesty_flag: false,
    narrative: "Great answer! You demonstrated clear leadership.",
    example_answer: "In my role as Team Lead at Company X, I faced...",
  };

  describe("parseSTARScores", () => {
    it("should parse valid coaching response correctly", () => {
      const result = parseSTARScores(mockCoachingResponse);

      expect(result.scores.situation).toBe(4);
      expect(result.scores.task).toBe(3);
      expect(result.scores.action).toBe(5);
      expect(result.scores.result).toBe(4);
      expect(result.specificityTag).toBe("specific");
      expect(result.impactTag).toBe("high_impact");
      expect(result.clarityTag).toBe("clear");
      expect(result.honestyFlag).toBe(false);
    });

    it("should clamp scores above 5 to 5", () => {
      const invalidResponse: CoachingResponse = {
        ...mockCoachingResponse,
        star_scores: { situation: 6, task: 7, action: 5, result: 4 },
      };

      const result = parseSTARScores(invalidResponse);
      expect(result.scores.situation).toBe(5);
      expect(result.scores.task).toBe(5);
    });

    it("should clamp scores below 1 to 1", () => {
      const invalidResponse: CoachingResponse = {
        ...mockCoachingResponse,
        star_scores: { situation: 0, task: -1, action: 3, result: 2 },
      };

      const result = parseSTARScores(invalidResponse);
      expect(result.scores.situation).toBe(1);
      expect(result.scores.task).toBe(1);
    });

    it("should round fractional scores to nearest integer", () => {
      const fractionalResponse: CoachingResponse = {
        ...mockCoachingResponse,
        star_scores: { situation: 3.4, task: 3.6, action: 4.5, result: 2.2 },
      };

      const result = parseSTARScores(fractionalResponse);
      expect(result.scores.situation).toBe(3);
      expect(result.scores.task).toBe(4);
      expect(result.scores.action).toBe(5);
      expect(result.scores.result).toBe(2);
    });
  });

  describe("calculateAverageSTAR", () => {
    it("should calculate correct average for whole numbers", () => {
      const scores = { situation: 4, task: 4, action: 4, result: 4 };
      expect(calculateAverageSTAR(scores)).toBe(4.0);
    });

    it("should calculate correct average with mixed scores", () => {
      const scores = { situation: 4, task: 3, action: 5, result: 4 };
      expect(calculateAverageSTAR(scores)).toBe(4.0);
    });

    it("should round to 2 decimal places", () => {
      const scores = { situation: 3, task: 3, action: 4, result: 3 };
      expect(calculateAverageSTAR(scores)).toBe(3.25);
    });

    it("should handle minimum scores", () => {
      const scores = { situation: 1, task: 1, action: 1, result: 1 };
      expect(calculateAverageSTAR(scores)).toBe(1.0);
    });

    it("should handle maximum scores", () => {
      const scores = { situation: 5, task: 5, action: 5, result: 5 };
      expect(calculateAverageSTAR(scores)).toBe(5.0);
    });

    it("should handle uneven averages correctly", () => {
      const scores = { situation: 2, task: 3, action: 4, result: 5 };
      expect(calculateAverageSTAR(scores)).toBe(3.5);
    });
  });

  describe("getMissingSTARElements", () => {
    it("should identify missing elements when scores < 3", () => {
      const scores = { situation: 2, task: 4, action: 1, result: 3 };
      const missing = getMissingSTARElements(scores);

      expect(missing).toContain("Situation");
      expect(missing).toContain("Action");
      expect(missing).not.toContain("Task");
      expect(missing).not.toContain("Result");
    });

    it("should return empty array when all elements are present (score >= 3)", () => {
      const scores = { situation: 4, task: 4, action: 5, result: 3 };
      const missing = getMissingSTARElements(scores);

      expect(missing).toEqual([]);
    });

    it("should identify all elements missing when all scores < 3", () => {
      const scores = { situation: 1, task: 2, action: 2, result: 1 };
      const missing = getMissingSTARElements(scores);

      expect(missing).toHaveLength(4);
      expect(missing).toContain("Situation");
      expect(missing).toContain("Task");
      expect(missing).toContain("Action");
      expect(missing).toContain("Result");
    });

    it("should handle edge case of score exactly 3", () => {
      const scores = { situation: 3, task: 3, action: 3, result: 3 };
      const missing = getMissingSTARElements(scores);

      expect(missing).toEqual([]);
    });

    it("should handle edge case of score just below threshold", () => {
      const scores = { situation: 2, task: 2, action: 2, result: 2 };
      const missing = getMissingSTARElements(scores);

      expect(missing).toHaveLength(4);
    });
  });

  describe("getScoreDescription", () => {
    it('should return "Excellent" for score >= 4.5', () => {
      expect(getScoreDescription(4.5)).toBe("Excellent");
      expect(getScoreDescription(5.0)).toBe("Excellent");
      expect(getScoreDescription(4.8)).toBe("Excellent");
    });

    it('should return "Strong" for score 3.5-4.4', () => {
      expect(getScoreDescription(3.5)).toBe("Strong");
      expect(getScoreDescription(4.0)).toBe("Strong");
      expect(getScoreDescription(4.4)).toBe("Strong");
    });

    it('should return "Adequate" for score 2.5-3.4', () => {
      expect(getScoreDescription(2.5)).toBe("Adequate");
      expect(getScoreDescription(3.0)).toBe("Adequate");
      expect(getScoreDescription(3.4)).toBe("Adequate");
    });

    it('should return "Needs Improvement" for score 1.5-2.4', () => {
      expect(getScoreDescription(1.5)).toBe("Needs Improvement");
      expect(getScoreDescription(2.0)).toBe("Needs Improvement");
      expect(getScoreDescription(2.4)).toBe("Needs Improvement");
    });

    it('should return "Missing" for score < 1.5', () => {
      expect(getScoreDescription(1.0)).toBe("Missing");
      expect(getScoreDescription(1.4)).toBe("Missing");
      expect(getScoreDescription(0.5)).toBe("Missing");
    });
  });

  describe("getTagDisplay", () => {
    it("should display specificity tags correctly", () => {
      expect(getTagDisplay("specific", "specificity")).toEqual({
        text: "Specific",
        color: "success",
      });

      expect(getTagDisplay("vague", "specificity")).toEqual({
        text: "Vague",
        color: "warning",
      });

      expect(getTagDisplay("unclear", "specificity")).toEqual({
        text: "Unclear",
        color: "error",
      });
    });

    it("should display impact tags correctly", () => {
      expect(getTagDisplay("high_impact", "impact")).toEqual({
        text: "High Impact",
        color: "success",
      });

      expect(getTagDisplay("medium_impact", "impact")).toEqual({
        text: "Medium Impact",
        color: "warning",
      });

      expect(getTagDisplay("low_impact", "impact")).toEqual({
        text: "Low Impact",
        color: "error",
      });
    });

    it("should display clarity tags correctly", () => {
      expect(getTagDisplay("clear", "clarity")).toEqual({
        text: "Clear",
        color: "success",
      });

      expect(getTagDisplay("rambling", "clarity")).toEqual({
        text: "Rambling",
        color: "warning",
      });

      expect(getTagDisplay("incomplete", "clarity")).toEqual({
        text: "Incomplete",
        color: "error",
      });
    });

    it("should handle unknown tags gracefully", () => {
      const result = getTagDisplay("unknown_tag" as never, "specificity");
      expect(result.text).toBe("unknown_tag");
      expect(result.color).toBe("warning");
    });
  });

  describe("generateFollowUpQuestion", () => {
    it("should return null when no elements are missing", () => {
      const question = generateFollowUpQuestion([], "Tell me about a time...");
      expect(question).toBeNull();
    });

    it("should generate situation follow-up when situation is missing", () => {
      const question = generateFollowUpQuestion(["Situation"], "Tell me about a time...");
      expect(question).toContain("situation");
      expect(question).toContain("context");
    });

    it("should generate task follow-up when task is missing", () => {
      const question = generateFollowUpQuestion(["Task"], "Tell me about a time...");
      expect(question).toContain("responsibility");
      expect(question).toContain("goal");
    });

    it("should generate action follow-up when action is missing", () => {
      const question = generateFollowUpQuestion(["Action"], "Tell me about a time...");
      expect(question).toContain("steps");
    });

    it("should generate result follow-up when result is missing", () => {
      const question = generateFollowUpQuestion(["Result"], "Tell me about a time...");
      expect(question).toContain("outcome");
    });

    it("should only return one follow-up question even when multiple elements missing", () => {
      const question = generateFollowUpQuestion(
        ["Situation", "Task", "Action"],
        "Tell me about a time..."
      );
      expect(question).toBeTruthy();
      expect(typeof question).toBe("string");
    });
  });

  describe("meetsRecruitingThreshold", () => {
    it("should return true when avg >= 4.2 and completion >= 0.7", () => {
      const scores = { situation: 4, task: 4, action: 5, result: 4 }; // avg = 4.25
      expect(meetsRecruitingThreshold(scores, 0.8)).toBe(true);
    });

    it("should return true at exact thresholds", () => {
      const scores = { situation: 4, task: 4, action: 5, result: 4 }; // avg = 4.25
      expect(meetsRecruitingThreshold(scores, 0.7)).toBe(true);
    });

    it("should return false when avg < 4.2", () => {
      const scores = { situation: 3, task: 3, action: 4, result: 3 }; // avg = 3.25
      expect(meetsRecruitingThreshold(scores, 0.8)).toBe(false);
    });

    it("should return false when completion < 0.7", () => {
      const scores = { situation: 5, task: 5, action: 5, result: 5 }; // avg = 5.0
      expect(meetsRecruitingThreshold(scores, 0.6)).toBe(false);
    });

    it("should return false when both conditions not met", () => {
      const scores = { situation: 3, task: 3, action: 3, result: 3 }; // avg = 3.0
      expect(meetsRecruitingThreshold(scores, 0.5)).toBe(false);
    });

    it("should handle perfect scores", () => {
      const scores = { situation: 5, task: 5, action: 5, result: 5 }; // avg = 5.0
      expect(meetsRecruitingThreshold(scores, 1.0)).toBe(true);
    });

    it("should handle minimum passing scores", () => {
      const scores = { situation: 4, task: 4, action: 4, result: 5 }; // avg = 4.25
      expect(meetsRecruitingThreshold(scores, 0.7)).toBe(true);
    });
  });

  describe("formatScoresForDB", () => {
    it("should format scores correctly for database storage", () => {
      const scores = { situation: 4, task: 3, action: 5, result: 4 };
      const formatted = formatScoresForDB(scores);

      expect(formatted).toEqual({
        star_situation_score: 4,
        star_task_score: 3,
        star_action_score: 5,
        star_result_score: 4,
      });
    });

    it("should handle minimum scores", () => {
      const scores = { situation: 1, task: 1, action: 1, result: 1 };
      const formatted = formatScoresForDB(scores);

      expect(formatted).toEqual({
        star_situation_score: 1,
        star_task_score: 1,
        star_action_score: 1,
        star_result_score: 1,
      });
    });

    it("should handle maximum scores", () => {
      const scores = { situation: 5, task: 5, action: 5, result: 5 };
      const formatted = formatScoresForDB(scores);

      expect(formatted).toEqual({
        star_situation_score: 5,
        star_task_score: 5,
        star_action_score: 5,
        star_result_score: 5,
      });
    });
  });
});
