/**
 * OpenAI Coaching Utility
 * GPT-4o prompts for STAR scoring, narrative feedback, and example answers
 *
 * CRITICAL: AI MUST NOT fabricate facts or invent experiences
 */

import OpenAI from "openai";
import type { CoachingResponse } from "@/types/models";
import { trackCost } from "@/lib/utils/cost-tracker";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate coaching feedback for a single answer
 * Returns STAR scores, rubric tags, narrative feedback, and example improved answer
 */
export async function generateCoaching(params: {
  questionText: string;
  answerText: string;
  category: string;
  resumeContext?: string;
  jobDescriptionContext?: string;
}): Promise<CoachingResponse> {
  const { questionText, answerText, resumeContext, jobDescriptionContext } = params;

  const systemPrompt = `You are Cindy, a supportive AI interview coach. Your role is to help job seekers improve their interview answers using the STAR framework (Situation, Task, Action, Result).

CRITICAL RULES:
1. NEVER fabricate facts, experiences, or details not mentioned in the user's answer
2. Base all feedback ONLY on what the user actually said
3. Be encouraging and supportive, never harsh or judgmental
4. Focus on constructive guidance, not criticism
5. Provide specific, actionable suggestions

Evaluate the answer on:
- STAR scores (1-5 for each element): How well did they cover Situation, Task, Action, Result?
- Specificity: Are details concrete or vague?
- Impact: Does the answer demonstrate meaningful results?
- Clarity: Is the narrative easy to follow?
- Honesty: Does anything contradict the resume/JD context (if provided)?`;

  const userPrompt = `Question: ${questionText}

User's Answer: ${answerText}

${resumeContext ? `Resume Context: ${resumeContext}` : ""}
${jobDescriptionContext ? `Job Description Context: ${jobDescriptionContext}` : ""}

Please evaluate this answer and provide:
1. STAR scores (1-5 for each: Situation, Task, Action, Result)
2. Specificity tag: "specific", "vague", or "unclear"
3. Impact tag: "high_impact", "medium_impact", or "low_impact"
4. Clarity tag: "clear", "rambling", or "incomplete"
5. Honesty flag: true if answer contradicts resume/JD, false otherwise
6. Narrative feedback (2-3 sentences): What's strong? What could be clearer?
7. Example improved answer: Rewrite the answer using ONLY facts from the original answer, filling in realistic placeholder details where STAR elements are missing (mark placeholders clearly with [specific example here])

Be supportive and encouraging. Focus on growth, not criticism.`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "coaching_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            star_scores: {
              type: "object",
              properties: {
                situation: { type: "number" },
                task: { type: "number" },
                action: { type: "number" },
                result: { type: "number" },
              },
              required: ["situation", "task", "action", "result"],
              additionalProperties: false,
            },
            specificity_tag: {
              type: "string",
              enum: ["specific", "vague", "unclear"],
            },
            impact_tag: {
              type: "string",
              enum: ["high_impact", "medium_impact", "low_impact"],
            },
            clarity_tag: {
              type: "string",
              enum: ["clear", "rambling", "incomplete"],
            },
            honesty_flag: { type: "boolean" },
            narrative: { type: "string" },
            example_answer: { type: "string" },
          },
          required: [
            "star_scores",
            "specificity_tag",
            "impact_tag",
            "clarity_tag",
            "honesty_flag",
            "narrative",
            "example_answer",
          ],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.7,
  });

  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No response from OpenAI");
  }

  const response = JSON.parse(responseContent) as CoachingResponse;

  // Track cost
  await trackCost({
    model: "gpt-4o",
    tokensUsed: completion.usage?.total_tokens || 0,
    estimatedCostUsd: calculateCost(completion.usage?.total_tokens || 0, "gpt-4o"),
  });

  return response;
}

/**
 * Generate comprehensive report with strengths and clarifications
 * (Used for end-of-session coaching in US3)
 */
export async function generateComprehensiveReport(params: {
  answers: Array<{
    questionText: string;
    answerText: string;
    coaching: CoachingResponse;
  }>;
  resumeContext?: string;
  jobDescriptionContext?: string;
}): Promise<{
  strengths: Array<{ text: string; evidence: string }>;
  clarifications: Array<{ suggestion: string; rationale: string }>;
}> {
  const { answers, resumeContext, jobDescriptionContext } = params;

  const systemPrompt = `You are Cindy, a supportive AI interview coach. Based on a job seeker's interview practice session, identify their top 3 strengths versus the job description and 3 concrete clarifications to add to their resume or cover letter.

CRITICAL RULES:
1. NEVER fabricate facts or invent experiences
2. Base all feedback ONLY on what the user actually said in their answers
3. Be encouraging and specific
4. Clarifications should be actionable and tied to specific answers`;

  const answersText = answers
    .map(
      (a, i) =>
        `Q${i + 1}: ${a.questionText}\nA${i + 1}: ${a.answerText}\nCoaching: ${a.coaching.narrative}`
    )
    .join("\n\n");

  const userPrompt = `Review this practice session:

${answersText}

${resumeContext ? `Resume Context: ${resumeContext}` : ""}
${jobDescriptionContext ? `Job Description Context: ${jobDescriptionContext}` : ""}

Provide:
1. Top 3 Strengths: What did they do well across answers? Include evidence (which question)
2. 3 Clarifications: What should they add to their resume/cover letter to be clearer? Include rationale

Be specific and supportive.`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "comprehensive_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  evidence: { type: "string" },
                },
                required: ["text", "evidence"],
                additionalProperties: false,
              },
            },
            clarifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  suggestion: { type: "string" },
                  rationale: { type: "string" },
                },
                required: ["suggestion", "rationale"],
                additionalProperties: false,
              },
            },
          },
          required: ["strengths", "clarifications"],
          additionalProperties: false,
        },
      },
    },
    temperature: 0.7,
  });

  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No response from OpenAI");
  }

  const response = JSON.parse(responseContent);

  // Track cost
  await trackCost({
    model: "gpt-4o",
    tokensUsed: completion.usage?.total_tokens || 0,
    estimatedCostUsd: calculateCost(completion.usage?.total_tokens || 0, "gpt-4o"),
  });

  return response;
}

/**
 * Calculate estimated cost for OpenAI API call
 * GPT-4o pricing: $5 per 1M input tokens, $15 per 1M output tokens
 * Simplified: assume 50/50 split for estimation
 */
function calculateCost(tokens: number, model: string): number {
  if (model === "gpt-4o") {
    // Average of input ($5/1M) and output ($15/1M) = $10/1M
    return (tokens / 1_000_000) * 10;
  }
  return 0;
}
