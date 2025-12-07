import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

/**
 * Delete all user-owned data. Intended for use with a service-role client.
 */
export async function deleteUserData(client: TypedClient, userId: string) {
  const { data: sessions, error: sessionsError } = await client
    .from("sessions")
    .select("id")
    .eq("user_id", userId);
  if (sessionsError) throw sessionsError;

  const sessionIds = (sessions ?? []).map((s) => s.id);

  if (sessionIds.length) {
    await client.from("answers").delete().in("session_id", sessionIds);
    await client.from("questions").delete().in("session_id", sessionIds);
    await client.from("reports").delete().in("session_id", sessionIds);
    await client.from("sessions").delete().in("id", sessionIds);
  }

  await client.from("matches").delete().eq("user_id", userId);
  await client.from("events").delete().eq("user_id", userId);
  await client.from("consents").delete().eq("user_id", userId);
  await client.from("profiles").delete().eq("user_id", userId);
  await client.from("users").delete().eq("id", userId);
}
