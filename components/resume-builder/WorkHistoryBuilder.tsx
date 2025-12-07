"use client";

/**
 * Work History Builder - Step 2
 * Conversational interface for adding work experience with AI enhancement
 */

import { useState } from "react";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import type { WorkExperience } from "@/lib/types/resume-builder";

interface WorkHistoryBuilderProps {
  initialData: WorkExperience[];
  onComplete: (data: WorkExperience[]) => void;
  onBack: () => void;
}

export function WorkHistoryBuilder({ initialData, onComplete, onBack }: WorkHistoryBuilderProps) {
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    initialData.length > 0 ? initialData : []
  );
  const [currentJob, setCurrentJob] = useState<Partial<WorkExperience>>({
    id: crypto.randomUUID(),
    title: "",
    company: "",
    start_date: "",
    end_date: "",
    is_current: false,
    raw_description: "",
    enhanced_bullets: [],
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<{
    needs_clarification: boolean;
    questions?: string[];
    suggestions: string[];
  } | null>(null);

  async function handleEnhance() {
    if (!currentJob.raw_description || currentJob.raw_description.trim().length < 10) {
      alert("Please provide a description of your responsibilities (at least 10 characters)");
      return;
    }

    setIsEnhancing(true);
    setEnhancementResult(null);

    try {
      const response = await fetch("/api/resume-builder/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: currentJob.raw_description,
          context: {
            company: currentJob.company,
            title: currentJob.title,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Enhancement failed");
      }

      const result = await response.json();
      setEnhancementResult(result);
    } catch (error) {
      console.error("Enhancement error:", error);
      alert("Failed to enhance content. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }

  function handleSelectSuggestion(suggestion: string) {
    setCurrentJob({
      ...currentJob,
      enhanced_bullets: [...(currentJob.enhanced_bullets || []), suggestion],
    });
    setEnhancementResult(null);
  }

  function handleAddJob() {
    if (!currentJob.title || !currentJob.company || !currentJob.start_date) {
      alert("Please fill in title, company, and start date");
      return;
    }

    if ((currentJob.enhanced_bullets?.length || 0) === 0) {
      alert("Please add at least one achievement or responsibility");
      return;
    }

    setExperiences([...experiences, currentJob as WorkExperience]);
    setCurrentJob({
      id: crypto.randomUUID(),
      title: "",
      company: "",
      start_date: "",
      end_date: "",
      is_current: false,
      raw_description: "",
      enhanced_bullets: [],
    });
    setEnhancementResult(null);
  }

  function handleRemoveJob(id: string) {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  }

  function handleRemoveBullet(index: number) {
    const bullets = currentJob.enhanced_bullets || [];
    setCurrentJob({
      ...currentJob,
      enhanced_bullets: bullets.filter((_, i) => i !== index),
    });
  }

  function handleSubmit() {
    if (experiences.length === 0) {
      alert("Please add at least one work experience");
      return;
    }

    onComplete(experiences);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
        <p className="text-gray-600 mb-6">
          Add your work history. I'll help you write strong, quantified bullet points.
        </p>
      </div>

      {/* Added Experiences */}
      {experiences.length > 0 && (
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-gray-900">Added Experiences ({experiences.length})</h3>
          {experiences.map((exp) => (
            <div key={exp.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">{exp.title}</p>
                <p className="text-sm text-gray-600">{exp.company}</p>
                <p className="text-sm text-gray-500">
                  {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                </p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {exp.enhanced_bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleRemoveJob(exp.id)}
                className="text-red-600 hover:text-red-700"
                aria-label="Remove experience"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Experience */}
      <div className="space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="font-semibold text-gray-900">
          {experiences.length === 0 ? "Add Your First Experience" : "Add Another Experience"}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentJob.title}
              onChange={(e) => setCurrentJob({ ...currentJob, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Marketing Coordinator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentJob.company}
              onChange={(e) => setCurrentJob({ ...currentJob, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={currentJob.start_date}
              onChange={(e) => setCurrentJob({ ...currentJob, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="month"
              value={currentJob.end_date}
              onChange={(e) => setCurrentJob({ ...currentJob, end_date: e.target.value })}
              disabled={currentJob.is_current}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={currentJob.is_current}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, is_current: e.target.checked, end_date: "" })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700">I currently work here</span>
            </label>
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tell me about your main responsibilities or a key achievement
          </label>
          <textarea
            value={currentJob.raw_description}
            onChange={(e) => setCurrentJob({ ...currentJob, raw_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Example: I managed the company's social media accounts and created content that increased engagement..."
          />
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !currentJob.raw_description}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Enhance with AI
              </>
            )}
          </button>
        </div>

        {/* Enhancement Results */}
        {enhancementResult && (
          <div className="p-4 bg-purple-50 rounded-lg space-y-3">
            {enhancementResult.needs_clarification && enhancementResult.questions ? (
              <div>
                <p className="font-medium text-purple-900 mb-2">Let's make this stronger!</p>
                <p className="text-sm text-purple-800 mb-2">To create better bullets, can you tell me:</p>
                <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                  {enhancementResult.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
                <p className="text-sm text-purple-700 mt-2">
                  Add these details to your description above and click "Enhance" again.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-purple-900 mb-2">Here are some enhanced versions:</p>
                <div className="space-y-2">
                  {enhancementResult.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left p-3 bg-white rounded border border-purple-200 hover:border-purple-400 text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Bullets */}
        {(currentJob.enhanced_bullets?.length || 0) > 0 && (
          <div>
            <p className="font-medium text-gray-900 mb-2">Your achievements:</p>
            <ul className="space-y-2">
              {currentJob.enhanced_bullets?.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{bullet}</span>
                  <button
                    onClick={() => handleRemoveBullet(i)}
                    className="text-red-600 hover:text-red-700"
                    aria-label="Remove bullet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleAddJob}
          className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add This Experience
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={experiences.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Next: Education & Skills
        </button>
      </div>
    </div>
  );
}
