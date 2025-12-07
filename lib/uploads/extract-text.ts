import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const ALLOWED_MIMETYPES = [PDF_TYPE, DOCX_TYPE, "text/plain", "text/markdown"];

/**
 * Extract text from supported resume file types.
 */
export async function extractTextFromFile(file: File, buffer: Buffer): Promise<string> {
  const mimetype = file.type;

  if (mimetype === PDF_TYPE) {
    const result = await pdfParse(buffer);
    if (!result.text) throw new Error("Unable to parse PDF text");
    return result.text;
  }

  if (mimetype === DOCX_TYPE) {
    const { value } = await mammoth.extractRawText({ buffer });
    if (!value) throw new Error("Unable to parse DOCX text");
    return value;
  }

  if (mimetype === "text/plain" || mimetype === "text/markdown") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}
