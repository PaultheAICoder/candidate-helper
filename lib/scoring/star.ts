/**
 * STAR Framework Scoring Utility
 * Parses OpenAI responses for Situation/Task/Action/Result scores (1-5 each)
 * and extracts specificity/impact/clarity tags
 */

import type {
  STARScores,
  SpecificityTag,
  ImpactTag,
  ClarityTag,
  CoachingResponse,
} from "@/types/models";

/**
 * Validate STAR score (must be 1-5)
 */
function validateScore(score: number): number {
  if (score < 1) return 1;
  if (score > 5) return 5;
  return Math.round(score);
}

/**
 * Parse OpenAI coaching response and extract STAR scores
 */
export function parseSTARScores(coachingResponse: CoachingResponse): {
  scores: STARScores;
  specificityTag: SpecificityTag;
  impactTag: ImpactTag;
  clarityTag: ClarityTag;
  honestyFlag: boolean;
} {
  return {
    scores: {
      situation: validateScore(coachingResponse.star_scores.situation),
      task: validateScore(coachingResponse.star_scores.task),
      action: validateScore(coachingResponse.star_scores.action),
      result: validateScore(coachingResponse.star_scores.result),
    },
    specificityTag: coachingResponse.specificity_tag,
    impactTag: coachingResponse.impact_tag,
    clarityTag: coachingResponse.clarity_tag,
    honestyFlag: coachingResponse.honesty_flag,
  };
}

/**
 * Calculate average STAR score across all elements
 */
export function calculateAverageSTAR(scores: STARScores): number {
  const total = scores.situation + scores.task + scores.action + scores.result;
  return Number((total / 4).toFixed(2));
}

/**
 * Determine if STAR elements are missing (score < 3)
 */
export function getMissingSTARElements(scores: STARScores): string[] {
  const missing: string[] = [];

  if (scores.situation < 3) missing.push("Situation");
  if (scores.task < 3) missing.push("Task");
  if (scores.action < 3) missing.push("Action");
  if (scores.result < 3) missing.push("Result");

  return missing;
}

/**
 * Get qualitative description for score
 */
export function getScoreDescription(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Strong";
  if (score >= 2.5) return "Adequate";
  if (score >= 1.5) return "Needs Improvement";
  return "Missing";
}

/**
 * Get tag display text with color indicator
 */
export function getTagDisplay(
  tag: SpecificityTag | ImpactTag | ClarityTag,
  _type: "specificity" | "impact" | "clarity"
): {
  text: string;
  color: "success" | "warning" | "error";
} {
  const displays: Record<string, { text: string; color: "success" | "warning" | "error" }> = {
    // Specificity
    specific: { text: "Specific", color: "success" },
    vague: { text: "Vague", color: "warning" },
    unclear: { text: "Unclear", color: "error" },

    // Impact
    high_impact: { text: "High Impact", color: "success" },
    medium_impact: { text: "Medium Impact", color: "warning" },
    low_impact: { text: "Low Impact", color: "error" },

    // Clarity
    clear: { text: "Clear", color: "success" },
    rambling: { text: "Rambling", color: "warning" },
    incomplete: { text: "Incomplete", color: "error" },
  };

  return displays[tag] || { text: tag, color: "warning" };
}

/**
 * Generate follow-up question if STAR elements are missing
 * (Only used when low_anxiety_enabled = false)
 */
export function generateFollowUpQuestion(
  missingElements: string[],
  _questionText: string
): string | null {
  if (missingElements.length === 0) return null;

  const element = missingElements[0].toLowerCase();

  const followUpTemplates: Record<string, string> = {
    situation: `Can you provide more context about the situation? What was happening at the time?`,
    task: `What was your specific responsibility or goal in this situation?`,
    action: `Can you walk me through the specific steps you took?`,
    result: `What was the outcome? Can you quantify the impact if possible?`,
  };

  return followUpTemplates[element] || null;
}

/**
 * Check if answer meets performance threshold for recruiter access
 * (avg STAR score >= 4.2)
 */
export function meetsRecruitingThreshold(scores: STARScores, completionRate: number): boolean {
  const avgScore = calculateAverageSTAR(scores);
  return avgScore >= 4.2 && completionRate >= 0.7;
}

/**
 * Format STAR scores for database storage
 */
export function formatScoresForDB(scores: STARScores): {
  star_situation_score: number;
  star_task_score: number;
  star_action_score: number;
  star_result_score: number;
} {
  return {
    star_situation_score: scores.situation,
    star_task_score: scores.task,
    star_action_score: scores.action,
    star_result_score: scores.result,
  };
}
