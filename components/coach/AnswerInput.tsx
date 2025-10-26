"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";

interface AnswerInputProps {
  questionText: string;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export function AnswerInput({
  questionText,
  questionNumber,
  totalQuestions,
  onSubmit,
  isSubmitting = false,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 5000;
  const minLength = 10;

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [questionText]);

  const handleSubmit = () => {
    if (answer.trim().length >= minLength) {
      onSubmit(answer.trim());
      setAnswer(""); // Clear for next question
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = maxLength - answer.length;
  const isValid = answer.trim().length >= minLength;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(questionNumber / totalQuestions) * 100}%`,
              }}
            />
          </div>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card border rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">{questionText}</h2>

        {/* STAR Framework Hint */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold mb-2">Tip: Use the STAR Framework</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <strong className="text-primary">S</strong>ituation: Set the context
            </div>
            <div>
              <strong className="text-primary">T</strong>ask: Describe your responsibility
            </div>
            <div>
              <strong className="text-primary">A</strong>ction: Explain what you did
            </div>
            <div>
              <strong className="text-primary">R</strong>esult: Share the outcome
            </div>
          </div>
        </div>

        {/* Answer Textarea */}
        <div className="space-y-3">
          <Label htmlFor="answer-input" className="text-lg">
            Your Answer
          </Label>
          <Textarea
            ref={textareaRef}
            id="answer-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here... Be specific and include examples."
            className="min-h-[300px] text-base"
            maxLength={maxLength}
            aria-describedby="char-count helper-text"
            disabled={isSubmitting}
          />

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm">
            <p id="helper-text" className="text-muted-foreground">
              {!isValid && answer.length > 0 && (
                <span className="text-destructive">Minimum {minLength} characters required</span>
              )}
              {isValid && <span className="text-primary">Great! Press Ctrl+Enter to submit</span>}
            </p>
            <span
              id="char-count"
              className={`${remainingChars < 100 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Take your time - there's no time limit for text mode
          </div>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} size="lg">
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        </div>
      </div>

      {/* Accessibility Information */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Need a break? Your progress is saved automatically every 30 seconds.</p>
      </div>
    </div>
  );
}
