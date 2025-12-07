"use client";

/**
 * Education & Skills Form - Step 3
 */

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { Education, WorkExperience } from "@/lib/types/resume-builder";

interface EducationSkillsFormProps {
  initialEducation: Education[];
  initialSkills: string[];
  workHistory: WorkExperience[];
  onComplete: (education: Education[], skills: string[]) => void;
  onBack: () => void;
}

export function EducationSkillsForm({
  initialEducation,
  initialSkills,
  workHistory,
  onComplete,
  onBack,
}: EducationSkillsFormProps) {
  const [education, setEducation] = useState<Education[]>(
    initialEducation.length > 0 ? initialEducation : []
  );
  const [currentEd, setCurrentEd] = useState<Partial<Education>>({
    id: crypto.randomUUID(),
    degree: "",
    institution: "",
    field: "",
    graduation_year: "",
  });
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [skillInput, setSkillInput] = useState("");

  function handleAddEducation() {
    if (!currentEd.degree || !currentEd.institution) {
      alert("Please provide degree and institution");
      return;
    }

    setEducation([...education, currentEd as Education]);
    setCurrentEd({
      id: crypto.randomUUID(),
      degree: "",
      institution: "",
      field: "",
      graduation_year: "",
    });
  }

  function handleRemoveEducation(id: string) {
    setEducation(education.filter((ed) => ed.id !== id));
  }

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  }

  function handleRemoveSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function handleSubmit() {
    if (education.length === 0) {
      alert("Please add at least one education entry");
      return;
    }

    if (skills.length === 0) {
      alert("Please add at least one skill");
      return;
    }

    onComplete(education, skills);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education & Skills</h2>
        <p className="text-gray-600 mb-6">
          Add your educational background and key skills.
        </p>
      </div>

      {/* Education Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>

        {education.length > 0 && (
          <div className="space-y-3 mb-4">
            {education.map((ed) => (
              <div key={ed.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-start">
                <div>
                  <p className="font-semibold">{ed.degree}</p>
                  <p className="text-sm text-gray-600">{ed.institution}</p>
                  {ed.field && <p className="text-sm text-gray-500">Field: {ed.field}</p>}
                  {ed.graduation_year && <p className="text-sm text-gray-500">Graduated: {ed.graduation_year}</p>}
                </div>
                <button
                  onClick={() => handleRemoveEducation(ed.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentEd.degree}
                onChange={(e) => setCurrentEd({ ...currentEd, degree: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Bachelor of Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentEd.institution}
                onChange={(e) => setCurrentEd({ ...currentEd, institution: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Portland State University"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                value={currentEd.field}
                onChange={(e) => setCurrentEd({ ...currentEd, field: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Marketing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graduation Year
              </label>
              <input
                type="text"
                value={currentEd.graduation_year}
                onChange={(e) => setCurrentEd({ ...currentEd, graduation_year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="2020"
              />
            </div>
          </div>

          <button
            onClick={handleAddEducation}
            className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Add a skill (e.g., Google Analytics, Python, Project Management)"
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Press Enter or click Add to add each skill
        </p>
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
          disabled={education.length === 0 || skills.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Next: Professional Summary
        </button>
      </div>
    </div>
  );
}
