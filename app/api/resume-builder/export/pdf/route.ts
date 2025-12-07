/**
 * PDF Export API
 * GET /api/resume-builder/export/pdf
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateResumePDF } from "@/lib/resume/pdf-generator";

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

    // Generate PDF
    const pdfBytes = await generateResumePDF(draft.data);

    // Return PDF as download
    const fileName = `${draft.data.basic_info?.full_name?.replace(/\s+/g, "_") || "resume"}_${Date.now()}.pdf`;

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
