"use client";

/**
 * Resume Builder Main Page
 * Multi-step resume building interface
 */

import { useState, useEffect } from "react";
import { BuilderStepper } from "@/components/resume-builder/BuilderStepper";
import { BasicInfoForm } from "@/components/resume-builder/BasicInfoForm";
import { WorkHistoryBuilder } from "@/components/resume-builder/WorkHistoryBuilder";
import { EducationSkillsForm } from "@/components/resume-builder/EducationSkillsForm";
import { SummaryGenerator } from "@/components/resume-builder/SummaryGenerator";
import { ResumePreview } from "@/components/resume-builder/ResumePreview";
import type { ResumeStep, ResumeData } from "@/lib/types/resume-builder";

const STEP_ORDER: ResumeStep[] = ["basic_info", "work_history", "education", "summary", "review"];

export default function ResumeBuilderPage() {
  const [currentStep, setCurrentStep] = useState<ResumeStep>("basic_info");
  const [completedSteps, setCompletedSteps] = useState<ResumeStep[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData>({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(resumeData).length > 0) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [resumeData]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  async function loadDraft() {
    try {
      const response = await fetch("/api/resume-builder/draft");
      if (response.ok) {
        const { draft } = await response.json();
        if (draft) {
          setResumeData(draft.data || {});
          if (draft.step_completed) {
            setCurrentStep(draft.step_completed);
            const stepIndex = STEP_ORDER.indexOf(draft.step_completed);
            setCompletedSteps(STEP_ORDER.slice(0, stepIndex));
          }
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }

  async function saveDraft() {
    try {
      setIsSaving(true);
      await fetch("/api/resume-builder/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_completed: currentStep,
          data: resumeData,
        }),
      });
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleStepComplete(stepData: Partial<ResumeData>) {
    const updatedData = { ...resumeData, ...stepData };
    setResumeData(updatedData);

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }

    saveDraft();
  }

  function handleBack() {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Build Your Resume</h1>
          <p className="mt-2 text-gray-600">
            Let's create a professional resume together. I'll guide you through each step.
          </p>
          {isSaving && (
            <p className="mt-2 text-sm text-blue-600">Saving draft...</p>
          )}
        </div>

        {/* Stepper */}
        <BuilderStepper currentStep={currentStep} completedSteps={completedSteps} />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === "basic_info" && (
            <BasicInfoForm
              initialData={resumeData.basic_info}
              onComplete={(data) => handleStepComplete({ basic_info: data })}
            />
          )}

          {currentStep === "work_history" && (
            <WorkHistoryBuilder
              initialData={resumeData.work_history || []}
              onComplete={(data) => handleStepComplete({ work_history: data })}
              onBack={handleBack}
            />
          )}

          {currentStep === "education" && (
            <EducationSkillsForm
              initialEducation={resumeData.education || []}
              initialSkills={resumeData.skills || []}
              workHistory={resumeData.work_history || []}
              onComplete={(education, skills) =>
                handleStepComplete({ education, skills })
              }
              onBack={handleBack}
            />
          )}

          {currentStep === "summary" && (
            <SummaryGenerator
              initialSummary={resumeData.summary}
              workHistory={resumeData.work_history || []}
              education={resumeData.education || []}
              skills={resumeData.skills || []}
              onComplete={(summary) => handleStepComplete({ summary })}
              onBack={handleBack}
            />
          )}

          {currentStep === "review" && (
            <ResumePreview
              resumeData={resumeData}
              onBack={handleBack}
              onEdit={(step) => setCurrentStep(step)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
