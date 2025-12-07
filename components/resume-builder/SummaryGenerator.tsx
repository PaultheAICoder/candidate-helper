"use client";

/**
 * Summary Generator - Step 4
 * AI-powered professional summary generation
 */

import { useState } from "react";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { WorkExperience, Education } from "@/lib/types/resume-builder";

interface SummaryGeneratorProps {
  initialSummary?: string;
  workHistory: WorkExperience[];
  education: Education[];
  skills: string[];
  onComplete: (summary: string) => void;
  onBack: () => void;
}

export function SummaryGenerator({
  initialSummary,
  workHistory,
  education,
  skills,
  onComplete,
  onBack,
}: SummaryGeneratorProps) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setSuggestions([]);

    try {
      const response = await fetch("/api/resume-builder/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_history: workHistory,
          education,
          skills,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const result = await response.json();
      setSuggestions(result.summaries || []);
    } catch (error) {
      console.error("Summary generation error:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSelectSuggestion(index: number) {
    setSelectedIndex(index);
    setSummary(suggestions[index]);
  }

  function handleSubmit() {
    if (!summary.trim()) {
      alert("Please generate or write a professional summary");
      return;
    }

    onComplete(summary);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Summary</h2>
        <p className="text-gray-600 mb-6">
          A compelling summary highlights your key strengths and sets the tone for your resume.
        </p>
      </div>

      {/* Generate Button */}
      {suggestions.length === 0 && !summary && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Let AI write your summary
          </h3>
          <p className="text-gray-600 mb-6">
            I'll create 3 professional summary options based on your experience and skills.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Choose a summary or edit one:</h3>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>

          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(index)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-colors
                ${
                  selectedIndex === index
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300 bg-white"
                }
              `}
            >
              <p className="text-sm leading-relaxed text-gray-800">{suggestion}</p>
            </button>
          ))}
        </div>
      )}

      {/* Editable Summary */}
      {summary && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Professional Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
            placeholder="Write or edit your professional summary here..."
          />
          <p className="mt-2 text-sm text-gray-500">
            Feel free to edit and personalize this summary to match your voice.
          </p>
        </div>
      )}

      {/* Option to skip */}
      {!summary && suggestions.length === 0 && (
        <div className="text-center">
          <p className="text-gray-600 mb-2">Or write your own:</p>
          <button
            onClick={() => setSummary(" ")}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            I'll write my own summary
          </button>
        </div>
      )}

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
          disabled={!summary.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Next: Review & Export
        </button>
      </div>
    </div>
  );
}
