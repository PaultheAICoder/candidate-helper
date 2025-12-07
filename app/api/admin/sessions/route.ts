import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email?.endsWith("@teamcinder.com")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * limit;

    const { data: sessions, error } = await service
      .from("sessions")
      .select("id, user_id, mode, question_count, avg_star_score, completion_rate, completed_at, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Admin sessions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/sessions:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
