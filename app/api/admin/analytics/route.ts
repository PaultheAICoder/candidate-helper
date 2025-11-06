import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/analytics
 * Fetch analytics data for admin dashboard
 *
 * Requires admin authentication
 *
 * Returns:
 * - surveyTallies: { like, neutral, dislike } for each question
 * - referralClicks: { total, conversionRate }
 * - sessionStats: { total, completed, avgCompletionRate, avgStarScore }
 */
export async function GET(_request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin
    // For MVP, we'll allow any authenticated user to view analytics
    // In production, implement proper admin role checking

    // Fetch survey events
    const { data: surveyEvents, error: surveyError } = await supabase
      .from("events")
      .select("payload")
      .eq("event_type", "survey_submitted");

    if (surveyError) {
      console.error("Error fetching survey events:", surveyError);
      return NextResponse.json({ error: "Failed to fetch survey data" }, { status: 500 });
    }

    // Tally survey responses
    const surveyTallies = {
      helpfulness: { like: 0, neutral: 0, dislike: 0 },
      adviceQuality: { like: 0, neutral: 0, dislike: 0 },
      preparedness: { like: 0, neutral: 0, dislike: 0 },
    };

    surveyEvents.forEach((event) => {
      const payload = event.payload as
        | {
            responses?: {
              helpfulness?: "like" | "neutral" | "dislike";
              adviceQuality?: "like" | "neutral" | "dislike";
              preparedness?: "like" | "neutral" | "dislike";
            };
          }
        | null
        | undefined;

      const responses = payload?.responses;
      if (responses) {
        if (responses.helpfulness) surveyTallies.helpfulness[responses.helpfulness]++;
        if (responses.adviceQuality) surveyTallies.adviceQuality[responses.adviceQuality]++;
        if (responses.preparedness) surveyTallies.preparedness[responses.preparedness]++;
      }
    });

    // Calculate percentages
    const totalSurveys = surveyEvents.length;
    const surveyPercentages = {
      helpfulness: {
        like:
          totalSurveys > 0 ? Math.round((surveyTallies.helpfulness.like / totalSurveys) * 100) : 0,
        neutral:
          totalSurveys > 0
            ? Math.round((surveyTallies.helpfulness.neutral / totalSurveys) * 100)
            : 0,
        dislike:
          totalSurveys > 0
            ? Math.round((surveyTallies.helpfulness.dislike / totalSurveys) * 100)
            : 0,
      },
      adviceQuality: {
        like:
          totalSurveys > 0
            ? Math.round((surveyTallies.adviceQuality.like / totalSurveys) * 100)
            : 0,
        neutral:
          totalSurveys > 0
            ? Math.round((surveyTallies.adviceQuality.neutral / totalSurveys) * 100)
            : 0,
        dislike:
          totalSurveys > 0
            ? Math.round((surveyTallies.adviceQuality.dislike / totalSurveys) * 100)
            : 0,
      },
      preparedness: {
        like:
          totalSurveys > 0 ? Math.round((surveyTallies.preparedness.like / totalSurveys) * 100) : 0,
        neutral:
          totalSurveys > 0
            ? Math.round((surveyTallies.preparedness.neutral / totalSurveys) * 100)
            : 0,
        dislike:
          totalSurveys > 0
            ? Math.round((surveyTallies.preparedness.dislike / totalSurveys) * 100)
            : 0,
      },
    };

    // Fetch referral click events
    const { count: referralClicks, error: referralError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "share_link_clicked");

    if (referralError) {
      console.error("Error fetching referral events:", referralError);
    }

    // Calculate conversion rate (users who signed up after clicking a referral link)
    // For MVP, we'll estimate this based on the ratio of referral clicks to new user sign-ups
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      console.error("Error fetching user count:", usersError);
    }

    const conversionRate =
      referralClicks && totalUsers && referralClicks > 0
        ? Math.round((totalUsers / referralClicks) * 100)
        : 0;

    // Fetch session statistics
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("completed_at, completion_rate, avg_star_score");

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json({ error: "Failed to fetch session data" }, { status: 500 });
    }

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed_at !== null).length;
    const avgCompletionRate =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / sessions.length
        : 0;
    const avgStarScore =
      sessions.filter((s) => s.avg_star_score !== null).length > 0
        ? sessions
            .filter((s) => s.avg_star_score !== null)
            .reduce((sum, s) => sum + (s.avg_star_score || 0), 0) /
          sessions.filter((s) => s.avg_star_score !== null).length
        : 0;

    return NextResponse.json({
      surveyTallies: surveyPercentages,
      totalSurveys,
      referralClicks: {
        total: referralClicks || 0,
        conversionRate,
      },
      sessionStats: {
        total: totalSessions,
        completed: completedSessions,
        avgCompletionRate: Math.round(avgCompletionRate * 100),
        avgStarScore: Math.round(avgStarScore * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/analytics:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
