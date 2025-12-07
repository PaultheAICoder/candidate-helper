import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { matchJob } from "@/lib/scoring/job-match";

type JobRecord = {
  id: string;
  skills: string[];
  must_have_skills: string[] | null;
  seniority_level: string;
  location: string | null;
};

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceRoleClient();

    const { data: profile } = await service
      .from("profiles")
      .select("target_roles, seniority_level, location, resume_skills")
      .eq("user_id", user.id)
      .single();

    const { data: jobs, error: jobsError } = await service
      .from("jobs")
      .select("id, skills, must_have_skills, seniority_level, location")
      .eq("active", true);

    if (jobsError) {
      console.error("Job fetch error:", jobsError);
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }

    const matches = (jobs ?? []).map((job) => matchJob(profile ?? {}, job as JobRecord));
    const topMatches = matches
      .filter((m) => m.scores.total > 0)
      .sort((a, b) => b.scores.total - a.scores.total)
      .slice(0, 10);

    return NextResponse.json({ matches: topMatches });
  } catch (error) {
    console.error("Unexpected error in POST /api/jobs/match:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
