import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoachingReportPDF } from "@/lib/pdf/generate-report";

/**
 * GET /api/reports/[id]/pdf
 * Generate and download a coaching report as PDF
 *
 * Returns:
 * - PDF file with report branding and content
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user (may be null for guests)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch report with session details
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(
        `
        id,
        strengths,
        clarifications,
        per_question_feedback,
        sessions (
          user_id,
          low_anxiety_enabled
        )
      `
      )
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check authorization (user owns session OR it's a guest session)
    const session = report.sessions as { user_id: string | null; low_anxiety_enabled: boolean };
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate PDF with type casting for dynamic Supabase data
    const reportData = {
      strengths: Array.isArray(report.strengths) ? report.strengths : [],
      clarifications: Array.isArray(report.clarifications) ? report.clarifications : [],
      per_question_feedback: Array.isArray(report.per_question_feedback)
        ? report.per_question_feedback
        : [],
      isLowAnxietyMode: session.low_anxiety_enabled || false,
    };
    const pdfBytes = await generateCoachingReportPDF(reportData);

    // Convert Uint8Array to Buffer for proper Response compatibility
    const pdfBuffer = Buffer.from(pdfBytes);

    // Return PDF file as Response
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="coaching-report-${reportId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
