import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { enforceCostCap } from "@/lib/utils/cost-cap";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const service = createServiceRoleClient();
    const audioEnabled = await enforceCostCap(service);
    return NextResponse.json({ audioEnabled });
  } catch (error) {
    console.error("Cost cap enforcement error:", error);
    return NextResponse.json({ error: "Failed to enforce cost cap" }, { status: 500 });
  }
}
