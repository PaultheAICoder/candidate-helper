/**
 * OpenAI Response Types
 * For structured outputs from OpenAI API
 */

import type { STARScores, QuestionCategory } from "./models";

// ============================================================================
// COACHING RESPONSE
// ============================================================================

export interface OpenAICoachingResponse {
  star_scores: STARScores;
  specificity_tag: "specific" | "vague" | "unclear";
  impact_tag: "high_impact" | "medium_impact" | "low_impact";
  clarity_tag: "clear" | "rambling" | "incomplete";
  honesty_flag: boolean;
  narrative: string;
  example_answer: string;
  follow_up_question?: string;
}

// ============================================================================
// QUESTION GENERATION RESPONSE
// ============================================================================

export interface OpenAIQuestionResponse {
  questions: Array<{
    text: string;
    category: QuestionCategory;
  }>;
}

// ============================================================================
// RESUME PARSING RESPONSE
// ============================================================================

export interface OpenAIResumeParseResponse {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

// ============================================================================
// REPORT GENERATION RESPONSE
// ============================================================================

export interface OpenAIReportResponse {
  strengths: Array<{
    text: string;
    evidence: string;
  }>;
  clarifications: Array<{
    suggestion: string;
    rationale: string;
  }>;
  per_question_feedback: Array<{
    question_id: string;
    narrative: string;
    example_answer: string;
  }>;
}

// ============================================================================
// JOB PARSING RESPONSE
// ============================================================================

export interface OpenAIJobParseResponse {
  title: string;
  company: string;
  skills: string[];
  must_have_skills: string[];
  seniority_level: "entry" | "mid" | "senior" | "lead" | "executive";
  location: string;
  posting_url: string;
}
