"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Session } from "@supabase/supabase-js";

interface SessionRecord {
  id: string;
  mode: "audio" | "text";
  question_count: number;
  avg_star_score: number | null;
  completion_rate: number;
  created_at: string;
  completed_at: string | null;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<Session["user"] | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [resumeStatus, setResumeStatus] = useState<{
    uploaded: boolean;
    filename: string | null;
    uploadedAt: string | null;
  }>({ uploaded: false, filename: null, uploadedAt: null });
  const [digestOptIn, setDigestOptIn] = useState(false);
  const [digestConfirmed, setDigestConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        setUser(session.user);

        // Load sessions
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("id, mode, question_count, avg_star_score, completion_rate, created_at, completed_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (sessionsData) {
          setSessions(
            sessionsData.map(
              (s) =>
                ({
                  ...s,
                  mode: (s.mode as "audio" | "text") || "text",
                } as SessionRecord)
            )
          );
        }

        // Load profile and resume status
        const { data: profileData } = await supabase
          .from("profiles")
          .select("resume_filename, resume_uploaded_at")
          .eq("user_id", session.user.id)
          .single();

        if (profileData) {
          setResumeStatus({
            uploaded: !!profileData.resume_filename,
            filename: profileData.resume_filename,
            uploadedAt: profileData.resume_uploaded_at,
          });
        }

        // Load user digest preferences
        const { data: userData } = await supabase
          .from("users")
          .select("digest_opt_in, digest_confirmed")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setDigestOptIn(userData.digest_opt_in ?? false);
          setDigestConfirmed(userData.digest_confirmed ?? false);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const handleDigestOptInToggle = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ digest_opt_in: !digestOptIn })
        .eq("id", user.id);

      if (!error) {
        setDigestOptIn(!digestOptIn);
      }
    } catch (error) {
      console.error("Error updating digest preference:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Welcome back, {user?.email?.split("@")[0]}!</h1>
          <p className="text-lg text-muted-foreground">
            Track your practice sessions and personalize your coaching experience
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/practice">
            <Button className="w-full" size="lg">
              Start New Practice Session
            </Button>
          </Link>
          <Link href="/settings">
            <Button className="w-full" size="lg" variant="outline">
              Account Settings
            </Button>
          </Link>
        </div>

        {/* Resume Status */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Resume</h2>
              <p className="text-muted-foreground">Upload your resume for tailored interview questions</p>
            </div>
            <Link href="/settings">
              <Button variant="outline">Upload/Update</Button>
            </Link>
          </div>

          {resumeStatus.uploaded ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              ✓ Resume uploaded: <strong>{resumeStatus.filename}</strong>
              {resumeStatus.uploadedAt && (
                <div className="mt-1 text-xs">
                  {formatDistanceToNow(new Date(resumeStatus.uploadedAt), { addSuffix: true })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
              No resume uploaded yet. Upload your resume to get personalized interview questions!
            </div>
          )}
        </div>

        {/* Digest Preferences */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Job Digest</h2>
              <p className="text-muted-foreground">Get daily job matches based on your resume</p>
            </div>
            <Button
              onClick={handleDigestOptInToggle}
              variant={digestOptIn ? "default" : "outline"}
            >
              {digestOptIn ? "Subscribed" : "Subscribe"}
            </Button>
          </div>

          {digestOptIn ? (
            <div
              className={`rounded-md p-4 text-sm ${
                digestConfirmed
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {digestConfirmed ? (
                "✓ You're subscribed. Daily digest emails will arrive at 5:00 PM PT."
              ) : (
                "Pending confirmation. Check your email to confirm your subscription."
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Subscribe to receive daily job matches in your inbox.</p>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Practice Sessions</h2>

          {sessions.length === 0 ? (
            <div className="border rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No practice sessions yet.</p>
              <Link href="/practice" className="mt-4 inline-block">
                <Button>Start Your First Session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/practice/results/${session.id}`}
                  className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {session.question_count} {session.mode === "audio" ? "🎙️" : "📝"} Questions
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.completed_at
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {session.completed_at ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {session.avg_star_score && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {session.avg_star_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg score</div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
