import { validateAudioBlob } from "@/lib/openai/stt";

describe("validateAudioBlob", () => {
  it("rejects short audio", () => {
    const blob = new Blob([new Uint8Array(10)], { type: "audio/webm" });
    const result = validateAudioBlob(blob);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid type", () => {
    const blob = new Blob([new Uint8Array(4000)], { type: "audio/unknown" });
    const result = validateAudioBlob(blob);
    expect(result.valid).toBe(false);
  });

  it("accepts valid audio blob", () => {
    const blob = new Blob([new Uint8Array(4000)], { type: "audio/webm" });
    const result = validateAudioBlob(blob);
    expect(result.valid).toBe(true);
  });
});
