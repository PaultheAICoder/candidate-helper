import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

/**
 * Enforce audio mode availability based on monthly cost threshold.
 * Returns whether audio mode is enabled after enforcement.
 */
export async function enforceCostCap(service: TypedClient): Promise<boolean> {
  // Get threshold
  const { data: thresholdRow, error: thresholdError } = await service
    .from("system_config")
    .select("value")
    .eq("key", "monthly_cost_threshold_usd")
    .maybeSingle();
  if (thresholdError) {
    console.error("Cost cap: failed to read threshold", thresholdError);
    return true;
  }
  const threshold = thresholdRow?.value ? parseFloat(thresholdRow.value) : 285;

  // Get current month costs
  const { data: costs, error: costsError } = await service.from("cost_tracking").select("*");
  if (costsError) {
    console.error("Cost cap: failed to read costs", costsError);
    return true;
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const currentCosts =
    costs?.filter((c) => new Date(c.period_start) >= monthStart) ?? [];
  const total = currentCosts.reduce((sum, c) => sum + Number(c.estimated_cost_usd || 0), 0);

  const audioEnabled = total < threshold;
  await service
    .from("system_config")
    .upsert({ key: "audio_mode_enabled", value: audioEnabled ? "true" : "false" });

  // Audit log
  await service.from("audit_logs").insert({
    action_type: "cost_cap_enforced",
    resource_type: "system",
    resource_id: null,
    details: { total, threshold, audioEnabled },
  });

  return audioEnabled;
}

/**
 * Reset audio mode to enabled (called monthly).
 */
export async function resetAudioMode(service: TypedClient) {
  await service
    .from("system_config")
    .upsert({ key: "audio_mode_enabled", value: "true" });
  await service.from("audit_logs").insert({
    action_type: "audio_mode_reset",
    resource_type: "system",
    resource_id: null,
  });
}
