import { createClient } from "@/lib/supabase/client";
import type { EventType } from "@/types/models";

/**
 * Client-side event tracker to insert into events table.
 * Best-effort; failures logged but do not throw.
 */
export async function trackEvent(event_type: EventType, payload?: Record<string, unknown>) {
  try {
    const supabase = createClient();
    await supabase.from("events").insert({
      event_type,
      payload,
    });
  } catch (error) {
    console.error("trackEvent error:", error);
  }
}
