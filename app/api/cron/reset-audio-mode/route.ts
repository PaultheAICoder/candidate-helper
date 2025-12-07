import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resetAudioMode } from "@/lib/utils/cost-cap";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const service = createServiceRoleClient();
    await resetAudioMode(service);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset audio mode cron error:", error);
    return NextResponse.json({ error: "Failed to reset audio mode" }, { status: 500 });
  }
}
