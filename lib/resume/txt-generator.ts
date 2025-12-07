/**
 * TXT Resume Generator
 * Creates plain text resumes for easy copy-paste
 */

import type { ResumeData } from "@/lib/types/resume-builder";

export function generateResumeTXT(data: ResumeData): string {
  const lines: string[] = [];

  // Header - Name and Contact
  if (data.basic_info) {
    const { full_name, email, phone, location, linkedin_url } = data.basic_info;

    if (full_name) {
      lines.push(full_name.toUpperCase());
      lines.push("=".repeat(full_name.length));
      lines.push("");
    }

    const contactParts: string[] = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (location) contactParts.push(location);

    if (contactParts.length > 0) {
      lines.push(contactParts.join(" | "));
    }

    if (linkedin_url) {
      lines.push(linkedin_url);
    }

    lines.push("");
    lines.push("");
  }

  // Professional Summary
  if (data.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("-".repeat(20));
    lines.push("");
    lines.push(data.summary);
    lines.push("");
    lines.push("");
  }

  // Work Experience
  if (data.work_history && data.work_history.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    lines.push("-".repeat(23));
    lines.push("");

    for (const job of data.work_history) {
      const dateRange = `${job.start_date} - ${job.is_current ? "Present" : job.end_date}`;
      lines.push(`${job.title}`);
      lines.push(`${job.company} | ${dateRange}`);
      lines.push("");

      for (const bullet of job.enhanced_bullets) {
        lines.push(`• ${bullet}`);
      }

      lines.push("");
      lines.push("");
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    lines.push("EDUCATION");
    lines.push("-".repeat(9));
    lines.push("");

    for (const edu of data.education) {
      lines.push(edu.degree);

      const eduDetails = [edu.institution];
      if (edu.field) eduDetails.push(edu.field);
      if (edu.graduation_year) eduDetails.push(edu.graduation_year);

      lines.push(eduDetails.join(" | "));
      lines.push("");
    }

    lines.push("");
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    lines.push("SKILLS");
    lines.push("-".repeat(6));
    lines.push("");
    lines.push(data.skills.join(" • "));
    lines.push("");
  }

  return lines.join("\n");
}
