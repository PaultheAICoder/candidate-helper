/**
 * DOCX Export API
 * GET /api/resume-builder/export/docx
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateResumeDOCX } from "@/lib/resume/docx-generator";

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

    // Generate DOCX
    const docxBuffer = await generateResumeDOCX(draft.data);

    // Return DOCX as download
    const fileName = `${draft.data.basic_info?.full_name?.replace(/\s+/g, "_") || "resume"}_${Date.now()}.docx`;

    return new NextResponse(docxBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
