/**
 * Resume Storage Utility
 * Uploads generated resume to Supabase Storage
 */

import { createClient } from "@/lib/supabase/server";
import { generateResumePDF } from "@/lib/resume/pdf-generator";
import type { ResumeData } from "@/lib/types/resume-builder";

export async function uploadResumeToStorage(
  resumeData: ResumeData,
  userId: string
): Promise<{ path: string; url: string }> {
  const supabase = await createClient();

  // Generate PDF
  const pdfBytes = await generateResumePDF(resumeData);

  // Create file name
  const fileName = `${resumeData.basic_info?.full_name?.replace(/\s+/g, "_") || "resume"}_${Date.now()}.pdf`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("resumes")
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error("Failed to upload resume to storage");
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("resumes")
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
  };
}
