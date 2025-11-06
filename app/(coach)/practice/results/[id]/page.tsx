"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoachingFeedback } from "@/components/coach/CoachingFeedback";
import { Button } from "@/components/ui/Button";
import type { Strength, Clarification, PerQuestionFeedback } from "@/types/models";

interface Report {
  id: string;
  strengths: Strength[];
  clarifications: Clarification[];
  per_question_feedback: PerQuestionFeedback[];
  lowAnxietyMode?: boolean;
}

interface ResultsPageProps {
  params: {
    id: string;
  };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const router = useRouter();
  const sessionId = params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    async function generateAndFetchReport() {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate coaching (triggers OpenAI analysis)
        const coachingResponse = await fetch(`/api/sessions/${sessionId}/coaching`, {
          method: "POST",
        });

        if (!coachingResponse.ok) {
          const errorData = await coachingResponse.json();
          throw new Error(errorData.error || "Failed to generate coaching");
        }

        const { reportId } = await coachingResponse.json();

        // Fetch the complete report
        const reportResponse = await fetch(`/api/reports/${reportId}`);

        if (!reportResponse.ok) {
          throw new Error("Failed to fetch report");
        }

        const reportData = await reportResponse.json();
        setReport(reportData);
        setIsGuest(reportData.isGuest ?? true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsGenerating(false);
        setIsLoading(false);
      }
    }

    generateAndFetchReport();
  }, [sessionId]);

  async function handleDownloadPDF() {
    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`/api/reports/${report?.id}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `coaching-report-${report?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloadingPDF(false);
    }
  }

  // Loading state
  if (isLoading || isGenerating) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Generating Your Report</h2>
            <p className="text-muted-foreground">
              Our AI coach is analyzing your answers and preparing personalized feedback...
            </p>
            <p className="text-sm text-muted-foreground mt-4">This typically takes 10-15 seconds</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold">Unable to Generate Report</h1>
          <p className="text-muted-foreground">{error || "An unexpected error occurred"}</p>
          <Button onClick={() => router.push("/practice")}>Start New Session</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-5xl">🎯</div>
          <h1 className="text-4xl font-bold">Your Coaching Report</h1>
          <p className="text-lg text-muted-foreground">
            {report.lowAnxietyMode
              ? "Here are your strengths and areas to highlight"
              : "Here's how you did and where you can improve"}
          </p>
        </div>

        {/* Guest Sign-up Nudge Banner */}
        {isGuest && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Want to Unlock More Features?</h3>
                <p className="text-muted-foreground">
                  Create a free account to upload your resume, practice with audio recording, get
                  tailored questions, and receive daily job matches!
                </p>
              </div>
              <Link href="/login">
                <Button size="lg" className="whitespace-nowrap">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Three-Pane Report */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pane 1: Top 3 Strengths */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💪</div>
              <h2 className="text-2xl font-bold">Top 3 Strengths</h2>
            </div>

            <div className="space-y-4">
              {report.strengths.map((strength, index) => (
                <div key={index} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{strength.text}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Evidence:</strong> {strength.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pane 2: 3 Clarifications */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">📝</div>
              <h2 className="text-2xl font-bold">
                {report.lowAnxietyMode ? "Areas to Highlight" : "3 Clarifications"}
              </h2>
            </div>

            <div className="space-y-4">
              {report.clarifications.map((clarification, index) => (
                <div key={index} className="bg-muted/50 border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{clarification.suggestion}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Why:</strong> {clarification.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pane 3: Per-Question Feedback */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">💬</div>
            <h2 className="text-2xl font-bold">Per-Question Feedback</h2>
          </div>

          <div className="space-y-4">
            {report.per_question_feedback.map((feedback, index) => (
              <CoachingFeedback
                key={feedback.question_id}
                feedback={feedback}
                questionNumber={index + 1}
                lowAnxietyMode={report.lowAnxietyMode}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button size="lg" onClick={() => router.push("/practice")}>
            Start New Practice Session
          </Button>

          {!isGuest && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
            >
              {isDownloadingPDF ? "Downloading..." : "Download Report as PDF"}
            </Button>
          )}
        </div>

        {/* Footer Message */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            {report.lowAnxietyMode
              ? "You're doing great! This feedback is here to support you as you prepare for interviews."
              : "Remember: This feedback is based on your practice answers. Keep practicing to improve!"}
          </p>
          {isGuest && (
            <p className="font-semibold">
              Create an account to save your reports and track your progress over time.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
