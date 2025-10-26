import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/reports/[id]
 * Fetch a coaching report by ID
 *
 * Returns:
 * - id: UUID
 * - strengths: Array of strength objects
 * - clarifications: Array of clarification objects
 * - per_question_feedback: Array of per-question feedback objects
 * - isGuest: boolean (whether this is a guest session)
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch report with session details
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(
        `
        id,
        strengths,
        clarifications,
        per_question_feedback,
        sessions (
          user_id
        )
      `
      )
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check authorization (user owns session OR it's a guest session)
    const session = report.sessions as { user_id: string | null };
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: report.id,
      strengths: report.strengths,
      clarifications: report.clarifications,
      per_question_feedback: report.per_question_feedback,
      isGuest: !session.user_id,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/reports/[id]:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
