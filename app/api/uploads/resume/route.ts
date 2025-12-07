import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanFile } from "@/lib/security/virus-scan";
import { detectAndRedactPII } from "@/lib/security/pii-detection";
import { parseResume, extractSkills, extractSeniority } from "@/lib/openai/resume-parser";
import { extractTextFromFile, ALLOWED_MIMETYPES } from "@/lib/uploads/extract-text";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 3MB." },
        { status: 413 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIMETYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Supported: PDF, DOCX, TXT, MD. Got: ${file.type}`,
        },
        { status: 400 }
      );
    }

    // Check for .pages files by extension
    if (file.name.endsWith(".pages")) {
      return NextResponse.json(
        {
          error:
            "Please export your .pages file to PDF and upload again.",
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Virus scan
    const scanResult = await scanFile(buffer);
    if (!scanResult.clean) {
      return NextResponse.json(
        {
          error: "File contains malware and cannot be uploaded.",
          details: scanResult.error,
        },
        { status: 400 }
      );
    }

    // Extract text
    let resumeText = await extractTextFromFile(file, buffer);

    // Detect and redact PII
    const { redactedText, piiFound, warnings } = detectAndRedactPII(resumeText);
    resumeText = redactedText;

    if (piiFound && warnings) {
      console.warn("PII detected and redacted:", warnings);
    }

    // Parse resume
    const parsedResume = await parseResume(resumeText);
    const extractedSkills = extractSkills(parsedResume);
    const seniority = extractSeniority(parsedResume);

    // Upload to Supabase Storage
    const filename = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        resume_filename: file.name,
        resume_storage_path: filename,
        resume_uploaded_at: new Date().toISOString(),
        resume_file_size_bytes: file.size,
        // Store parsed data
        target_roles: parsedResume.summary ? [parsedResume.summary.split("\n")[0]] : [],
        seniority_level: seniority,
      })
      .eq("user_id", session.user.id);

    if (profileError) {
      // Clean up uploaded file
      await supabase.storage.from("resumes").remove([filename]);

      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      resumeSize: file.size,
      uploadedAt: new Date().toISOString(),
      parsedData: {
        fullName: parsedResume.fullName,
        location: parsedResume.location,
        skills: extractedSkills,
        seniority,
        experienceCount: parsedResume.experience.length,
        educationCount: parsedResume.education.length,
      },
      warnings: piiFound ? warnings : [],
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to upload resume";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
