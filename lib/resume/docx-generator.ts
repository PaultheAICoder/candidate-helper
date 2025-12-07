/**
 * DOCX Resume Generator
 * Creates Word document resumes using docx library
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
} from "docx";
import type { ResumeData } from "@/lib/types/resume-builder";

export async function generateResumeDOCX(data: ResumeData): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Header - Name and Contact
  if (data.basic_info) {
    const { full_name, email, phone, location, linkedin_url } = data.basic_info;

    // Name
    if (full_name) {
      sections.push(
        new Paragraph({
          text: full_name.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    }

    // Contact info
    const contactParts: string[] = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (location) contactParts.push(location);

    if (contactParts.length > 0) {
      sections.push(
        new Paragraph({
          text: contactParts.join(" • "),
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    }

    if (linkedin_url) {
      sections.push(
        new Paragraph({
          text: linkedin_url,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }
  }

  // Professional Summary
  if (data.summary) {
    sections.push(
      new Paragraph({
        text: "PROFESSIONAL SUMMARY",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.push(
      new Paragraph({
        text: data.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Work Experience
  if (data.work_history && data.work_history.length > 0) {
    sections.push(
      new Paragraph({
        text: "PROFESSIONAL EXPERIENCE",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    for (const job of data.work_history) {
      // Job title
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.title,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { before: 150, after: 50 },
        })
      );

      // Company and dates
      const dateRange = `${job.start_date} - ${job.is_current ? "Present" : job.end_date}`;
      sections.push(
        new Paragraph({
          text: `${job.company} • ${dateRange}`,
          spacing: { after: 100 },
        })
      );

      // Achievements
      for (const bullet of job.enhanced_bullets) {
        sections.push(
          new Paragraph({
            text: bullet,
            bullet: { level: 0 },
            spacing: { after: 50 },
          })
        );
      }
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    sections.push(
      new Paragraph({
        text: "EDUCATION",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    for (const edu of data.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
            }),
          ],
          spacing: { before: 100, after: 50 },
        })
      );

      const eduDetails = [edu.institution];
      if (edu.field) eduDetails.push(edu.field);
      if (edu.graduation_year) eduDetails.push(edu.graduation_year);

      sections.push(
        new Paragraph({
          text: eduDetails.join(" • "),
          spacing: { after: 100 },
        })
      );
    }
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    sections.push(
      new Paragraph({
        text: "SKILLS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );

    sections.push(
      new Paragraph({
        text: data.skills.join(" • "),
        spacing: { after: 100 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
