/**
 * Database cleanup helpers for E2E tests
 * Directly deletes stale test data instead of relying on RPC functions
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Clean up stale test data from the database
 * Deletes sessions and related data created more than 1 hour ago
 */
export async function cleanupStaleTestData(): Promise<void> {
  // Use service role key for cleanup since it has full access
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    // Delete in reverse dependency order to respect foreign key constraints
    // Delete cascade should handle most of this, but we're explicit for clarity

    // 1. Delete audit logs
    await supabase.from("audit_logs").delete().lt("created_at", oneHourAgo);

    // 2. Delete events
    await supabase.from("events").delete().lt("created_at", oneHourAgo);

    // 3. Delete matches
    await supabase.from("matches").delete().lt("created_at", oneHourAgo);

    // 4. Delete reports
    await supabase.from("reports").delete().lt("created_at", oneHourAgo);

    // 5. Delete answers (depends on sessions)
    await supabase.from("answers").delete().lt("created_at", oneHourAgo);

    // 6. Delete questions (depends on sessions)
    await supabase.from("questions").delete().lt("created_at", oneHourAgo);

    // 7. Delete sessions
    await supabase.from("sessions").delete().lt("created_at", oneHourAgo);

    // 8. Delete consents
    await supabase.from("consents").delete().lt("created_at", oneHourAgo);

    // 9. Delete cost tracking
    await supabase.from("cost_tracking").delete().lt("created_at", oneHourAgo);

    console.log("✓ Cleaned up stale test data");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    throw error;
  }
}

/**
 * Clean up ALL sessions and related data (nuclear option)
 * Only use this in test teardown or when you need a complete reset
 */
export async function cleanupAllTestData(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Delete in reverse dependency order
    await supabase.from("audit_logs").delete().gt("id", -1);
    await supabase.from("events").delete().gt("id", -1);
    await supabase.from("matches").delete().gt("id", -1);
    await supabase.from("reports").delete().gt("id", -1);
    await supabase.from("answers").delete().gt("id", -1);
    await supabase.from("questions").delete().gt("id", -1);
    await supabase.from("sessions").delete().gt("id", -1);
    await supabase.from("consents").delete().gt("id", -1);
    await supabase.from("cost_tracking").delete().gt("id", -1);

    console.log("✓ Cleaned up all test data");
  } catch (error) {
    console.error("Error cleaning up all test data:", error);
    throw error;
  }
}
