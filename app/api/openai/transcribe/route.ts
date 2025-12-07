import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai/stt";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }
    const partial = formData.get("partial") === "true";
    const result = await transcribeAudio(file as Blob, partial);
    return NextResponse.json({ text: result.text, partial: result.partial });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
