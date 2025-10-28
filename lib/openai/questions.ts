/**
 * Tailored Question Generation Utility
 * Uses OpenAI to generate interview questions tailored to resume + job description
 */

import { OpenAI } from "openai";
import { trackCost, calculateGPTCost } from "@/lib/utils/cost-tracker";

interface GeneratedQuestion {
  text: string;
  category: string;
  isTailored: boolean;
  context?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTailoredQuestions(
  resumeText: string,
  jobDescriptionText: string,
  count: number = 6
): Promise<GeneratedQuestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Generate behavioral and technical interview questions that are specifically tailored to the candidate's background and the job they're applying for.

Focus on:
1. Specific technologies, frameworks, or languages mentioned in both resume and job description
2. Real-world scenarios that match the job requirements
3. Soft skills that are critical for the role
4. Technical depth appropriate to their seniority level

Return questions that would help assess whether the candidate is a good fit for THIS specific role.`,
        },
        {
          role: "user",
          content: `Generate ${count} tailored interview questions for this candidate and position.

CANDIDATE'S RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescriptionText}

Return a JSON array of questions with this structure:
[
  {
    "text": "specific question text",
    "category": "technical|behavioral|situational",
    "context": "why this question matches their background"
  }
]

Only return the JSON array, no other text.`,
        },
      ],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Parse the response
    const questions = JSON.parse(content);

    // Track cost
    if (response.usage) {
      const estimatedCost = calculateGPTCost("gpt-4o", {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
      });

      await trackCost({
        model: "gpt-4o",
        tokensUsed: response.usage.total_tokens,
        estimatedCostUsd: estimatedCost,
      });
    }

    // Validate and format questions
    return questions.map(
      (q: Record<string, unknown>) =>
        ({
          text: String(q.text || ""),
          category: String(q.category || "behavioral"),
          isTailored: true,
          context: q.context ? String(q.context) : undefined,
        } as GeneratedQuestion)
    );
  } catch (error) {
    console.error("Tailored question generation error:", error);
    throw new Error("Failed to generate tailored questions from resume and job description");
  }
}

/**
 * Mix tailored questions with generic soft-skill questions
 */
export function mixQuestions(
  tailoredQuestions: GeneratedQuestion[],
  genericQuestions: GeneratedQuestion[],
  tailoredCount: number = 6,
  softSkillCount: number = 2
): GeneratedQuestion[] {
  const result: GeneratedQuestion[] = [];

  // Add tailored questions
  result.push(...tailoredQuestions.slice(0, tailoredCount));

  // Add generic soft-skill questions
  const softSkills = genericQuestions.filter((q) => q.category === "behavioral");
  result.push(...softSkills.slice(0, softSkillCount));

  return result.slice(0, tailoredCount + softSkillCount);
}

/**
 * Get generic soft-skill questions (from database seed)
 */
export function getGenericQuestions(): GeneratedQuestion[] {
  return [
    {
      text: "Tell me about a time when you had to deal with a conflict with a colleague. How did you handle it?",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "Describe a situation where you took ownership of a project. What was the outcome?",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "Tell me about a time when you failed. What did you learn from it?",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "How do you handle working with people who have different work styles?",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "Describe a situation where you had to meet a tight deadline.",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "Tell me about your experience working in a team environment.",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "How do you stay motivated during challenging projects?",
      category: "behavioral",
      isTailored: false,
    },
    {
      text: "Describe a time when you had to learn something new quickly.",
      category: "behavioral",
      isTailored: false,
    },
  ];
}
