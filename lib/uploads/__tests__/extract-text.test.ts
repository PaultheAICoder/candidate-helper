/**
 * Tests for extractTextFromFile helper; mocks heavy parsers.
 */
import { extractTextFromFile } from "@/lib/uploads/extract-text";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

jest.mock("pdf-parse", () => jest.fn(async () => ({ text: "PDF CONTENT" })));
jest.mock("mammoth", () => ({
  extractRawText: jest.fn(async () => ({ value: "DOCX CONTENT" })),
}));

describe("extractTextFromFile", () => {
  it("parses PDF via pdf-parse", async () => {
    const file = new File(["dummy"], "resume.pdf", { type: "application/pdf" });
    const buffer = Buffer.from("PDF");
    const text = await extractTextFromFile(file, buffer);
    expect(text).toBe("PDF CONTENT");
    expect(pdfParse).toHaveBeenCalled();
  });

  it("parses DOCX via mammoth", async () => {
    const file = new File(["dummy"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const buffer = Buffer.from("DOCX");
    const text = await extractTextFromFile(file, buffer);
    expect(text).toBe("DOCX CONTENT");
    expect(mammoth.extractRawText).toHaveBeenCalled();
  });

  it("parses plain text buffers", async () => {
    const file = new File(["hello"], "resume.txt", { type: "text/plain" });
    const buffer = Buffer.from("hello");
    const text = await extractTextFromFile(file, buffer);
    expect(text).toBe("hello");
  });
});
