"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import type { SessionMode } from "@/types/models";

export default function PracticeSetupPage() {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(8);
  const [lowAnxietyMode, setLowAnxietyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest users default to text mode
  const mode: SessionMode = "text";

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          questionCount: lowAnxietyMode ? 3 : questionCount,
          lowAnxietyEnabled: lowAnxietyMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const data = await response.json();

      // Redirect to the session page
      router.push(`/practice/session/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Set Up Your Practice Session</h1>
          <p className="text-lg text-muted-foreground">
            Customize your interview practice experience
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8 space-y-8">
          {/* Low-Anxiety Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="low-anxiety-toggle"
                aria-label="Enable Low-Anxiety Mode for gentler interview practice"
                checked={lowAnxietyMode}
                onChange={(e) => setLowAnxietyMode(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <Label htmlFor="low-anxiety-toggle" className="cursor-pointer">
                Low-Anxiety Mode
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              A gentler experience with only 3 questions, no numeric scores, and supportive
              feedback. Perfect if you're feeling nervous about interviews.
            </p>
          </div>

          {/* Question Count Selection */}
          {!lowAnxietyMode && (
            <div className="space-y-3">
              <Label htmlFor="question-count">Question Count</Label>
              <Select
                id="question-count"
                aria-label="Number of questions to practice"
                value={questionCount.toString()}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              >
                <option value="3">3 questions (~15 minutes)</option>
                <option value="5">5 questions (~25 minutes)</option>
                <option value="8">8 questions (~40 minutes)</option>
                <option value="10">10 questions (~50 minutes)</option>
              </Select>
              <p className="text-sm text-muted-foreground">
                More questions provide more comprehensive feedback but take longer to complete.
              </p>
            </div>
          )}

          {/* Mode Information (Text-only for guests) */}
          <div className="space-y-3">
            <Label>Response Mode</Label>
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✍️</div>
                <div>
                  <h4 className="font-semibold mb-1">Text Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Type your answers using the text editor. Great for accessibility and thoughtful
                    responses.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Want audio mode?</strong> Create a free account to unlock audio recording with
              real-time transcription.
            </p>
          </div>

          {/* Session Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What to Expect</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  You'll receive <strong>generic behavioral questions</strong> about conflict,
                  leadership, and collaboration
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Answer each question thoughtfully using the <strong>STAR framework</strong>{" "}
                  (Situation, Task, Action, Result)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Get <strong>detailed coaching feedback</strong> at the end with strengths and
                  example improved answers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Your session takes about{" "}
                  <strong>{lowAnxietyMode ? "15" : questionCount * 5} minutes</strong> to complete
                </span>
              </li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-4">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Start Button */}
          <Button size="lg" className="w-full" onClick={handleStartSession} disabled={isLoading}>
            {isLoading ? "Creating Session..." : "Start Practice"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            No account required • Free forever • Your data stays private
          </p>
        </div>
      </div>
    </main>
  );
}
