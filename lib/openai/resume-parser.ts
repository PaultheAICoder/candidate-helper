/**
 * Resume Parser Utility
 * Uses OpenAI's structured output to extract resume information
 */

import { OpenAI } from "openai";
import { trackCost, calculateGPTCost } from "@/lib/utils/cost-tracker";

type BetaChatCompletions = {
  parse: (args: unknown) => Promise<unknown>;
};

type ParsedCompletionResponse = {
  choices: Array<{
    message: { content?: string | null };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    field?: string;
    graduationYear?: string;
  }>;
  summary?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  try {
    const betaCompletions = (openai as unknown as { beta: { chat: { completions: BetaChatCompletions } } }).beta
      .chat.completions;

    // Use the beta API for structured output (parse method)
    const response = (await betaCompletions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser. Extract key information from the provided resume text.

For skills: Extract all technical and soft skills mentioned.
For experience: Extract job titles, companies, and any duration or description information.
For education: Extract degrees, institutions, fields of study, and graduation years if available.
For contact: Extract name, email, phone, and location information.

Be thorough but accurate - only extract information that is explicitly mentioned in the resume.`,
        },
        {
          role: "user",
          content: `Please parse this resume and extract structured information:\n\n${resumeText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ParsedResume",
          schema: {
            type: "object",
            properties: {
              fullName: {
                type: "string",
                description: "Candidate's full name",
              },
              email: {
                type: "string",
                description: "Contact email address",
              },
              phone: {
                type: "string",
                description: "Phone number",
              },
              location: {
                type: "string",
                description: "City, state, or country",
              },
              skills: {
                type: "array",
                items: { type: "string" },
                description: "List of technical and soft skills",
              },
              experience: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    company: { type: "string" },
                    duration: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["title", "company"],
                },
                description: "Work experience",
              },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    degree: { type: "string" },
                    institution: { type: "string" },
                    field: { type: "string" },
                    graduationYear: { type: "string" },
                  },
                  required: ["degree", "institution"],
                },
                description: "Education history",
              },
              summary: {
                type: "string",
                description: "Professional summary or objective if present",
              },
            },
            required: ["skills", "experience", "education"],
            additionalProperties: false,
          },
        },
      },
    })) as ParsedCompletionResponse;

    // Extract the parsed content
    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content) as ParsedResume;

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

    return parsed;
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw new Error("Failed to parse resume. Please check the file format and try again.");
  }
}

/**
 * Extract skills array from parsed resume for matching
 */
export function extractSkills(parsed: ParsedResume): string[] {
  const skills = new Set<string>();

  // Add explicitly listed skills
  parsed.skills.forEach((skill) => skills.add(skill.toLowerCase()));

  // Extract skills from job descriptions
  parsed.experience.forEach((exp) => {
    if (exp.description) {
      // Look for common tech skill keywords
      const techKeywords =
        /(?:javascript|typescript|python|java|c\+\+|react|node|vue|angular|aws|azure|gcp|docker|kubernetes|sql|postgresql|mongodb|git)/gi;
      const matches = exp.description.match(techKeywords);
      if (matches) {
        matches.forEach((skill) => skills.add(skill.toLowerCase()));
      }
    }
  });

  return Array.from(skills);
}

/**
 * Extract seniority level from resume experience
 */
export function extractSeniority(parsed: ParsedResume): "junior" | "mid" | "senior" | "lead" {
  const experienceYears = parsed.experience.length * 2; // Rough estimate
  const titleText = parsed.experience.map((e) => e.title.toLowerCase()).join(" ");

  if (
    titleText.includes("lead") ||
    titleText.includes("principal") ||
    titleText.includes("architect")
  ) {
    return "lead";
  }
  if (
    titleText.includes("senior") ||
    titleText.includes("sr.") ||
    experienceYears >= 8
  ) {
    return "senior";
  }
  if (titleText.includes("junior") || titleText.includes("jr.")) {
    return "junior";
  }
  if (experienceYears >= 3) {
    return "mid";
  }

  return "junior";
}
