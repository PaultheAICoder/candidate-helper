import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateCoachingReportPDF } from "@/lib/pdf/generate-report";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch report with session for auth
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(
        `
        id,
        strengths,
        clarifications,
        per_question_feedback,
        pdf_storage_path,
        sessions (user_id, low_anxiety_enabled)
      `
      )
      .eq("id", params.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const session = report.sessions as { user_id: string | null; low_anxiety_enabled: boolean };
    if (session.user_id && session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If PDF already stored, stream from storage
    if (report.pdf_storage_path) {
      const { data: file, error: downloadError } = await supabase.storage
        .from("reports")
        .download(report.pdf_storage_path);
      if (!downloadError && file) {
        return new NextResponse(file, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="report-${params.id}.pdf"`,
          },
        });
      }
    }

    // Generate PDF on the fly
    const pdfBytes = await generateCoachingReportPDF({
      strengths: report.strengths as unknown[],
      clarifications: report.clarifications as unknown[],
      per_question_feedback: report.per_question_feedback as unknown[],
      isLowAnxietyMode: session.low_anxiety_enabled,
    });

    // Upload PDF for future requests
    const storagePath = `${params.id}/report.pdf`;
    const service = createServiceRoleClient();
    await service.storage.from("reports").upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    await service.from("reports").update({ pdf_storage_path: storagePath }).eq("id", params.id);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/reports/[id]/pdf:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
