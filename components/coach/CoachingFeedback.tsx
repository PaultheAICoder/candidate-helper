"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PerQuestionFeedback } from "@/types/models";

interface CoachingFeedbackProps {
  feedback: PerQuestionFeedback;
  questionNumber: number;
  lowAnxietyMode?: boolean;
}

export function CoachingFeedback({
  feedback,
  questionNumber,
  lowAnxietyMode: _lowAnxietyMode = false,
}: CoachingFeedbackProps) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      {/* Question Number */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold">Question {questionNumber}</span>
      </div>

      {/* Narrative Feedback */}
      <div className="space-y-2">
        <h4 className="font-semibold">Coaching Feedback</h4>
        <p className="text-muted-foreground leading-relaxed">{feedback.narrative}</p>
      </div>

      {/* Example Improved Answer (Collapsible) */}
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExample(!showExample)}
          className="w-full justify-between"
        >
          <span>{showExample ? "Hide" : "Show"} Example Improved Answer</span>
          <span className="text-lg">{showExample ? "−" : "+"}</span>
        </Button>

        {showExample && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              {feedback.example_answer}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Note:</strong> This example uses only facts from your original answer.
              Placeholders like [specific example here] indicate where you could add more detail.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
