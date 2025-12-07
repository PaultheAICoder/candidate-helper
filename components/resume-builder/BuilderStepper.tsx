"use client";

/**
 * Resume Builder Stepper
 * Shows progress through the 5-step resume building process
 */

import { Check } from "lucide-react";
import type { ResumeStep } from "@/lib/types/resume-builder";

const STEPS = [
  { id: "basic_info", label: "Basic Info", number: 1 },
  { id: "work_history", label: "Experience", number: 2 },
  { id: "education", label: "Education", number: 3 },
  { id: "summary", label: "Summary", number: 4 },
  { id: "review", label: "Review", number: 5 },
] as const;

interface BuilderStepperProps {
  currentStep: ResumeStep;
  completedSteps: ResumeStep[];
}

export function BuilderStepper({ currentStep, completedSteps }: BuilderStepperProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Resume building progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id as ResumeStep);
          const isCurrent = step.id === currentStep;
          const isClickable = index <= currentStepIndex;

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${
                      isCompleted
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isCurrent
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-gray-300 text-gray-400 bg-white"
                    }
                  `}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isCurrent ? "text-blue-600" : "text-gray-500"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2
                    ${isCompleted ? "bg-blue-600" : "bg-gray-300"}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
