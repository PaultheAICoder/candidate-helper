"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

interface SurveyFormProps {
  sessionId: string;
  lowAnxietyMode?: boolean;
  onSubmitSuccess?: () => void;
}

type LikertValue = "like" | "neutral" | "dislike";

interface SurveyResponses {
  helpfulness: LikertValue | null;
  adviceQuality: LikertValue | null;
  preparedness: LikertValue | null;
  lowAnxietyFeedback?: string;
}

export function SurveyForm({
  sessionId,
  lowAnxietyMode = false,
  onSubmitSuccess,
}: SurveyFormProps) {
  const [responses, setResponses] = useState<SurveyResponses>({
    helpfulness: null,
    adviceQuality: null,
    preparedness: null,
    lowAnxietyFeedback: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLikertChange = (
    question: keyof Omit<SurveyResponses, "lowAnxietyFeedback">,
    value: LikertValue
  ) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that all required questions are answered
    if (!responses.helpfulness || !responses.adviceQuality || !responses.preparedness) {
      setError("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          responses: {
            helpfulness: responses.helpfulness,
            adviceQuality: responses.adviceQuality,
            preparedness: responses.preparedness,
            lowAnxietyFeedback: lowAnxietyMode ? responses.lowAnxietyFeedback : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit survey");
      }

      setIsSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p className="text-muted-foreground">
          Your feedback helps us improve the coaching experience for everyone.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Quick Feedback</h3>
        <p className="text-sm text-muted-foreground">
          Help us improve by sharing your thoughts on this session
        </p>
      </div>

      {/* Question 1: Helpfulness */}
      <div className="space-y-3">
        <Label className="text-base">How helpful was this practice session?</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="helpfulness"
              value="like"
              checked={responses.helpfulness === "like"}
              onChange={() => handleLikertChange("helpfulness", "like")}
              className="w-4 h-4"
              aria-label="Very helpful"
            />
            <span className="text-sm">👍 Like</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="helpfulness"
              value="neutral"
              checked={responses.helpfulness === "neutral"}
              onChange={() => handleLikertChange("helpfulness", "neutral")}
              className="w-4 h-4"
              aria-label="Somewhat helpful"
            />
            <span className="text-sm">😐 Neutral</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="helpfulness"
              value="dislike"
              checked={responses.helpfulness === "dislike"}
              onChange={() => handleLikertChange("helpfulness", "dislike")}
              className="w-4 h-4"
              aria-label="Not helpful"
            />
            <span className="text-sm">👎 Dislike</span>
          </label>
        </div>
      </div>

      {/* Question 2: Advice Quality */}
      <div className="space-y-3">
        <Label className="text-base">How would you rate the quality of the coaching advice?</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="adviceQuality"
              value="like"
              checked={responses.adviceQuality === "like"}
              onChange={() => handleLikertChange("adviceQuality", "like")}
              className="w-4 h-4"
              aria-label="Excellent advice"
            />
            <span className="text-sm">👍 Like</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="adviceQuality"
              value="neutral"
              checked={responses.adviceQuality === "neutral"}
              onChange={() => handleLikertChange("adviceQuality", "neutral")}
              className="w-4 h-4"
              aria-label="Average advice"
            />
            <span className="text-sm">😐 Neutral</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="adviceQuality"
              value="dislike"
              checked={responses.adviceQuality === "dislike"}
              onChange={() => handleLikertChange("adviceQuality", "dislike")}
              className="w-4 h-4"
              aria-label="Poor advice"
            />
            <span className="text-sm">👎 Dislike</span>
          </label>
        </div>
      </div>

      {/* Question 3: Preparedness */}
      <div className="space-y-3">
        <Label className="text-base">Do you feel more prepared for your interviews now?</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="preparedness"
              value="like"
              checked={responses.preparedness === "like"}
              onChange={() => handleLikertChange("preparedness", "like")}
              className="w-4 h-4"
              aria-label="Much more prepared"
            />
            <span className="text-sm">👍 Like</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="preparedness"
              value="neutral"
              checked={responses.preparedness === "neutral"}
              onChange={() => handleLikertChange("preparedness", "neutral")}
              className="w-4 h-4"
              aria-label="Somewhat more prepared"
            />
            <span className="text-sm">😐 Neutral</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="preparedness"
              value="dislike"
              checked={responses.preparedness === "dislike"}
              onChange={() => handleLikertChange("preparedness", "dislike")}
              className="w-4 h-4"
              aria-label="Not more prepared"
            />
            <span className="text-sm">👎 Dislike</span>
          </label>
        </div>
      </div>

      {/* Optional: Low-Anxiety Mode Feedback */}
      {lowAnxietyMode && (
        <div className="space-y-3">
          <Label htmlFor="low-anxiety-feedback" className="text-base">
            Anything we should improve about Low-Anxiety Mode? (Optional)
          </Label>
          <Textarea
            id="low-anxiety-feedback"
            placeholder="Share your thoughts on the Low-Anxiety Mode experience..."
            value={responses.lowAnxietyFeedback}
            onChange={(e) =>
              setResponses((prev) => ({ ...prev, lowAnxietyFeedback: e.target.value }))
            }
            rows={3}
            className="text-sm"
            aria-label="Low-Anxiety Mode feedback"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
