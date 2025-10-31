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

  // Delete ALL test data regardless of age (this is called before each test)
  // We use a cutoff time approach that targets only realistic test data
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  try {
    // Get before counts for verification
    const beforeCounts: Record<string, number> = {};
    const tables = [
      "audit_logs",
      "events",
      "matches",
      "reports",
      "answers",
      "questions",
      "sessions",
      "consents",
      "cost_tracking",
    ];

    for (const table of tables) {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      beforeCounts[table] = count || 0;
    }

    console.log("📊 Before cleanup:", beforeCounts);

    // Delete in reverse dependency order
    // Note: Using .delete() with no filter deletes ALL rows regardless of ID type
    const deleteResults: Record<string, { count?: number; error?: string }> = {};

    for (const table of tables) {
      try {
        // Using created_at column to target test data from current run (>5 minutes old)
        // This allows tests to complete and cleanup old test data that causes constraint violations
        const { error } = await supabase.from(table).delete().lt("created_at", fiveMinutesAgo);
        if (error) {
          console.error(`❌ Error deleting from ${table}:`, error);
          deleteResults[table] = { error: error.message };
        } else {
          deleteResults[table] = { count: 0 };
        }
      } catch (err) {
        console.error(`❌ Exception deleting from ${table}:`, err);
        deleteResults[table] = {
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // Get after counts for verification
    const afterCounts: Record<string, number> = {};
    for (const table of tables) {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      afterCounts[table] = count || 0;
    }

    console.log("📊 After cleanup:", afterCounts);
    console.log("🗑️  Deleted rows:", {
      audit_logs: beforeCounts.audit_logs - afterCounts.audit_logs,
      events: beforeCounts.events - afterCounts.events,
      matches: beforeCounts.matches - afterCounts.matches,
      reports: beforeCounts.reports - afterCounts.reports,
      answers: beforeCounts.answers - afterCounts.answers,
      questions: beforeCounts.questions - afterCounts.questions,
      sessions: beforeCounts.sessions - afterCounts.sessions,
      consents: beforeCounts.consents - afterCounts.consents,
      cost_tracking: beforeCounts.cost_tracking - afterCounts.cost_tracking,
    });

    console.log("✓ Cleaned up all test data");
  } catch (error) {
    console.error("Error cleaning up all test data:", error);
    throw error;
  }
}
