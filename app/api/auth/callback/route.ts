import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserAndProfile } from "@/lib/supabase/user";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          new URL("/login?error=auth_failed", requestUrl.origin)
        );
      }

      // Ensure backing user/profile rows exist for the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await ensureUserAndProfile(supabase, user);

      // Redirect to dashboard on successful login
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    } catch (err) {
      console.error("Callback processing error:", err);
      return NextResponse.redirect(
        new URL("/login?error=callback_failed", requestUrl.origin)
      );
    }
  }

  // No code provided
  return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
}
