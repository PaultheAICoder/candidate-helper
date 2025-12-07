import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prepareQuestions } from "@/lib/coach/question-selection";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch session for context and authorization
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, question_count, low_anxiety_enabled")
      .eq("id", params.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return existing questions if present
    const { data: existingQuestions, error: existingError } = await supabase
      .from("questions")
      .select("id, question_text, category, question_order")
      .eq("session_id", params.id)
      .order("question_order", { ascending: true });

    if (existingError) {
      console.error("Error fetching questions:", existingError);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    if (existingQuestions && existingQuestions.length > 0) {
      return NextResponse.json({ questions: existingQuestions });
    }

    // Generate questions from the local bank
    const prepared = prepareQuestions(
      session.question_count ?? 0,
      session.low_anxiety_enabled ?? false
    );

    const toInsert = prepared.map((q) => ({
      session_id: params.id,
      question_text: q.question_text,
      category: q.category,
      is_tailored: q.is_tailored,
      is_gentle: q.is_gentle,
      question_order: q.question_order,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("questions")
      .insert(toInsert)
      .select("id, question_text, category, question_order")
      .order("question_order", { ascending: true });

    if (insertError || !inserted) {
      console.error("Error inserting questions:", insertError);
      return NextResponse.json({ error: "Failed to create questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: inserted });
  } catch (error) {
    console.error("Unexpected error in GET /api/sessions/[id]/questions:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
