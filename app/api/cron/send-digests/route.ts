import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { matchJob } from "@/lib/scoring/job-match";

type JobRecord = {
  id: string;
  skills: string[];
  must_have_skills: string[] | null;
  seniority_level: string;
  location: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const service = createServiceRoleClient();
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: users } = await service
      .from("users")
      .select("id, email")
      .eq("digest_opt_in", true)
      .eq("digest_confirmed", true);

    const { data: jobs } = await service
      .from("jobs")
      .select("id, skills, must_have_skills, seniority_level, location")
      .eq("active", true);

    let emailsSent = 0;

    for (const user of users ?? []) {
      const { data: profile } = await service
        .from("profiles")
        .select("target_roles, seniority_level, location, resume_skills")
        .eq("user_id", user.id)
        .single();

      const matches = (jobs ?? []).map((job) => matchJob(profile ?? {}, job as JobRecord));
      const top = matches.filter((m) => m.scores.total >= 60).slice(0, 5);

      if (top.length === 0) continue;

      // Placeholder email content
      const body = `<p>Your top matches:</p><ul>${top
        .map((m) => `<li>${m.jobId} — score ${m.scores.total}</li>`)
        .join("")}</ul>`;
      const { sendEmail } = await import("@/lib/email/send");
      await sendEmail({
        to: user.email ?? "",
        subject: "Your Cindy job digest",
        html: body,
      });
      emailsSent++;
    }

    return NextResponse.json({ emailsSent });
  } catch (error) {
    console.error("send-digests cron error:", error);
    return NextResponse.json({ error: "Failed to send digests" }, { status: 500 });
  }
}
