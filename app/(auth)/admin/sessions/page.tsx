"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionRow {
  id: string;
  user_id: string | null;
  mode: string;
  question_count: number;
  avg_star_score: number | null;
  completion_rate: number | null;
  completed_at: string | null;
  created_at: string;
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/sessions?limit=50", { cache: "no-store" });
      if (!res.ok) {
        setError("Access denied or failed to load sessions.");
        return;
      }
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      console.error("Admin sessions load error:", err);
      setError("Unexpected error loading sessions.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-destructive font-semibold">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="text-primary underline text-sm"
              onClick={() => {
                setRetrying(true);
                setLoading(true);
                void load();
              }}
              disabled={retrying}
            >
              {retrying ? "Retrying..." : "Retry"}
            </button>
            <button className="text-sm underline" onClick={() => router.push("/")}>
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Sessions</h1>
          <p className="text-muted-foreground">Recent sessions with completion and scoring.</p>
        </header>
        <div className="border rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Mode</th>
                <th className="px-4 py-2">Q Count</th>
                <th className="px-4 py-2">Completion</th>
                <th className="px-4 py-2">Avg STAR</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.id.slice(0, 8)}</td>
                  <td className="px-4 py-2">{s.user_id ? s.user_id.slice(0, 8) : "Guest"}</td>
                  <td className="px-4 py-2">{s.mode}</td>
                  <td className="px-4 py-2">{s.question_count}</td>
                  <td className="px-4 py-2">
                    {s.completion_rate ? Math.round(s.completion_rate * 100) + "%" : "—"}
                  </td>
                  <td className="px-4 py-2">{s.avg_star_score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
