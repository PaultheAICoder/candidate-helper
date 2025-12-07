import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRow } = await supabase
      .from("users")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = userRow?.admin === true || user.email?.endsWith("@teamcinder.com");
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const service = createServiceRoleClient();
    const { data: costs, error: costError } = await service.from("cost_tracking").select("*");
    if (costError) {
      console.error("Cost fetch error:", costError);
      return NextResponse.json({ error: "Failed to fetch costs" }, { status: 500 });
    }

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentCosts =
      costs?.filter((c) => new Date(c.period_start) >= currentMonthStart) ?? [];

    const currentMonth = currentCosts.reduce((sum, c) => sum + Number(c.estimated_cost_usd || 0), 0);
    const byModel: Record<string, number> = {};
    currentCosts.forEach((c) => {
      const key = c.model || "unknown";
      byModel[key] = (byModel[key] || 0) + Number(c.estimated_cost_usd || 0);
    });

    // Audio flag from system_config
    const { data: audioFlag } = await service
      .from("system_config")
      .select("value")
      .eq("key", "audio_mode_enabled")
      .maybeSingle();

    return NextResponse.json({
      currentMonth,
      byModel,
      audioModeEnabled: audioFlag?.value !== "false",
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/costs:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
