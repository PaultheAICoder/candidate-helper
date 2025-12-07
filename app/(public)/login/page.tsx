"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { verifyRecaptcha } from "@/lib/security/recaptcha";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const recaptchaOk = await verifyRecaptcha();
      if (!recaptchaOk) {
        setError("reCAPTCHA verification failed. Please try again.");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Magic Link Sign-In
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const recaptchaOk = await verifyRecaptcha();
      if (!recaptchaOk) {
        setError("reCAPTCHA verification failed. Please try again.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
        setEmail("");
      }
    } catch (err) {
      setError("Failed to send magic link. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to access personalized features
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Success Message */}
        {magicLinkSent && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
            Check your email for a sign-in link. Click the link to complete your sign-in.
          </div>
        )}

        {/* Google Sign-In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading || magicLinkSent}
          size="lg"
          className="w-full"
          variant="outline"
        >
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || magicLinkSent}
              autoComplete="email"
              required
              aria-label="Email address for magic link sign-in"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || magicLinkSent}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Sending link..." : "Send magic link"}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          New to Cindy from Cinder?{" "}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="text-primary hover:underline font-medium"
          >
            Create account
          </button>
        </p>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
