"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface MicTestModalProps {
  open: boolean;
  onClose: () => void;
  onMicCheckPassed: () => void;
}

export function MicTestModal({ open, onClose, onMicCheckPassed }: MicTestModalProps) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [volume, setVolume] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get available audio devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((device) => device.kind === "audioinput");
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch {
        setError("Failed to enumerate audio devices");
      }
    };
    getDevices();
  }, [open]);

  // Stop recording when modal closes
  useEffect(() => {
    if (!open) {
      void stopRecording();
    }
  }, [open, stopRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      setVolume(0);
      setRecordingDuration(0);
      setAudioBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        },
      });

      streamRef.current = stream;

      // Setup audio context for volume visualization
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      analyzer.fftSize = 256;
      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;

      // Start volume monitoring
      const monitorVolume = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(Math.min(100, (average / 255) * 100));
        }
      };

      const volumeInterval = setInterval(monitorVolume, 100);

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        clearInterval(volumeInterval);
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
    }
  };

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setVolume(0);
  }, [isRecording]);

  const playRecording = () => {
    if (audioBlob && !audioElementRef.current) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioElementRef.current = audio;
      audio.play().catch(() => {
        setError("Failed to play recording");
      });
    } else if (audioElementRef.current) {
      if (audioElementRef.current.paused) {
        audioElementRef.current.play();
      } else {
        audioElementRef.current.pause();
      }
    }
  };

  const handlePassed = () => {
    onMicCheckPassed();
    // Track event
    navigator.sendBeacon("/api/events", JSON.stringify({ event_type: "mic_check_passed" }));
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            Microphone Test
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600">
            Test your microphone before starting your practice session
          </Dialog.Description>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            {/* Device Selector */}
            <div>
              <label htmlFor="audio-device" className="block text-sm font-medium text-gray-700">
                Audio Device
              </label>
              <select
                id="audio-device"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={isRecording}
                className="mt-2 block w-full rounded-md border-gray-300 px-3 py-2 text-sm border shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-900">Recording...</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {formatTime(recordingDuration)}
                  </span>
                </div>

                {/* Volume Indicator */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Volume Level</span>
                    <span>{Math.round(volume)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-500 transition-all duration-100"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Audio Playback */}
            {audioBlob && !isRecording && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-900">
                  ✓ Recording saved ({(audioBlob.size / 1024).toFixed(0)} KB)
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  Duration: {formatTime(Math.round(audioBlob.size / 16000))} (estimated)
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isRecording ? (
                <>
                  <Button
                    onClick={startRecording}
                    variant="default"
                    className="flex-1"
                    disabled={!selectedDeviceId}
                  >
                    Record Test
                  </Button>
                  {audioBlob && (
                    <Button onClick={playRecording} variant="outline" className="flex-1">
                      Play Back
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full">
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Passed Button */}
            {audioBlob && !isRecording && (
              <Button
                onClick={handlePassed}
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Microphone Works ✓
              </Button>
            )}
          </div>

          <Dialog.Close className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
