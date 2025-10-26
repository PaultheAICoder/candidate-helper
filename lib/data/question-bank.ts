/**
 * Generic Soft-Skill Question Bank
 * Used for guest sessions and as fallback options
 */

import type { QuestionCategory } from "@/types/models";

export interface QuestionBankItem {
  text: string;
  category: QuestionCategory;
  isGentle: boolean; // For Low-Anxiety Mode
}

export const QUESTION_BANK: QuestionBankItem[] = [
  // Conflict Resolution
  {
    text: "Tell me about a time when you disagreed with a coworker or manager about the best approach to a problem. How did you handle it?",
    category: "soft_skills_conflict",
    isGentle: false,
  },
  {
    text: "Describe a situation where you had to navigate conflicting priorities or requirements from different stakeholders.",
    category: "soft_skills_conflict",
    isGentle: false,
  },
  {
    text: "Can you share an example of when you had to address a conflict within your team? What was your approach?",
    category: "soft_skills_conflict",
    isGentle: true,
  },

  // Leadership
  {
    text: "Tell me about a time when you led a project or initiative without having formal authority over the team members.",
    category: "soft_skills_leadership",
    isGentle: false,
  },
  {
    text: "Describe a situation where you had to motivate a team during a challenging period or setback.",
    category: "soft_skills_leadership",
    isGentle: false,
  },
  {
    text: "Can you share an experience where you helped someone on your team grow or develop their skills?",
    category: "soft_skills_leadership",
    isGentle: true,
  },

  // Ownership/Accountability
  {
    text: "Tell me about a time when you identified a problem that wasn't part of your job description but took the initiative to solve it anyway.",
    category: "soft_skills_ownership",
    isGentle: false,
  },
  {
    text: "Describe a situation where you had to take ownership of a mistake or failure. How did you handle it?",
    category: "soft_skills_ownership",
    isGentle: false,
  },
  {
    text: "Can you share an example of when you went above and beyond what was expected of you?",
    category: "soft_skills_ownership",
    isGentle: true,
  },

  // Collaboration
  {
    text: "Tell me about a time when you had to work with a cross-functional team to achieve a goal. What was your role?",
    category: "soft_skills_collaboration",
    isGentle: false,
  },
  {
    text: "Describe a situation where you had to collaborate with someone whose work style was very different from yours.",
    category: "soft_skills_collaboration",
    isGentle: false,
  },
  {
    text: "Can you share an experience where teamwork made a significant difference in the outcome of a project?",
    category: "soft_skills_collaboration",
    isGentle: true,
  },

  // Failure/Learning
  {
    text: "Tell me about a project that didn't go as planned. What did you learn from it?",
    category: "soft_skills_failure",
    isGentle: false,
  },
  {
    text: "Describe a situation where you received critical feedback. How did you respond and what changes did you make?",
    category: "soft_skills_failure",
    isGentle: false,
  },
  {
    text: "Can you share a time when you tried something new and it didn't work out? What was your takeaway?",
    category: "soft_skills_failure",
    isGentle: true,
  },

  // Communication
  {
    text: "Tell me about a time when you had to explain a complex technical concept to a non-technical audience.",
    category: "soft_skills_communication",
    isGentle: false,
  },
  {
    text: "Describe a situation where miscommunication caused a problem. How did you resolve it?",
    category: "soft_skills_communication",
    isGentle: false,
  },
  {
    text: "Can you share an example of when you had to deliver difficult news or feedback to someone?",
    category: "soft_skills_communication",
    isGentle: true,
  },
];

/**
 * Get random questions from the bank
 * @param count - Number of questions to return
 * @param lowAnxietyMode - If true, prefer gentle questions
 * @returns Array of random questions
 */
export function getRandomQuestions(
  count: number,
  lowAnxietyMode: boolean = false
): QuestionBankItem[] {
  // Handle invalid counts
  if (count <= 0) {
    return [];
  }

  const pool = lowAnxietyMode ? QUESTION_BANK.filter((q) => q.isGentle) : QUESTION_BANK;

  // Fisher-Yates shuffle
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(
  category: QuestionCategory,
  count: number = 3
): QuestionBankItem[] {
  const categoryQuestions = QUESTION_BANK.filter((q) => q.category === category);
  return categoryQuestions.slice(0, count);
}
