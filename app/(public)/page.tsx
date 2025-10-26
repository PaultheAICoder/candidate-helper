import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">Cindy from Cinder</h1>
        <p className="text-2xl text-muted-foreground mb-4">Your Free AI Interview Coach</p>
        <p className="text-lg text-muted-foreground max-w-2xl mb-12">
          Practice tailored interview questions, receive supportive coaching, and land your dream
          job. No account required to get started.
        </p>

        {/* Primary CTA */}
        <Link href="/practice">
          <Button size="lg" className="text-lg px-8 py-6">
            Try Practice Session
          </Button>
        </Link>

        <p className="text-sm text-muted-foreground mt-4">
          Start practicing immediately - no sign-up required
        </p>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Cindy Helps You Succeed</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-start p-6 bg-background rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Practice with Confidence</h3>
              <p className="text-muted-foreground">
                Answer behavioral interview questions at your own pace with text or audio responses.
              </p>
            </div>

            <div className="flex flex-col items-start p-6 bg-background rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Get Expert Feedback</h3>
              <p className="text-muted-foreground">
                Receive detailed coaching based on the STAR framework with strengths and areas to
                clarify.
              </p>
            </div>

            <div className="flex flex-col items-start p-6 bg-background rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Unlock Premium Features</h3>
              <p className="text-muted-foreground">
                Create an account to upload your resume, get tailored questions, and receive daily
                job matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Benefits */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why Cindy from Cinder?</h2>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h4 className="font-semibold mb-1">Accessible to All</h4>
                <p className="text-sm text-muted-foreground">
                  Text-only mode, keyboard navigation, and screen reader support ensure everyone can
                  practice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h4 className="font-semibold mb-1">Privacy First</h4>
                <p className="text-sm text-muted-foreground">
                  Your data is yours. We never store audio recordings, and you can export or delete
                  anytime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h4 className="font-semibold mb-1">Evidence-Based Coaching</h4>
                <p className="text-sm text-muted-foreground">
                  All feedback is based on the proven STAR framework used by top companies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h4 className="font-semibold mb-1">Low-Anxiety Option</h4>
                <p className="text-sm text-muted-foreground">
                  Feeling nervous? Enable Low-Anxiety Mode for a gentler experience with fewer
                  questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Interview?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your first practice session now - no credit card, no commitment.
          </p>
          <Link href="/practice">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Practicing Now
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
