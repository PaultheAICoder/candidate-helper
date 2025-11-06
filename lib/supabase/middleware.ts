/**
 * Supabase Auth Middleware Helper
 * Handles session refresh and eligibility checks
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { decodeReferralCode } from "@/lib/utils/referral";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/settings", "/admin"];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // Redirect to login if accessing protected path without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check eligibility for authenticated users
  if (user && isProtectedPath) {
    const { data: userData } = await supabase
      .from("users")
      .select("eligibility_confirmed")
      .eq("id", user.id)
      .single();

    // Redirect to eligibility confirmation if not yet confirmed
    if (userData && !userData.eligibility_confirmed) {
      const url = request.nextUrl.clone();
      if (url.pathname !== "/eligibility") {
        url.pathname = "/eligibility";
        return NextResponse.redirect(url);
      }
    }
  }

  // Track referral clicks on landing page
  const isLandingPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/coach";
  const referralCode = request.nextUrl.searchParams.get("ref");

  if (isLandingPage && referralCode) {
    try {
      const referrerUserId = decodeReferralCode(referralCode);

      if (referrerUserId) {
        // Track the referral click event
        await supabase.from("events").insert({
          user_id: null, // The referred user hasn't signed up yet
          event_type: "share_link_clicked",
          session_id: null,
          payload: {
            referrer_user_id: referrerUserId,
            source: "referral",
            referral_code: referralCode,
          },
        });
      }
    } catch (error) {
      console.error("Error tracking referral:", error);
      // Don't block the request if tracking fails
    }
  }

  return supabaseResponse;
}

/**
 * Check if user has eligibility confirmed
 */
export async function checkEligibility(userId: string): Promise<boolean> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  const { data } = await supabase
    .from("users")
    .select("eligibility_confirmed")
    .eq("id", userId)
    .single();

  return data?.eligibility_confirmed ?? false;
}
