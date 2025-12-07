"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TranscriptAnswer {
  id: string;
  transcript_text: string;
  question_text: string;
  question_order: number;
}

interface TranscriptResponse {
  session: { id: string; avg_star_score: number | null; completion_rate: number | null };
  answers: TranscriptAnswer[];
}

export default function TranscriptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/transcripts/${params.id}`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Access denied or unavailable.");
          return;
        }
        const json = (await res.json()) as TranscriptResponse;
        setData(json);
      } catch (err) {
        console.error("Transcript load error:", err);
        setError("Unexpected error loading transcript.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-destructive font-semibold">{error || "Unavailable"}</p>
          <button className="text-primary underline text-sm" onClick={() => router.push("/admin/sessions")}>
            Back to sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Session Transcript</h1>
          <p className="text-sm text-muted-foreground">
            Session {params.id.slice(0, 8)} • Avg STAR {data.session.avg_star_score ?? "—"} • Completion{" "}
            {data.session.completion_rate ? Math.round(data.session.completion_rate * 100) + "%" : "—"}
          </p>
        </header>

        <div className="space-y-3">
          {data.answers.map((a) => (
            <div key={a.id} className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Question {a.question_order}</p>
              <p className="font-semibold mb-2">{a.question_text}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{a.transcript_text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
