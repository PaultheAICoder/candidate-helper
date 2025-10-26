import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSessionSchema, validateRequestBody } from "@/lib/utils/validators";

/**
 * POST /api/sessions
 * Create a new practice session (guest or authenticated user)
 *
 * Body:
 * - mode: "audio" | "text"
 * - questionCount: 3-10
 * - lowAnxietyEnabled?: boolean
 * - perQuestionCoaching?: boolean
 * - jobDescriptionText?: string
 * - targetRoleOverride?: string
 *
 * Returns:
 * - sessionId: UUID
 * - mode: "audio" | "text"
 * - questionCount: number
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, createSessionSchema);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Low-Anxiety Mode validation: must have exactly 3 questions
    if (data.lowAnxietyEnabled && data.questionCount !== 3) {
      return NextResponse.json(
        { error: "Low-Anxiety Mode requires exactly 3 questions" },
        { status: 400 }
      );
    }

    // Check daily session limit for authenticated users
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      if (countError) {
        console.error("Error checking session count:", countError);
        return NextResponse.json({ error: "Failed to check session limit" }, { status: 500 });
      }

      if (count !== null && count >= 2) {
        return NextResponse.json(
          {
            error: "You've reached your limit of 2 sessions today. Come back tomorrow!",
          },
          { status: 429 }
        );
      }
    }

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user?.id ?? null, // NULL for guest sessions
        mode: data.mode,
        low_anxiety_enabled: data.lowAnxietyEnabled ?? false,
        per_question_coaching: data.perQuestionCoaching ?? false,
        job_description_text: data.jobDescriptionText ?? null,
        target_role_override: data.targetRoleOverride ?? null,
        question_count: data.questionCount,
        started_at: new Date().toISOString(),
      })
      .select("id, mode, question_count, low_anxiety_enabled")
      .single();

    if (sessionError || !session) {
      console.error("Error creating session:", sessionError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Track session_start event
    await supabase.from("events").insert({
      user_id: user?.id ?? null,
      event_type: "session_start",
      session_id: session.id,
      payload: {
        mode: data.mode,
        low_anxiety: data.lowAnxietyEnabled ?? false,
        guest: !user,
      },
    });

    // Return session details
    return NextResponse.json({
      sessionId: session.id,
      mode: session.mode,
      questionCount: session.question_count,
      lowAnxietyEnabled: session.low_anxiety_enabled,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/sessions:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
