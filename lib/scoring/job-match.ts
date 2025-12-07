import type { MatchScores } from "@/types/models";

interface Job {
  id: string;
  skills: string[];
  must_have_skills?: string[] | null;
  seniority_level: string;
  location?: string | null;
}

interface Profile {
  target_roles?: string[] | null;
  seniority_level?: string | null;
  location?: string | null;
  resume_skills?: string[] | null;
}

export interface MatchResult {
  jobId: string;
  scores: MatchScores;
  reasons: string[];
}

/**
 * Simple deterministic job matching algorithm based on skills overlap and seniority.
 * Weights: hard skills 50%, soft skills 20% (treated as additional skills), seniority 20%, logistics 10%.
 */
export function matchJob(profile: Profile, job: Job): MatchResult {
  const profileSkills = new Set((profile.resume_skills ?? []).map((s) => s.toLowerCase()));
  const jobSkills = (job.skills ?? []).map((s) => s.toLowerCase());

  const mustHaves = (job.must_have_skills ?? []).map((s) => s.toLowerCase());
  const hasMustHaves = mustHaves.every((m) => profileSkills.has(m));

  const overlap = jobSkills.filter((s) => profileSkills.has(s));
  const hardSkillsScore = Math.round(Math.min(50, (overlap.length / Math.max(jobSkills.length, 1)) * 50));

  const seniorityMatch =
    profile.seniority_level && job.seniority_level
      ? profile.seniority_level === job.seniority_level
        ? 20
        : 10
      : 10;

  const logisticsScore = profile.location && job.location && profile.location === job.location ? 10 : 5;

  const total = hasMustHaves
    ? hardSkillsScore + 20 /* soft skills placeholder */ + seniorityMatch + logisticsScore
    : 0;

  const reasons = hasMustHaves
    ? [`Matched ${overlap.length} skills`, `Seniority ${seniorityMatch}/20`, `Logistics ${logisticsScore}/10`]
    : ["Missing must-have skills"];

  return {
    jobId: job.id,
    scores: {
      total,
      hardSkills: hardSkillsScore,
      softSkills: 20,
      seniority: seniorityMatch,
      logistics: logisticsScore,
    },
    reasons,
  };
}
