/**
 * Domain Model Types
 * Application-level types for business logic
 */

export type SessionMode = "audio" | "text";
export type SeniorityLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type AuthProvider = "google" | "email_magic_link";
export type RemotePreference = "remote" | "hybrid" | "onsite" | "flexible";
export type JobSource = "cinder" | "ziprecruiter" | "indeed" | "macslist";

export type QuestionCategory =
  | "tailored_technical"
  | "tailored_behavioral"
  | "soft_skills_conflict"
  | "soft_skills_leadership"
  | "soft_skills_ownership"
  | "soft_skills_collaboration"
  | "soft_skills_failure"
  | "soft_skills_communication";

export type SpecificityTag = "specific" | "vague" | "unclear";
export type ImpactTag = "high_impact" | "medium_impact" | "low_impact";
export type ClarityTag = "clear" | "rambling" | "incomplete";

export type EventType =
  | "session_start"
  | "mic_check_passed"
  | "q_answered"
  | "coaching_viewed"
  | "survey_submitted"
  | "share_link_clicked"
  | "digest_opt_in";

// STAR Framework Scores
export interface STARScores {
  situation: number; // 1-5
  task: number; // 1-5
  action: number; // 1-5
  result: number; // 1-5
}

// Report Structures (from JSONB fields)
export interface Strength {
  text: string;
  evidence: string;
}

export interface Clarification {
  suggestion: string;
  rationale: string;
}

export interface PerQuestionFeedback {
  question_id: string;
  narrative: string;
  example_answer: string;
}

export interface MatchScores {
  total: number; // 0-100
  hardSkills: number; // 0-50
  softSkills: number; // 0-20
  seniority: number; // 0-20
  logistics: number; // 0-10
}

// Session Draft Save Structure
export interface SessionDraft {
  currentQuestionIndex: number;
  answersSubmitted: number;
  lastSaved: string;
  answers: Array<{
    questionId: string;
    text: string;
  }>;
}

// OpenAI Response Types
export interface CoachingResponse {
  star_scores: STARScores;
  specificity_tag: SpecificityTag;
  impact_tag: ImpactTag;
  clarity_tag: ClarityTag;
  honesty_flag: boolean;
  narrative: string;
  example_answer: string;
}

export interface QuestionGenerationResponse {
  questions: Array<{
    text: string;
    category: QuestionCategory;
  }>;
}

export interface ResumeParseResponse {
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

// Job Match Response
export interface JobMatchResponse {
  jobId: string;
  scores: MatchScores;
  reasons: string[];
}
