/**
 * Speech-to-Text (STT) utility using OpenAI Whisper API
 * Supports real-time partial transcription and final transcripts
 */

import OpenAI from "openai";
import { trackCost } from "@/lib/utils/cost-tracker";

interface TranscriptionResult {
  text: string;
  partial: boolean;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio blob using OpenAI Whisper API
 * @param audioBlob - WebM audio blob from MediaRecorder
 * @param partial - If true, return partial transcript for real-time display
 * @returns TranscriptionResult with text and metadata
 */
export async function transcribeAudio(
  audioBlob: Blob,
  partial: boolean = false
): Promise<TranscriptionResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    // Convert blob to File for OpenAI SDK
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    // Call Whisper API
    const transcript = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en", // English only for MVP
      response_format: "json",
      temperature: 0.2, // Lower temperature for more consistent transcription
    });

    const text = transcript.text.trim();

    // Track API cost: Whisper charges $0.02 per minute of audio
    // Estimate duration from audio blob size (rough heuristic)
    const estimatedDurationMinutes = Math.max(1, Math.ceil(audioBlob.size / 12000)); // ~12KB per minute
    const costUSD = estimatedDurationMinutes * 0.02;

    await trackCost({
      model: "whisper-1",
      tokensUsed: 0, // Whisper uses duration-based pricing, not tokens
      audioSeconds: estimatedDurationMinutes * 60,
      estimatedCostUsd: costUSD,
    });

    return {
      text,
      partial,
      language: "en",
      duration: estimatedDurationMinutes * 60,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown transcription error";
    console.error("[STT Error]", message, { audioSize: audioBlob.size });

    // Re-throw with context for proper error handling
    throw new Error(`Failed to transcribe audio: ${message}`);
  }
}

/**
 * Streaming transcription with real-time partial results
 * Note: For MVP, we use periodic polling instead of true streaming
 * This function demonstrates the interface for future WebSocket-based streaming
 */
export async function transcribeAudioStreaming(
  audioBlob: Blob,
  onPartial: (text: string) => void,
  onFinal: (text: string) => void
): Promise<void> {
  // For MVP, we do a single call and immediately return the full result
  // In production, this would support true streaming via WebSocket or EventSource
  const result = await transcribeAudio(audioBlob, false);
  onPartial(result.text);
  onFinal(result.text);
}

/**
 * Validate audio quality before transcription
 * Returns metadata about the audio
 */
export async function getAudioMetadata(audioBlob: Blob): Promise<{
  size: number;
  type: string;
  estimatedDuration: number;
}> {
  // Rough estimation: WebM audio at 16kHz, 16-bit mono ≈ 16KB per 6 seconds
  const estimatedSeconds = (audioBlob.size / 16000) * 6;

  return {
    size: audioBlob.size,
    type: audioBlob.type,
    estimatedDuration: Math.round(estimatedSeconds),
  };
}

/**
 * Check if audio blob is valid for transcription
 */
export function validateAudioBlob(audioBlob: Blob): { valid: boolean; error?: string } {
  // Minimum audio: 100ms
  if (audioBlob.size < 2000) {
    return { valid: false, error: "Audio too short (minimum 100ms)" };
  }

  // Maximum audio: 25MB (OpenAI limit)
  if (audioBlob.size > 25 * 1024 * 1024) {
    return { valid: false, error: "Audio too long (maximum 25MB)" };
  }

  // Validate MIME type
  const validTypes = ["audio/webm", "audio/mpeg", "audio/wav", "audio/flac", "audio/m4a"];
  if (!validTypes.includes(audioBlob.type)) {
    return { valid: false, error: `Invalid audio format: ${audioBlob.type}` };
  }

  return { valid: true };
}
