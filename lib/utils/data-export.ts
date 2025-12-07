import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedClient = SupabaseClient<Database>;

export interface UserExport {
  user: unknown;
  profile: unknown;
  sessions: unknown[];
  answers: unknown[];
  reports: unknown[];
  consents: unknown[];
  events: unknown[];
  matches: unknown[];
}

/**
 * Gather all user-owned data for export.
 * Throws on query errors to ensure callers can surface meaningful failures.
 */
export async function exportUserData(client: TypedClient, userId: string): Promise<UserExport> {
  const { data: user, error: userError } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (userError) throw userError;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (profileError && profileError.code !== "PGRST116") throw profileError; // ignore not found

  const { data: sessions, error: sessionsError } = await client
    .from("sessions")
    .select("*")
    .eq("user_id", userId);
  if (sessionsError) throw sessionsError;

  const sessionIds = (sessions ?? []).map((s) => s.id);

  const [answers, reports] = await Promise.all([
    sessionIds.length
      ? client.from("answers").select("*").in("session_id", sessionIds)
      : { data: [], error: null },
    sessionIds.length
      ? client.from("reports").select("*").in("session_id", sessionIds)
      : { data: [], error: null },
  ]);
  if (answers.error) throw answers.error;
  if (reports.error) throw reports.error;

  const { data: consents, error: consentsError } = await client
    .from("consents")
    .select("*")
    .eq("user_id", userId);
  if (consentsError) throw consentsError;

  const { data: events, error: eventsError } = await client
    .from("events")
    .select("*")
    .eq("user_id", userId);
  if (eventsError) throw eventsError;

  const { data: matches, error: matchesError } = await client
    .from("matches")
    .select("*")
    .eq("user_id", userId);
  if (matchesError) throw matchesError;

  return {
    user: user ?? null,
    profile: profile ?? null,
    sessions: sessions ?? [],
    answers: answers.data ?? [],
    reports: reports.data ?? [],
    consents: consents ?? [],
    events: events ?? [],
    matches: matches ?? [],
  };
}
