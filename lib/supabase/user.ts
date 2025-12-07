/**
 * Helpers to ensure auth users have backing rows in `users` and `profiles`.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuthProvider } from "@/types/models";

type TypedClient = SupabaseClient<Database>;

/**
 * Map Supabase provider to internal enum used in `users.auth_provider`.
 */
function mapProvider(provider: string | null | undefined): AuthProvider {
  if (provider === "google") return "google";
  // Supabase OTP provider surfaces as "email"
  return "email_magic_link";
}

/**
 * Ensure both `users` and `profiles` rows exist for an authenticated user.
 * Safe to call repeatedly (uses upsert) and from either server or browser clients.
 */
export async function ensureUserAndProfile(client: TypedClient, authUser: User | null | undefined) {
  if (!authUser?.id || !authUser.email) return;

  const auth_provider = mapProvider(authUser.app_metadata?.provider);

  // Upsert into users table
  const { error: userError } = await client
    .from("users")
    .upsert(
      {
        id: authUser.id,
        email: authUser.email,
        auth_provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (userError) {
    console.error("ensureUserAndProfile: failed to upsert users row", userError);
    return;
  }

  // Upsert minimal profile row (1:1 with users)
  const { error: profileError } = await client
    .from("profiles")
    .upsert(
      {
        user_id: authUser.id,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("ensureUserAndProfile: failed to upsert profiles row", profileError);
  }
}

export { mapProvider };
