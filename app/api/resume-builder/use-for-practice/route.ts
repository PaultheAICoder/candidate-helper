/**
 * Use Resume for Practice API
 * POST /api/resume-builder/use-for-practice
 * Uploads built resume and creates a practice session
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { uploadResumeToStorage } from "@/lib/resume/upload-to-storage";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get user's resume draft
    const { data: draft, error: draftError } = await supabase
      .from("resume_drafts")
      .select("data")
      .eq("user_id", user.id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json(
        { error: "No resume draft found. Please complete the resume builder first." },
        { status: 404 }
      );
    }

    // Upload resume to storage
    const { path, url } = await uploadResumeToStorage(draft.data, user.id);

    // Update user's profile with resume
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        resume_url: url,
        resume_storage_path: path,
      })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { error: "Failed to update profile with resume" },
        { status: 500 }
      );
    }

    // Return success with redirect URL
    return NextResponse.json({
      success: true,
      resumeUrl: url,
      redirectTo: "/practice",
    });
  } catch (error) {
    console.error("Use for practice error:", error);
    return NextResponse.json(
      { error: "Failed to prepare resume for practice" },
      { status: 500 }
    );
  }
}
