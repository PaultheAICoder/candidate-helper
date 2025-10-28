"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { SessionMode } from "@/types/models";
import type { Session } from "@supabase/supabase-js";

export default function PracticeSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<Session["user"] | null>(null);
  const [questionCount, setQuestionCount] = useState(8);
  const [lowAnxietyMode, setLowAnxietyMode] = useState(false);
  const [mode, setMode] = useState<SessionMode>("text");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParseStatus, setResumeParseStatus] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [tailorQuestions, setTailorQuestions] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        // Allow audio mode for authenticated users
        setMode("audio");
      }
    };

    checkAuth();
  }, [supabase]);

  // Handle resume file upload
  const handleResumeUpload = async (file: File) => {
    if (!file) return;

    setResumeFile(file);
    setResumeParseStatus("Uploading and parsing resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResumeParseStatus(`Error: ${errorData.error}`);
        setResumeFile(null);
        return;
      }

      const data = await response.json();
      setResumeParseStatus(
        `✓ Resume parsed! Found ${data.parsedData.skills?.length || 0} skills`
      );
    } catch (err) {
      setResumeParseStatus(
        err instanceof Error ? `Error: ${err.message}` : "Error parsing resume"
      );
      setResumeFile(null);
    }
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionPayload = {
        mode: user ? mode : "text", // Force text for guests
        questionCount: lowAnxietyMode ? 3 : questionCount,
        lowAnxietyEnabled: lowAnxietyMode,
        jobDescriptionText: jobDescription || undefined,
        tailorQuestions: user && tailorQuestions,
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionPayload),
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
          {/* Authenticated User Section */}
          {user && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Personalize Your Practice</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume and paste a job description to get tailored interview questions
              </p>

              {/* Resume Upload */}
              <div className="mb-4">
                <Label className="mb-2 block">Resume (TXT or MD)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="resume-input"
                    accept=".txt,.md"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                    className="flex-1 text-sm"
                    aria-label="Upload resume file"
                  />
                </div>
                {resumeParseStatus && (
                  <p className="text-xs mt-2 text-muted-foreground">{resumeParseStatus}</p>
                )}
              </div>

              {/* Job Description */}
              <div>
                <Label htmlFor="job-desc" className="mb-2 block">
                  Job Description
                </Label>
                <Textarea
                  id="job-desc"
                  placeholder="Paste the job description here for tailored questions..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="text-sm"
                  aria-label="Paste job description text"
                />
              </div>

              {/* Tailor Questions Toggle */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tailor-questions"
                  checked={tailorQuestions && !!resumeFile}
                  onChange={(e) => setTailorQuestions(e.target.checked)}
                  disabled={!resumeFile}
                  className="h-4 w-4 rounded"
                  aria-label="Generate tailored questions from resume and job description"
                />
                <Label htmlFor="tailor-questions" className="text-sm cursor-pointer">
                  Generate tailored questions
                </Label>
              </div>
            </div>
          )}

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

          {/* Mode Information */}
          <div className="space-y-3">
            <Label>Response Mode</Label>
            {user ? (
              <div className="space-y-2">
                <label className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="mode"
                    value="audio"
                    checked={mode === "audio"}
                    onChange={(e) => setMode(e.target.value as SessionMode)}
                    className="mt-1"
                    aria-label="Audio mode - speak your answers"
                  />
                  <div>
                    <h4 className="font-semibold mb-1">🎙️ Audio Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Speak your answers with real-time transcription. Feels more natural and
                      realistic.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  <input
                    type="radio"
                    name="mode"
                    value="text"
                    checked={mode === "text"}
                    onChange={(e) => setMode(e.target.value as SessionMode)}
                    className="mt-1"
                    aria-label="Text mode - type your answers"
                  />
                  <div>
                    <h4 className="font-semibold mb-1">✍️ Text Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Type your answers. Great for accessibility and thoughtful responses.
                    </p>
                  </div>
                </label>
              </div>
            ) : (
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
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                <strong>Want audio mode?</strong> Create a free account to unlock audio recording with
                real-time transcription.
              </p>
            )}
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
