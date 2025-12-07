import { enforceCostCap, resetAudioMode } from "@/lib/utils/cost-cap";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function mockClient(costTotal: number, threshold = "285"): SupabaseClient<Database> {
  const storage: Record<string, string> = {};
  return {
    from: (table: string) => {
      if (table === "system_config") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => ({ data: { value: threshold }, error: null }),
            }),
          }),
          upsert: (payload: any) => {
            storage[payload.key] = payload.value;
            return { error: null };
          },
        } as any;
      }
      if (table === "cost_tracking") {
        return {
          select: () => ({
            data: [
              { estimated_cost_usd: costTotal, period_start: new Date().toISOString() },
            ],
            error: null,
          }),
        } as any;
      }
      if (table === "audit_logs") {
        return {
          insert: () => ({ error: null }),
        } as any;
      }
      return {} as any;
    },
  } as SupabaseClient<Database>;
}

describe("cost cap", () => {
  it("disables audio when cost exceeds threshold", async () => {
    const client = mockClient(300);
    const enabled = await enforceCostCap(client);
    expect(enabled).toBe(false);
  });

  it("resets audio mode to enabled", async () => {
    const client = mockClient(0);
    await resetAudioMode(client);
    const enabled = await enforceCostCap(client);
    expect(enabled).toBe(true);
  });
});
