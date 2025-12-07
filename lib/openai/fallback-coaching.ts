import type { CoachingResponse } from "@/types/models";

export function fallbackCoaching(question: string, answer: string): CoachingResponse {
  const baseScore = 4;
  const narrative = `For "${question}", strengthen your ACTION and RESULT details. You said: "${answer.slice(0, 120)}${answer.length > 120 ? "..." : ""}". Add specifics about what you did and the measurable outcome.`;
  return {
    star_scores: { situation: baseScore, task: baseScore, action: baseScore, result: baseScore },
    specificity_tag: "specific",
    impact_tag: "medium_impact",
    clarity_tag: "clear",
    honesty_flag: false,
    narrative,
    example_answer: `${answer}\n\nTry adding: [specific action here] and [measurable result here].`,
  };
}
