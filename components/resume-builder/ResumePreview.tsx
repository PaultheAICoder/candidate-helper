"use client";

/**
 * Resume Preview - Step 5
 * Final review and export
 */

import { useState } from "react";
import { Download, Edit2, Loader2 } from "lucide-react";
import type { ResumeData, ResumeStep } from "@/lib/types/resume-builder";

interface ResumePreviewProps {
  resumeData: ResumeData;
  onBack: () => void;
  onEdit: (step: ResumeStep) => void;
}

export function ResumePreview({ resumeData, onBack, onEdit }: ResumePreviewProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportPDF() {
    setIsExporting(true);

    try {
      const response = await fetch("/api/resume-builder/export/pdf");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.basic_info?.full_name?.replace(/\s+/g, "_") || "resume"}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Resume</h2>
        <p className="text-gray-600 mb-6">
          Review your resume below. You can edit any section or download as PDF.
        </p>
      </div>

      {/* Resume Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-sm max-w-3xl mx-auto">
        {/* Header */}
        {resumeData.basic_info && (
          <div className="mb-6 border-b-2 border-gray-300 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {resumeData.basic_info.full_name}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  {resumeData.basic_info.email && <p>{resumeData.basic_info.email}</p>}
                  {resumeData.basic_info.phone && <p>{resumeData.basic_info.phone}</p>}
                  {resumeData.basic_info.location && <p>{resumeData.basic_info.location}</p>}
                  {resumeData.basic_info.linkedin_url && (
                    <p className="text-blue-600">{resumeData.basic_info.linkedin_url}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onEdit("basic_info")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {resumeData.summary && (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-gray-900">PROFESSIONAL SUMMARY</h2>
              <button
                onClick={() => onEdit("summary")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
          </div>
        )}

        {/* Experience */}
        {resumeData.work_history && resumeData.work_history.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-bold text-gray-900">PROFESSIONAL EXPERIENCE</h2>
              <button
                onClick={() => onEdit("work_history")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            {resumeData.work_history.map((job) => (
              <div key={job.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">{job.title}</h3>
                  <span className="text-sm text-gray-600">
                    {job.start_date} - {job.is_current ? "Present" : job.end_date}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{job.company}</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  {job.enhanced_bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-bold text-gray-900">EDUCATION</h2>
              <button
                onClick={() => onEdit("education")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                <p className="text-gray-700">
                  {edu.institution}
                  {edu.field && ` • ${edu.field}`}
                  {edu.graduation_year && ` • ${edu.graduation_year}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <div>
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-bold text-gray-900">SKILLS</h2>
              <button
                onClick={() => onEdit("education")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            <p className="text-gray-700">{resumeData.skills.join(" • ")}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download as PDF
            </>
          )}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>Your resume will be saved automatically.</p>
          <p className="mt-1">
            Want to use this for interview practice?{" "}
            <a href="/practice" className="text-blue-600 hover:text-blue-700 underline">
              Start a practice session
            </a>
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}
