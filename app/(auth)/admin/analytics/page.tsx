"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface SurveyTallies {
  helpfulness: { like: number; neutral: number; dislike: number };
  adviceQuality: { like: number; neutral: number; dislike: number };
  preparedness: { like: number; neutral: number; dislike: number };
}

interface AnalyticsData {
  surveyTallies: SurveyTallies;
  totalSurveys: number;
  referralClicks: {
    total: number;
    conversionRate: number;
  };
  sessionStats: {
    total: number;
    completed: number;
    avgCompletionRate: number;
    avgStarScore: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/admin/analytics");

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </main>
    );
  }

  if (error || !analytics) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error Loading Analytics</h1>
          <p className="text-muted-foreground">{error || "Failed to load analytics data"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track user feedback, referral performance, and session metrics
          </p>
        </div>

        {/* Session Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
            <div className="text-3xl font-bold">{analytics.sessionStats.total}</div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Completed</div>
            <div className="text-3xl font-bold">{analytics.sessionStats.completed}</div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Avg Completion</div>
            <div className="text-3xl font-bold">{analytics.sessionStats.avgCompletionRate}%</div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Avg STAR Score</div>
            <div className="text-3xl font-bold">{analytics.sessionStats.avgStarScore}/5</div>
          </div>
        </div>

        {/* Survey Tallies */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Survey Feedback</h2>
          <div className="text-sm text-muted-foreground mb-4">
            Based on {analytics.totalSurveys} survey{analytics.totalSurveys !== 1 ? "s" : ""}
          </div>

          <div className="space-y-6">
            {/* Helpfulness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">How helpful was this practice session?</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">👍</div>
                  <div className="text-sm text-muted-foreground">Like</div>
                  <div className="text-xl font-bold text-green-600">
                    {analytics.surveyTallies.helpfulness.like}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">😐</div>
                  <div className="text-sm text-muted-foreground">Neutral</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics.surveyTallies.helpfulness.neutral}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">👎</div>
                  <div className="text-sm text-muted-foreground">Dislike</div>
                  <div className="text-xl font-bold text-red-600">
                    {analytics.surveyTallies.helpfulness.dislike}%
                  </div>
                </div>
              </div>
            </div>

            {/* Advice Quality */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  How would you rate the quality of the coaching advice?
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">👍</div>
                  <div className="text-sm text-muted-foreground">Like</div>
                  <div className="text-xl font-bold text-green-600">
                    {analytics.surveyTallies.adviceQuality.like}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">😐</div>
                  <div className="text-sm text-muted-foreground">Neutral</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics.surveyTallies.adviceQuality.neutral}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">👎</div>
                  <div className="text-sm text-muted-foreground">Dislike</div>
                  <div className="text-xl font-bold text-red-600">
                    {analytics.surveyTallies.adviceQuality.dislike}%
                  </div>
                </div>
              </div>
            </div>

            {/* Preparedness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  Do you feel more prepared for your interviews now?
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">👍</div>
                  <div className="text-sm text-muted-foreground">Like</div>
                  <div className="text-xl font-bold text-green-600">
                    {analytics.surveyTallies.preparedness.like}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">😐</div>
                  <div className="text-sm text-muted-foreground">Neutral</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {analytics.surveyTallies.preparedness.neutral}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">👎</div>
                  <div className="text-sm text-muted-foreground">Dislike</div>
                  <div className="text-xl font-bold text-red-600">
                    {analytics.surveyTallies.preparedness.dislike}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Metrics */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Referral Performance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Referral Clicks</div>
              <div className="text-3xl font-bold">{analytics.referralClicks.total}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Estimated Conversion Rate</div>
              <div className="text-3xl font-bold">{analytics.referralClicks.conversionRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on total users / referral clicks
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>
    </main>
  );
}
