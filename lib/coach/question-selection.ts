import { QUESTION_BANK, type QuestionBankItem } from "@/lib/data/question-bank";
import type { QuestionCategory } from "@/types/models";

export interface PreparedQuestion {
  question_text: string;
  category: QuestionCategory;
  is_tailored: boolean;
  is_gentle: boolean;
  question_order: number;
}

/**
  * Prepare a list of questions for a session.
  * Uses the local question bank; gentle questions are used when low-anxiety mode is enabled.
  */
export function prepareQuestions(
  count: number,
  lowAnxiety: boolean
): PreparedQuestion[] {
  const pool: QuestionBankItem[] = lowAnxiety
    ? QUESTION_BANK.filter((q) => q.isGentle)
    : QUESTION_BANK;

  const selected = pool.slice(0, count > 0 ? count : 0);

  return selected.map((q, idx) => ({
    question_text: q.text,
    category: q.category,
    is_tailored: false,
    is_gentle: q.isGentle,
    question_order: idx + 1,
  }));
}
