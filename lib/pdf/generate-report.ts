import { PDFDocument, rgb } from "pdf-lib";

interface ReportContent {
  strengths: unknown[];
  clarifications: unknown[];
  per_question_feedback: unknown[];
  isLowAnxietyMode?: boolean;
}

export async function generateCoachingReportPDF(content: ReportContent): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add title page
  let page = pdfDoc.addPage([612, 792]); // Letter size (8.5" x 11")
  const { height } = page.getSize();
  let yPosition = height - 50;

  // Title
  page.drawText("Your Coaching Report", {
    x: 50,
    y: yPosition,
    size: 32,
    color: rgb(0, 0, 0),
  });

  yPosition -= 50;

  // Subtitle
  page.drawText("Personalized Interview Coaching Feedback", {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPosition -= 40;

  // Generated timestamp
  const now = new Date();
  page.drawText(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, {
    x: 50,
    y: yPosition,
    size: 10,
    color: rgb(0.6, 0.6, 0.6),
  });

  yPosition -= 60;

  // Page break line
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 562, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  yPosition -= 40;

  // Strengths Section
  page.drawText("💪 Top 3 Strengths", {
    x: 50,
    y: yPosition,
    size: 18,
    color: rgb(0, 0.5, 0),
  });

  yPosition -= 30;

  if (content.strengths.length === 0) {
    page.drawText("No strengths identified yet.", {
      x: 70,
      y: yPosition,
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 20;
  } else {
    for (let i = 0; i < Math.min(content.strengths.length, 3); i++) {
      const strength = content.strengths[i];
      if (!strength || typeof strength !== "object" || !("text" in strength)) continue;

      // Ensure enough space for content
      if (yPosition < 100) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }

      // Strength title
      const strengthText = typeof strength.text === "string" ? strength.text : "Unnamed strength";
      page.drawText(`${i + 1}. ${strengthText}`, {
        x: 70,
        y: yPosition,
        size: 12,
        color: rgb(0, 0, 0),
      });

      yPosition -= 20;

      // Evidence text (wrapped)
      const evidenceText =
        "evidence" in strength && typeof strength.evidence === "string" ? strength.evidence : "";
      const evidenceLines = wrapText(`Evidence: ${evidenceText}`, 80);
      for (const line of evidenceLines) {
        if (yPosition < 50) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 90,
          y: yPosition,
          size: 10,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 16;
      }

      yPosition -= 10;
    }
  }

  yPosition -= 20;

  // Clarifications Section
  if (yPosition < 150) {
    page = pdfDoc.addPage([612, 792]);
    yPosition = height - 50;
  }

  page.drawText("📝 3 Clarifications", {
    x: 50,
    y: yPosition,
    size: 18,
    color: rgb(0.5, 0, 0),
  });

  yPosition -= 30;

  if (content.clarifications.length === 0) {
    page.drawText("No clarifications needed at this time.", {
      x: 70,
      y: yPosition,
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 20;
  } else {
    for (let i = 0; i < Math.min(content.clarifications.length, 3); i++) {
      const clarification = content.clarifications[i];
      if (!clarification || typeof clarification !== "object" || !("suggestion" in clarification))
        continue;

      if (yPosition < 100) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }

      // Clarification title
      const suggestionText =
        typeof clarification.suggestion === "string"
          ? clarification.suggestion
          : "Unnamed clarification";
      page.drawText(`${i + 1}. ${suggestionText}`, {
        x: 70,
        y: yPosition,
        size: 12,
        color: rgb(0, 0, 0),
      });

      yPosition -= 20;

      // Rationale text (wrapped)
      const rationaleText =
        "rationale" in clarification && typeof clarification.rationale === "string"
          ? clarification.rationale
          : "";
      const rationaleLines = wrapText(`Why: ${rationaleText}`, 80);
      for (const line of rationaleLines) {
        if (yPosition < 50) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 90,
          y: yPosition,
          size: 10,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 16;
      }

      yPosition -= 10;
    }
  }

  yPosition -= 20;

  // Per-Question Feedback Section
  if (yPosition < 150) {
    page = pdfDoc.addPage([612, 792]);
    yPosition = height - 50;
  }

  page.drawText("💬 Per-Question Feedback", {
    x: 50,
    y: yPosition,
    size: 18,
    color: rgb(0, 0, 0.5),
  });

  yPosition -= 30;

  // Add per-question feedback
  for (let i = 0; i < content.per_question_feedback.length; i++) {
    const feedback = content.per_question_feedback[i];
    if (!feedback || typeof feedback !== "object") continue;

    if (yPosition < 150) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = height - 50;
    }

    // Question number
    page.drawText(`Question ${i + 1}`, {
      x: 70,
      y: yPosition,
      size: 13,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    // Coaching narrative
    if ("narrative" in feedback && typeof feedback.narrative === "string" && feedback.narrative) {
      const narrativeLines = wrapText(`Coaching: ${feedback.narrative}`, 75);
      for (const line of narrativeLines) {
        if (yPosition < 50) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 90,
          y: yPosition,
          size: 10,
          color: rgb(0.4, 0.4, 0.4),
        });
        yPosition -= 16;
      }
    }

    // Example answer
    if (
      "example_answer" in feedback &&
      typeof feedback.example_answer === "string" &&
      feedback.example_answer
    ) {
      yPosition -= 5;
      if (yPosition < 50) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
      }

      page.drawText("Example Answer:", {
        x: 90,
        y: yPosition,
        size: 10,
        color: rgb(0, 0.5, 0),
      });
      yPosition -= 16;

      const exampleLines = wrapText(feedback.example_answer as string, 75);
      for (const line of exampleLines) {
        if (yPosition < 50) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: 100,
          y: yPosition,
          size: 9,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 14;
      }
    }

    yPosition -= 15;
  }

  // Footer
  if (yPosition < 50) {
    page = pdfDoc.addPage([612, 792]);
    yPosition = height - 50;
  }

  yPosition -= 40;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 562, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  yPosition -= 20;

  page.drawText("Generated by Cindy from Cinder - Your AI Interview Coach", {
    x: 50,
    y: yPosition,
    size: 9,
    color: rgb(0.6, 0.6, 0.6),
  });

  yPosition -= 16;

  page.drawText("This report is confidential and for your personal use only.", {
    x: 50,
    y: yPosition,
    size: 9,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
}

/**
 * Wraps text to fit within a specified character width
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      if (currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        // Word is longer than maxChars, add it anyway
        lines.push(word);
        currentLine = "";
      }
    } else {
      currentLine += (currentLine.length > 0 ? " " : "") + word;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.trim());
  }

  return lines;
}
