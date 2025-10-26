"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnswerInput } from "@/components/coach/AnswerInput";
import { Button } from "@/components/ui/Button";

interface Question {
  id: string;
  text: string;
  order: number;
  category: string;
}

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const sessionId = params.id;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  // Fetch questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/questions`, {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch questions");
        }

        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
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

      // Mark question as answered
      const newAnswered = new Set(answeredQuestions);
      newAnswered.add(questions[currentQuestionIndex].id);
      setAnsweredQuestions(newAnswered);

      // Move to next question or results page
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered, navigate to results
        router.push(`/practice/results/${sessionId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
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

  return (
    <main className="flex min-h-screen flex-col py-12 px-6">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Practice Session</h1>
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

      {/* Answer Input */}
      <AnswerInput
        questionText={currentQuestion.text}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onSubmit={handleSubmitAnswer}
        isSubmitting={isSubmitting}
      />

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
