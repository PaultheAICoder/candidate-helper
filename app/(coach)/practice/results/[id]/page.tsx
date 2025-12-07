"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportPane } from "@/components/coach/ReportPane";
import { CoachingFeedback } from "@/components/coach/CoachingFeedback";
import { SurveyForm } from "@/components/coach/SurveyForm";
import { Button } from "@/components/ui/Button";

interface ReportResponse {
  id: string;
  strengths: Array<{ text: string; evidence: string }>;
  clarifications: Array<{ suggestion: string; rationale: string }>;
  per_question_feedback: Array<{
    question_id: string;
    narrative: string;
    example_answer: string;
    scores?: {
      situation: number;
      task: number;
      action: number;
      result: number;
      specificity_tag: string;
      impact_tag: string;
      clarity_tag: string;
    };
  }>;
  lowAnxietyMode: boolean;
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadReport = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Try to fetch existing report first
      const existing = await fetch(`/api/reports/${params.id}`, { cache: "no-store" });
      if (existing.ok) {
        const data = (await existing.json()) as ReportResponse;
        setReport(data);
        return;
      }

      // Fallback: generate coaching/report
      const res = await fetch(`/api/sessions/${params.id}/coaching`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Unable to load report");
      }
      const data = (await res.json()) as ReportResponse;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Generating your coaching report...</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">We hit a snag</h1>
          <p className="text-muted-foreground">{error || "Unable to load your results."}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => {
              setRetrying(true);
              void loadReport();
            }} disabled={retrying}>
              {retrying ? "Retrying..." : "Retry"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/practice")}>
              Start a new session
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Session {params.id.slice(0, 8)} •{" "}
            {report.lowAnxietyMode ? "Low-Anxiety Mode" : "Standard Mode"}
          </p>
          <h1 className="text-3xl font-bold">Your Coaching Report</h1>
          <p className="text-muted-foreground">
            Top strengths, clarifications to add, and feedback for each answer.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/api/reports/${report.id ?? params.id}/pdf`, "_blank")}
            >
              Download PDF
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <ReportPane
            type="strengths"
            title="Top Strengths"
            icon="💪"
            items={report.strengths}
          />
          <ReportPane
            type="clarifications"
            title="Clarifications to Add"
            icon="📝"
            items={report.clarifications}
          />
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Per-Question Coaching</h2>
          <div className="space-y-4">
            {report.per_question_feedback.map((feedback, idx) => (
              <CoachingFeedback
                key={feedback.question_id}
                feedback={feedback}
                questionNumber={idx + 1}
                lowAnxietyMode={report.lowAnxietyMode}
                hideScores={report.lowAnxietyMode}
              />
            ))}
          </div>
        </section>

        <section>
          <SurveyForm sessionId={params.id} lowAnxietyMode={report.lowAnxietyMode} />
        </section>
      </div>
    </main>
  );
}
