import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Extended validation schema for answer submission
const submitAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  transcriptText: z.string().min(10).max(5000),
  durationSeconds: z.number().int().min(1).max(210).optional(),
  retakeUsed: z.boolean().optional().default(false),
  extensionUsed: z.boolean().optional().default(false),
});

/**
 * POST /api/answers
 * Submit an answer for a question
 *
 * Body:
 * - sessionId: UUID
 * - questionId: UUID
 * - transcriptText: string (10-5000 chars)
 * - durationSeconds?: number (for audio mode)
 * - retakeUsed?: boolean
 * - extensionUsed?: boolean
 *
 * Returns:
 * - answerId: UUID
 * - success: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = submitAnswerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Verify session exists and belongs to user (or is a guest session)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, user_id, question_count")
      .eq("id", data.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check authorization (user owns session OR it's a guest session)
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify question exists and belongs to session
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("id, session_id")
      .eq("id", data.questionId)
      .eq("session_id", data.sessionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Question not found or does not belong to this session" },
        { status: 404 }
      );
    }

    // Check if answer already exists for this question
    const { data: existingAnswer } = await supabase
      .from("answers")
      .select("id")
      .eq("question_id", data.questionId)
      .single();

    if (existingAnswer) {
      return NextResponse.json(
        { error: "Answer already submitted for this question" },
        { status: 409 }
      );
    }

    // Insert answer
    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .insert({
        session_id: data.sessionId,
        question_id: data.questionId,
        transcript_text: data.transcriptText,
        duration_seconds: data.durationSeconds ?? null,
        retake_used: data.retakeUsed,
        extension_used: data.extensionUsed,
      })
      .select("id")
      .single();

    if (answerError || !answer) {
      console.error("Error inserting answer:", answerError);
      return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
    }

    // Update session completion rate
    const { count: answerCount } = await supabase
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", data.sessionId);

    const completionRate = answerCount ? answerCount / session.question_count : 0;

    await supabase
      .from("sessions")
      .update({ completion_rate: completionRate })
      .eq("id", data.sessionId);

    // Track q_answered event
    await supabase.from("events").insert({
      user_id: user?.id ?? null,
      event_type: "q_answered",
      session_id: data.sessionId,
      payload: {
        question_id: data.questionId,
        duration_seconds: data.durationSeconds,
        retake_used: data.retakeUsed,
      },
    });

    return NextResponse.json({
      answerId: answer.id,
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/answers:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
