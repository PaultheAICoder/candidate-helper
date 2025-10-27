"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recruiterAccess, setRecruiterAccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        setUser(session.user);

        // Load user preferences
        const { data: userData } = await supabase
          .from("users")
          .select("recruiter_access_granted")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setRecruiterAccess(userData.recruiter_access_granted ?? false);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const handleRecruiterAccessToggle = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("users")
        .update({ recruiter_access_granted: !recruiterAccess })
        .eq("id", user.id);

      if (!error) {
        setRecruiterAccess(!recruiterAccess);
      }
    } catch (error) {
      console.error("Error updating recruiter access:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/users/export", {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cindy-export-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await supabase.auth.signOut();
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Account Settings</h1>
          <p className="text-lg text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Account Information */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold">Account Information</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Created</p>
              <p className="font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Resume Management */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold">Resume Management</h2>
          <p className="text-muted-foreground">
            Upload or update your resume to get personalized interview questions.
          </p>
          <Button className="w-full" size="lg">
            Upload/Update Resume
          </Button>
        </div>

        {/* Recruiter Access */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recruiter Access</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Allow recruiters to view your interview transcripts if you're a strong match for their roles
              </p>
            </div>
            <Button
              onClick={handleRecruiterAccessToggle}
              disabled={isSaving}
              variant={recruiterAccess ? "default" : "outline"}
            >
              {recruiterAccess ? "Enabled" : "Disabled"}
            </Button>
          </div>
          {recruiterAccess && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              Recruiters can access your transcripts only if you score ≥4.2/5 or complete ≥70% of sessions.
            </div>
          )}
        </div>

        {/* Data Privacy */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold">Data Privacy</h2>
          <div className="space-y-3">
            <Button
              onClick={handleDataExport}
              disabled={isSaving}
              size="lg"
              className="w-full"
              variant="outline"
            >
              Download My Data (JSON)
            </Button>
            <p className="text-xs text-muted-foreground">
              Export all your personal data including sessions, answers, and reports in JSON format.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-destructive rounded-lg p-6 space-y-4 bg-destructive/5">
          <h2 className="text-2xl font-bold text-destructive">Danger Zone</h2>

          {!deleteConfirm ? (
            <Button
              onClick={() => setDeleteConfirm(true)}
              disabled={isSaving}
              size="lg"
              className="w-full"
              variant="destructive"
            >
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="flex-1"
                  variant="destructive"
                >
                  {isSaving ? "Deleting..." : "Permanently Delete"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="flex gap-4 justify-center text-sm">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Terms of Service
          </a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Privacy Policy
          </a>
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
