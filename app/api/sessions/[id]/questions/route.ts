import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/sessions/[id]/questions
 * Generate and fetch interview questions for a session
 *
 * For guest sessions:
 * - Fetches generic soft-skill questions from question bank
 * - Returns mix based on categories (conflict, leadership, ownership, etc.)
 *
 * For registered sessions with resume/JD:
 * - Generates tailored questions via OpenAI (US2)
 * - Mixes tailored with generic soft-skills
 *
 * Returns:
 * - questions: Array of question objects with id, text, category, order
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;

    // Create Supabase client
    const supabase = await createClient();

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, mode, question_count, low_anxiety_enabled, job_description_text")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if questions already generated
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if (count && count > 0) {
      // Questions already exist, fetch and return them
      const { data: existingQuestions, error: fetchError } = await supabase
        .from("questions")
        .select("id, question_text, question_order, category")
        .eq("session_id", sessionId)
        .order("question_order");

      if (fetchError) {
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      return NextResponse.json({
        questions: existingQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          order: q.question_order,
          category: q.category,
        })),
      });
    }

    // Generate new questions
    // For US1 (guest sessions), use in-memory question bank
    if (!session.user_id) {
      const { getRandomQuestions } = await import("@/lib/data/question-bank");

      // For Low-Anxiety Mode: 3 questions
      // For regular: use session.question_count
      const count = session.low_anxiety_enabled ? 3 : session.question_count;

      // Get random questions from the bank
      const randomQuestions = getRandomQuestions(count, session.low_anxiety_enabled ?? false);

      if (randomQuestions.length === 0) {
        return NextResponse.json(
          { error: "No questions available in question bank" },
          { status: 500 }
        );
      }

      // Insert questions into session
      const questionsToInsert = randomQuestions.map((question, index) => ({
        session_id: sessionId,
        question_order: index + 1,
        question_text: question.text,
        category: question.category,
        is_tailored: false,
      }));

      const { data: insertedQuestions, error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select("id, question_text, question_order, category");

      if (insertError || !insertedQuestions) {
        console.error("Error inserting questions:", insertError);
        return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
      }

      return NextResponse.json({
        questions: insertedQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          order: q.question_order,
          category: q.category,
        })),
      });
    }

    // For US2+ (registered users with resume/JD)
    // This will be implemented in Phase 4
    // For now, fall back to generic questions
    return NextResponse.json({ error: "Tailored questions not yet implemented" }, { status: 501 });
  } catch (error) {
    console.error("Unexpected error in POST /api/sessions/[id]/questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
