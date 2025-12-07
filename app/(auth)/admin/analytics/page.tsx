"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LazyCostDashboard = dynamic(
  () => import("@/components/admin/CostDashboard").then((m) => m.CostDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading cost data...</p>
      </div>
    ),
  }
);

interface AnalyticsResponse {
  totalSurveys: number;
  surveyTallies: Record<string, unknown>;
  referralClicks: { total: number; conversionRate: number };
  sessionStats: { total: number; completed: number; avgCompletionRate: number; avgStarScore: number };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) {
        setError("Access denied or failed to load analytics.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Admin analytics load error:", err);
      setError("Unexpected error loading analytics.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const surveyTallies = useMemo(
    () => (data ? JSON.stringify(data.surveyTallies, null, 2) : "{}"),
    [data]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
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
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground">
            Survey tallies, referral clicks, and session stats (admin access required).
          </p>
        </header>

        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Survey Responses</h2>
          <pre className="text-xs bg-muted p-3 rounded">{surveyTallies}</pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Referral Clicks</h2>
          <p className="text-sm text-muted-foreground">
            Total: {data.referralClicks.total} • Estimated Conversion: {data.referralClicks.conversionRate}%
          </p>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Session Stats</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Total: {data.sessionStats.total}</li>
            <li>Completed: {data.sessionStats.completed}</li>
            <li>Avg Completion Rate: {data.sessionStats.avgCompletionRate}%</li>
            <li>Avg STAR Score: {data.sessionStats.avgStarScore}</li>
          </ul>
        </section>

        <LazyCostDashboard />
      </div>
    </main>
  );
}
