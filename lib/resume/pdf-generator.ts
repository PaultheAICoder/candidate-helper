/**
 * PDF Resume Generator
 * Creates professional PDF resumes using pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ResumeData } from "@/lib/types/resume-builder";

const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  mediumGray: rgb(0.4, 0.4, 0.4),
  blue: rgb(0, 0.4, 0.8),
};

const MARGINS = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
};

const PAGE_WIDTH = 612; // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches
const TEXT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

export async function generateResumePDF(data: ResumeData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = PAGE_HEIGHT - MARGINS.top;

  // Header - Name and Contact
  if (data.basic_info) {
    const { full_name, email, phone, location, linkedin_url } = data.basic_info;

    // Name
    if (full_name) {
      page.drawText(full_name.toUpperCase(), {
        x: MARGINS.left,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: COLORS.black,
      });
      yPosition -= 25;
    }

    // Contact info
    const contactParts = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (location) contactParts.push(location);

    if (contactParts.length > 0) {
      page.drawText(contactParts.join(" • "), {
        x: MARGINS.left,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.mediumGray,
      });
      yPosition -= 15;
    }

    if (linkedin_url) {
      page.drawText(linkedin_url, {
        x: MARGINS.left,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: COLORS.blue,
      });
      yPosition -= 20;
    }

    yPosition -= 10; // Extra spacing after header
  }

  // Professional Summary
  if (data.summary) {
    page.drawText("PROFESSIONAL SUMMARY", {
      x: MARGINS.left,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPosition -= 15;

    const summaryLines = wrapText(data.summary, TEXT_WIDTH, helvetica, 10);
    for (const line of summaryLines) {
      page.drawText(line, {
        x: MARGINS.left,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.darkGray,
      });
      yPosition -= 14;
    }

    yPosition -= 10;
  }

  // Work Experience
  if (data.work_history && data.work_history.length > 0) {
    page.drawText("PROFESSIONAL EXPERIENCE", {
      x: MARGINS.left,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPosition -= 18;

    for (const job of data.work_history) {
      // Job title and company
      page.drawText(job.title, {
        x: MARGINS.left,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: COLORS.black,
      });
      yPosition -= 14;

      const dateRange = `${job.start_date} - ${job.is_current ? "Present" : job.end_date}`;
      page.drawText(`${job.company} • ${dateRange}`, {
        x: MARGINS.left,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.mediumGray,
      });
      yPosition -= 16;

      // Achievements
      for (const bullet of job.enhanced_bullets) {
        const bulletLines = wrapText(`• ${bullet}`, TEXT_WIDTH - 10, helvetica, 10);
        for (const line of bulletLines) {
          page.drawText(line, {
            x: MARGINS.left + 10,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: COLORS.darkGray,
          });
          yPosition -= 13;
        }
      }

      yPosition -= 8;

      // Check if we need a new page
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - MARGINS.top;
      }
    }

    yPosition -= 5;
  }

  // Education
  if (data.education && data.education.length > 0) {
    page.drawText("EDUCATION", {
      x: MARGINS.left,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPosition -= 18;

    for (const edu of data.education) {
      page.drawText(edu.degree, {
        x: MARGINS.left,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: COLORS.black,
      });
      yPosition -= 14;

      const eduDetails = [edu.institution];
      if (edu.field) eduDetails.push(edu.field);
      if (edu.graduation_year) eduDetails.push(edu.graduation_year);

      page.drawText(eduDetails.join(" • "), {
        x: MARGINS.left,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.mediumGray,
      });
      yPosition -= 16;
    }

    yPosition -= 5;
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    page.drawText("SKILLS", {
      x: MARGINS.left,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: COLORS.black,
    });
    yPosition -= 15;

    const skillsText = data.skills.join(" • ");
    const skillLines = wrapText(skillsText, TEXT_WIDTH, helvetica, 10);

    for (const line of skillLines) {
      page.drawText(line, {
        x: MARGINS.left,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: COLORS.darkGray,
      });
      yPosition -= 13;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
