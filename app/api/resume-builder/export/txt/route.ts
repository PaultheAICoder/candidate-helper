/**
 * TXT Export API
 * GET /api/resume-builder/export/txt
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateResumeTXT } from "@/lib/resume/txt-generator";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get user's draft
    const { data: draft, error } = await supabase
      .from("resume_drafts")
      .select("data")
      .eq("user_id", user.id)
      .single();

    if (error || !draft) {
      return NextResponse.json(
        { error: "No resume draft found. Please complete the resume builder first." },
        { status: 404 }
      );
    }

    // Generate TXT
    const txtContent = generateResumeTXT(draft.data);

    // Return TXT as download
    const fileName = `${draft.data.basic_info?.full_name?.replace(/\s+/g, "_") || "resume"}_${Date.now()}.txt`;

    return new NextResponse(txtContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("TXT export error:", error);
    return NextResponse.json(
      { error: "Failed to generate TXT" },
      { status: 500 }
    );
  }
}
