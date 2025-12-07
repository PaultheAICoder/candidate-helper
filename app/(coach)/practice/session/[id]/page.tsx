"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnswerInput } from "@/components/coach/AnswerInput";
import { AudioRecorder } from "@/components/coach/AudioRecorder";

interface Question {
  id: string;
  question_text: string;
  question_order: number;
}

interface SessionDetails {
  id: string;
  question_count: number;
  low_anxiety_enabled: boolean;
}

export default function ActiveSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"audio" | "text">("text");
  const [pendingNext, setPendingNext] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRes = await fetch(`/api/sessions/${params.id}`, { cache: "no-store" });
        if (!sessionRes.ok) {
          setError("Session not found");
          return;
        }
        const sessionData = await sessionRes.json();
        setSession({
          id: sessionData.id,
          question_count: sessionData.question_count,
          low_anxiety_enabled: sessionData.low_anxiety_enabled ?? false,
        });
        setMode(sessionData.mode);

        const questionsRes = await fetch(`/api/sessions/${params.id}/questions`, {
          cache: "no-store",
        });
        if (!questionsRes.ok) {
          setError("Unable to load questions for this session.");
          return;
        }
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions || []);
        setDraftLoaded(false); // re-fetch draft after questions load
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred while loading the session.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  const loadDraft = useCallback(async () => {
    if (!session || questions.length === 0 || draftLoaded) return;
    try {
      const res = await fetch(`/api/sessions/${params.id}/draft`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const draft = data.draft as
        | {
            currentQuestionId?: string;
            currentIndex?: number;
            answers?: Record<string, { text?: string }>;
            mode?: "audio" | "text";
            updatedAt?: string;
          }
        | null;
      if (draft?.answers) {
        const mapped: Record<string, string> = {};
        Object.entries(draft.answers).forEach(([qid, value]) => {
          if (value?.text) mapped[qid] = value.text;
        });
        setDraftAnswers(mapped);
      }
      let nextIndex: number | null = null;
      if (typeof draft?.currentIndex === "number" && draft.currentIndex < questions.length) {
        nextIndex = draft.currentIndex;
      } else if (draft?.currentQuestionId) {
        const idx = questions.findIndex((q) => q.id === draft.currentQuestionId);
        if (idx >= 0) nextIndex = idx;
      } else if (draft?.answers && Object.keys(draft.answers).length > 0) {
        // Fallback: continue after the highest-ordered answered question
        const answeredIds = new Set(Object.keys(draft.answers));
        const maxAnsweredIdx = questions.reduce((max, q, idx) => {
          if (answeredIds.has(q.id) && idx > max) return idx;
          return max;
        }, -1);
        if (maxAnsweredIdx >= 0) {
          nextIndex = Math.min(maxAnsweredIdx + 1, questions.length - 1);
        }
      }
      if (nextIndex !== null && nextIndex >= 0 && nextIndex < questions.length) {
        setCurrentIdx(nextIndex);
      }
      if (draft?.mode) setMode(draft.mode);
      if (draft?.updatedAt) setLastSavedAt(draft.updatedAt);
      setRestored(true);
    } catch {
      // silent draft load failure
    } finally {
      setDraftLoaded(true);
    }
  }, [draftLoaded, params.id, questions, session]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const handleAnswerSubmit = useCallback(
    async (
      answer: string,
      extras?: { durationSeconds?: number; retakeUsed?: boolean; extensionUsed?: boolean }
    ) => {
      if (!session || !currentQuestion) return;

      const previousIndex = currentIdx;
      const nextIndex = previousIndex + 1;
      const isLastQuestion = nextIndex >= questions.length;

      setIsSubmitting(true);
      setError(null);

      if (isLastQuestion) {
        setPendingCompletion(true);
      } else {
        setPendingNext(true);
        setCurrentIdx(nextIndex); // optimistic advance
      }

      try {
        const payload = {
          sessionId: session.id,
          questionId: currentQuestion.id,
          transcriptText: answer,
          durationSeconds: extras?.durationSeconds,
          retakeUsed: extras?.retakeUsed,
          extensionUsed: extras?.extensionUsed,
          isFollowUp: false,
        };

        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit answer");
        }

        if (isLastQuestion) {
      await fetch(`/api/sessions/${session.id}/draft`, { method: "DELETE" });
      router.push(`/practice/results/${session.id}`);
        } else {
          setDraftAnswers((prev) => {
            const next = { ...prev };
            delete next[currentQuestion.id];
            return next;
          });
        }
      } catch (err) {
        if (!isLastQuestion) {
          setCurrentIdx(previousIndex); // rollback optimistic jump
        }
        setError(err instanceof Error ? err.message : "Failed to submit answer");
      } finally {
        setPendingNext(false);
        setPendingCompletion(false);
        setIsSubmitting(false);
      }
    },
    [currentIdx, currentQuestion, questions.length, router, session]
  );

  const saveDraft = useCallback(async () => {
    if (!session || !currentQuestion) return;
    if (isSubmitting || pendingNext || pendingCompletion) return;

    const hasContent = Object.keys(draftAnswers).length > 0;
    if (!hasContent && currentIdx === 0) return;

    const payload = {
      currentQuestionId: currentQuestion.id,
      currentIndex: currentIdx,
      mode,
      answers: Object.fromEntries(
        Object.entries(draftAnswers).map(([id, text]) => [id, { text }])
      ),
    };

    try {
      const res = await fetch(`/api/sessions/${session.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setLastSavedAt(saved.draft?.updatedAt ?? new Date().toISOString());
      }
    } catch (err) {
      console.warn("Autosave failed", err);
    }
  }, [currentIdx, currentQuestion, draftAnswers, isSubmitting, mode, pendingCompletion, pendingNext, session]);

  useEffect(() => {
    const interval = setInterval(() => {
      void saveDraft();
    }, 20000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </main>
    );
  }

  if (error || !session || questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{error || "Session is unavailable."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Session {session.id.slice(0, 8)} •{" "}
            {session.low_anxiety_enabled ? "Low-Anxiety Mode" : "Standard Mode"}
          </p>
          <h1 className="text-3xl font-bold">Answer the question below</h1>
          <p className="text-muted-foreground">
            Share a concise STAR story. You can use Ctrl/Cmd + Enter to submit.
          </p>
          {(pendingNext || pendingCompletion) && (
            <p className="text-sm text-primary">
              {pendingCompletion ? "Saving your final answer..." : "Saved! Loading the next question..."}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Autosave every 20s{" "}
              {restored ? "• Draft restored" : ""}
              {lastSavedAt ? ` • Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
            </span>
            <button
              className="text-primary underline"
              onClick={() => {
                setDraftAnswers({});
                setLastSavedAt(null);
                setRestored(false);
                if (session) {
                  fetch(`/api/sessions/${session.id}/draft`, { method: "DELETE" }).catch(() => {});
                }
              }}
            >
              Discard draft
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-4">
            <p className="text-sm font-medium">{error}</p>
            <button
              className="text-sm underline mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {mode === "audio" ? (
          <AudioRecorder
            onTranscript={(text) => {
              if (currentQuestion) {
                setDraftAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
              }
            }}
            onFinal={(data) => {
              handleAnswerSubmit(data.transcript, {
                durationSeconds: data.durationSeconds,
                retakeUsed: data.retakeUsed,
                extensionUsed: data.extensionUsed,
              });
            }}
          />
        ) : (
          <AnswerInput
            questionText={currentQuestion.question_text}
            questionNumber={currentIdx + 1}
            totalQuestions={questions.length}
            onSubmit={(text) => handleAnswerSubmit(text)}
            onChangeText={(value) => {
              if (currentQuestion) {
                setDraftAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
              }
            }}
            initialAnswer={draftAnswers[currentQuestion.id] ?? ""}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </main>
  );
}
