"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Mic, Square, Repeat2, Clock } from "lucide-react";

const MAX_DURATION = 180; // 3 minutes
const EXTENSION_DURATION = 30; // +30 seconds once

interface AudioRecorderProps {
  onTranscript: (transcript: string, isPartial: boolean) => void;
  onFinal?: (data: { transcript: string; durationSeconds: number; retakeUsed: boolean; extensionUsed: boolean }) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  showCaptions?: boolean;
}

export function AudioRecorder({
  onTranscript,
  onFinal,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  showCaptions = true,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [captions, setCaptions] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [extensionUsed, setExtensionUsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const maxDuration = extensionUsed ? MAX_DURATION + EXTENSION_DURATION : MAX_DURATION;

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setCaptions("");
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob, false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      onRecordingStart?.();

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onRecordingStop?.();
  }, [isRecording, onRecordingStop]);

  // Transcribe audio
  const transcribeAudio = async (blob: Blob, isPartial: boolean) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("partial", isPartial.toString());

      const response = await fetch("/api/openai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      const transcript = data.text || "";

      setCaptions(transcript);
      onTranscript(transcript, isPartial);

      if (!isPartial && onFinal) {
        onFinal({
          transcript,
          durationSeconds: duration,
          retakeUsed,
          extensionUsed,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription error";
      setError(message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Retake recording
  const handleRetake = () => {
    setCaptions("");
    chunksRef.current = [];
    setDuration(0);
    startRecording();
  };

  // Add 30 seconds extension
  const handleExtension = () => {
    if (!extensionUsed) {
      setExtensionUsed(true);
      // Extension already handled in maxDuration check
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeRemaining = maxDuration - duration;
  const isWarning = timeRemaining <= 30;
  const isExpired = timeRemaining <= 0;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Recording State */}
      {isRecording && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium text-gray-900">Recording...</span>
            </div>
            <div
              className={`text-sm font-mono font-bold ${
                isWarning ? "text-red-600" : "text-gray-600"
              }`}
            >
              {formatTime(duration)} / {formatTime(maxDuration)}
            </div>
          </div>

          {isWarning && (
            <p className="mt-2 text-xs text-red-600">⚠️ {timeRemaining} seconds remaining</p>
          )}
        </div>
      )}

      {/* Captions Display */}
      {showCaptions && captions && (
        <div className="rounded-md bg-white p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Live Captions:</p>
          <p className="text-sm text-gray-800">{captions}</p>
          {isTranscribing && <p className="mt-2 text-xs text-gray-500">Transcribing...</p>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={disabled || isExpired}
            className="flex-1"
            variant="default"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            disabled={disabled}
            variant="destructive"
            className="flex-1"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {isRecording && (
          <>
            {!extensionUsed && timeRemaining <= 60 && (
              <Button
                onClick={handleExtension}
                variant="outline"
                title="Add 30 more seconds (can only use once)"
              >
                <Clock className="mr-2 h-4 w-4" />
                +30s
              </Button>
            )}
          </>
        )}

        {captions && !isRecording && !isTranscribing && (
          <Button onClick={handleRetake} variant="outline" disabled={disabled} title="Record again">
            <Repeat2 className="mr-2 h-4 w-4" />
            Retake
          </Button>
        )}
      </div>

      {/* Accessibility Note */}
      <p className="text-xs text-gray-500">
        Maximum recording time: {formatTime(maxDuration)}. Clear audio with minimal background noise
        works best.
      </p>
    </div>
  );
}
