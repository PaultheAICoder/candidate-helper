"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnswerInput } from "@/components/coach/AnswerInput";
import { AudioRecorder } from "@/components/coach/AudioRecorder";
import { MicTestModal } from "@/components/coach/MicTestModal";
import { CoachingFeedback } from "@/components/coach/CoachingFeedback";
import { Button } from "@/components/ui/Button";
import type { PerQuestionFeedback } from "@/types/models";

interface Question {
  id: string;
  text: string;
  order: number;
  category: string;
  followUpQuestion?: string;
  followUpUsed?: boolean;
}

interface Session {
  id: string;
  mode: "audio" | "text";
  lowAnxietyEnabled: boolean;
  perQuestionCoaching: boolean;
}

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const sessionId = params.id;

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showMicTest, setShowMicTest] = useState(false);
  const [micTestPassed, setMicTestPassed] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [currentCoaching, setCurrentCoaching] = useState<PerQuestionFeedback | null>(null);

  // Fetch session and questions on mount
  useEffect(() => {
    async function fetchSessionAndQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch session details
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionResponse.ok) {
          throw new Error("Failed to fetch session details");
        }
        const sessionData = await sessionResponse.json();
        setSession({
          id: sessionData.id,
          mode: sessionData.mode,
          lowAnxietyEnabled: sessionData.low_anxiety_enabled,
          perQuestionCoaching: sessionData.per_question_coaching || false,
        });

        // Show mic test if audio mode and first question
        if (sessionData.mode === "audio" && currentQuestionIndex === 0 && !micTestPassed) {
          setShowMicTest(true);
        }

        // Fetch questions
        const questionsResponse = await fetch(`/api/sessions/${sessionId}/questions`, {
          method: "POST",
        });

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json();
          throw new Error(errorData.error || "Failed to fetch questions");
        }

        const data = await questionsResponse.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessionAndQuestions();
  }, [sessionId]);

  const handleSubmitAnswer = async (answerText: string) => {
    if (!questions[currentQuestionIndex]) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentQuestionIndex].id,
          transcriptText: answerText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit answer");
      }

      const answerData = await response.json();

      // Mark question as answered
      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(questions[currentQuestionIndex].id);
      setAnsweredQuestions(newAnswered);

      // Handle per-question coaching if enabled
      if (session?.perQuestionCoaching && !session?.lowAnxietyEnabled) {
        try {
          const coachingResponse = await fetch(
            `/api/sessions/${sessionId}/coaching?perQuestion=true`,
            {
              method: "POST",
            }
          );

          if (coachingResponse.ok) {
            const coachingData = await coachingResponse.json();
            if (coachingData.feedback) {
              setCurrentCoaching(coachingData.feedback);
              setShowCoachingModal(true);
            }
          }
        } catch (err) {
          console.error("Error fetching per-question coaching:", err);
          // Continue without coaching if it fails
        }
      } else if (answerData.followUp && !session?.lowAnxietyEnabled) {
        // Handle follow-up question if present
        setFollowUpQuestion(answerData.followUp);
        setShowFollowUp(true);
      } else {
        // Move to next question or results page
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCurrentTranscript("");
        } else {
          // All questions answered, navigate to results
          router.push(`/practice/results/${sessionId}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranscript = (text: string, isPartial: boolean) => {
    setCurrentTranscript(text);
    if (!isPartial) {
      handleSubmitAnswer(text);
    }
  };

  const handleFollowUpAnswer = async (answerText: string) => {
    if (!followUpQuestion) return;

    setIsSubmitting(true);
    try {
      // Submit follow-up answer
      await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentQuestionIndex].id,
          transcriptText: answerText,
          isFollowUp: true,
        }),
      });

      setShowFollowUp(false);
      setFollowUpQuestion(null);

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentTranscript("");
      } else {
        router.push(`/practice/results/${sessionId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissCoachingModal = () => {
    setShowCoachingModal(false);
    setCurrentCoaching(null);

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentTranscript("");
    } else {
      // All questions answered, navigate to results
      router.push(`/practice/results/${sessionId}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading your interview questions...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold">Unable to Load Questions</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/practice")}>Return to Setup</Button>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">No Questions Available</h1>
          <p className="text-muted-foreground">
            There was a problem loading your questions. Please try again.
          </p>
          <Button onClick={() => router.push("/practice")}>Return to Setup</Button>
        </div>
      </main>
    );
  }

  // Coaching modal view
  if (showCoachingModal && currentCoaching) {
    return (
      <main className="flex min-h-screen flex-col py-12 px-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Coaching Feedback</h1>
            <p className="text-muted-foreground mt-2">Here's how you did on this question</p>
          </div>

          <CoachingFeedback
            feedback={currentCoaching}
            questionNumber={currentQuestionIndex + 1}
            lowAnxietyMode={session?.lowAnxietyEnabled}
          />

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleDismissCoachingModal}>
              Next Question
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Follow-up modal view
  if (showFollowUp && followUpQuestion) {
    return (
      <main className="flex min-h-screen flex-col py-12 px-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Follow-up Question</h1>
            <p className="text-muted-foreground mt-2">Let's dive a bit deeper to help you shine!</p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-4">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {session?.mode === "audio" ? (
            <AudioRecorder
              onTranscript={handleTranscript}
              showCaptions={true}
              disabled={isSubmitting}
            />
          ) : (
            <AnswerInput
              questionText={followUpQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onSubmit={handleFollowUpAnswer}
              isSubmitting={isSubmitting}
              isFollowUp={true}
            />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col py-12 px-6">
      {/* Mic Test Modal */}
      <MicTestModal
        open={showMicTest && session?.mode === "audio"}
        onClose={() => setShowMicTest(false)}
        onMicCheckPassed={() => {
          setMicTestPassed(true);
          setShowMicTest(false);
        }}
      />

      {/* Header */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Practice Session</h1>
            {session?.mode === "audio" && (
              <p className="text-sm text-muted-foreground mt-1">Audio Mode • Mic Test Required</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Are you sure you want to exit? Your progress will be saved.")) {
                router.push("/practice");
              }
            }}
          >
            Save & Exit
          </Button>
        </div>
      </div>

      {/* Error Banner (for submission errors) */}
      {error && (
        <div className="w-full max-w-4xl mx-auto mb-6">
          <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-4">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Answer Input or Audio Recorder */}
      {session?.mode === "audio" && micTestPassed ? (
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900">{currentQuestion.text}</p>
            <p className="text-xs text-blue-700 mt-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          {currentTranscript && (
            <div className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Your Answer (so far):</p>
              <p className="text-sm text-gray-800">{currentTranscript}</p>
            </div>
          )}

          <AudioRecorder
            onTranscript={handleTranscript}
            showCaptions={true}
            disabled={isSubmitting}
          />
        </div>
      ) : (
        <AnswerInput
          questionText={currentQuestion.text}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Navigation Hint */}
      {currentQuestionIndex > 0 && (
        <div className="w-full max-w-4xl mx-auto mt-6 text-center text-sm text-muted-foreground">
          <p>
            You've answered {answeredQuestions.size} of {questions.length} questions
          </p>
        </div>
      )}
    </main>
  );
}
