import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/transcripts/[id]
 * Returns answers + session when admin/recruiter is authorized:
 * - admin flag on users table OR @teamcinder.com email
 * - recruiter_access_granted OR performance threshold (avg_star_score >=4.2 AND completion_rate >=0.7)
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = userRow?.admin === true || user.email?.endsWith("@teamcinder.com");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = createServiceRoleClient();

    const { data: session, error: sessionError } = await service
      .from("sessions")
      .select("id, user_id, avg_star_score, completion_rate")
      .eq("id", params.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check recruiter access gating
    const { data: owner } = await service
      .from("users")
      .select("recruiter_access_granted")
      .eq("id", session.user_id)
      .maybeSingle();

    const meetsPerformance =
      (session.avg_star_score ?? 0) >= 4.2 && (session.completion_rate ?? 0) >= 0.7;
    const allowed = owner?.recruiter_access_granted === true || meetsPerformance;

    if (!allowed) {
      return NextResponse.json({ error: "Not eligible for transcript access" }, { status: 403 });
    }

    const { data: answers, error: answersError } = await service
      .from("answers")
      .select("id, transcript_text, questions(question_text, question_order)")
      .eq("session_id", params.id)
      .order("created_at", { ascending: true });

    if (answersError) {
      console.error("Admin transcripts answers error:", answersError);
      return NextResponse.json({ error: "Failed to fetch answers" }, { status: 500 });
    }

    // Audit log
    await service.from("audit_logs").insert({
      admin_user_id: user.id,
      action_type: "view_transcript",
      resource_type: "session",
      resource_id: params.id,
      details: { reason: meetsPerformance ? "performance_threshold" : "user_opt_in" },
    });

    return NextResponse.json({
      session,
      answers: answers?.map((a) => ({
        id: a.id,
        transcript_text: a.transcript_text,
        question_text: (a.questions as { question_text: string; question_order: number }).question_text,
        question_order: (a.questions as { question_order: number }).question_order,
      })),
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/transcripts/[id]:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
