import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for survey submission
const surveySchema = z.object({
  sessionId: z.string().uuid(),
  responses: z.object({
    helpfulness: z.enum(["like", "neutral", "dislike"]),
    adviceQuality: z.enum(["like", "neutral", "dislike"]),
    preparedness: z.enum(["like", "neutral", "dislike"]),
    lowAnxietyFeedback: z.string().max(1000).optional(),
  }),
});

/**
 * POST /api/surveys
 * Submit survey responses after completing a practice session
 *
 * Body:
 * - sessionId: UUID
 * - responses: {
 *     helpfulness: "like" | "neutral" | "dislike"
 *     adviceQuality: "like" | "neutral" | "dislike"
 *     preparedness: "like" | "neutral" | "dislike"
 *     lowAnxietyFeedback?: string (optional, for Low-Anxiety sessions)
 *   }
 *
 * Returns:
 * - success: boolean
 * - eventId: UUID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = surveySchema.safeParse(body);

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
      .select("id, user_id")
      .eq("id", data.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check authorization (user owns session OR it's a guest session)
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Insert survey event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: user?.id ?? null,
        event_type: "survey_submitted",
        session_id: data.sessionId,
        payload: {
          responses: data.responses,
          sessionId: data.sessionId,
        },
      })
      .select("id")
      .single();

    if (eventError || !event) {
      console.error("Error inserting survey event:", eventError);
      return NextResponse.json({ error: "Failed to submit survey" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/surveys:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
