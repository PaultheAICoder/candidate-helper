/**
 * Validation Schemas (Zod)
 * For API request validation and form validation
 */

import { z } from "zod";

// ============================================================================
// SESSION VALIDATION
// ============================================================================

export const createSessionSchema = z.object({
  mode: z.enum(["audio", "text"]),
  questionCount: z.number().int().min(3).max(10),
  lowAnxietyEnabled: z.boolean().optional().default(false),
  perQuestionCoaching: z.boolean().optional().default(false),
  jobDescriptionText: z.string().optional(),
  targetRoleOverride: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ============================================================================
// ANSWER VALIDATION
// ============================================================================

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  transcriptText: z.string().min(10).max(5000),
  durationSeconds: z.number().int().min(1).max(210).optional(),
  retakeUsed: z.boolean().optional().default(false),
  extensionUsed: z.boolean().optional().default(false),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

// ============================================================================
// RESUME UPLOAD VALIDATION
// ============================================================================

export const resumeUploadSchema = z.object({
  file: z.instanceof(File),
  recaptchaToken: z.string().optional(),
});

export const MAX_RESUME_SIZE = 3 * 1024 * 1024; // 3MB
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "text/plain",
  "text/markdown",
];

export function validateResumeFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_RESUME_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 3MB limit",
    };
  }

  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload PDF, DOCX, TXT, or MD",
    };
  }

  // Block .pages files by extension
  if (file.name.endsWith(".pages")) {
    return {
      valid: false,
      error: "Please export your .pages file to PDF and upload again",
    };
  }

  return { valid: true };
}

// ============================================================================
// JOB DESCRIPTION VALIDATION
// ============================================================================

export const jobDescriptionSchema = z.object({
  text: z.string().min(50).max(10000),
});

export type JobDescriptionInput = z.infer<typeof jobDescriptionSchema>;

// ============================================================================
// USER PROFILE VALIDATION
// ============================================================================

export const updateProfileSchema = z.object({
  targetRoles: z.array(z.string()).max(5).optional(),
  seniorityLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).optional(),
  workAuthStatus: z.string().optional(),
  compRangeMin: z.number().int().min(0).optional(),
  compRangeMax: z.number().int().min(0).optional(),
  remotePreference: z.enum(["remote", "hybrid", "onsite", "flexible"]).optional(),
  location: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// ELIGIBILITY VALIDATION
// ============================================================================

export const eligibilitySchema = z.object({
  ageConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must be 18 or older to use this service",
  }),
  locationConfirmed: z.boolean().refine((val) => val === true, {
    message: "This service is currently only available in the United States",
  }),
});

export type EligibilityInput = z.infer<typeof eligibilitySchema>;

// ============================================================================
// CONSENT VALIDATION
// ============================================================================

export const consentSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service",
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Privacy Policy",
  }),
});

export type ConsentInput = z.infer<typeof consentSchema>;

// ============================================================================
// JOB DIGEST VALIDATION
// ============================================================================

export const digestOptInSchema = z.object({
  email: z.string().email(),
});

export type DigestOptInInput = z.infer<typeof digestOptInSchema>;

// ============================================================================
// SURVEY VALIDATION
// ============================================================================

export const surveyResponseSchema = z.object({
  sessionId: z.string().uuid(),
  helpfulness: z.enum(["like", "neutral", "dislike"]),
  adviceQuality: z.enum(["like", "neutral", "dislike"]),
  preparedness: z.enum(["like", "neutral", "dislike"]),
  lowAnxietyFeedback: z.string().max(1000).optional(),
});

export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;

// ============================================================================
// ADMIN VALIDATION
// ============================================================================

export const adminSessionFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  mode: z.enum(["audio", "text"]).optional(),
  minScore: z.number().min(1).max(5).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AdminSessionFiltersInput = z.infer<typeof adminSessionFiltersSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      error: "Invalid JSON body",
    };
  }
}
