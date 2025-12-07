import { matchJob } from "@/lib/scoring/job-match";

describe("matchJob", () => {
  it("scores matches with skill overlap and must-haves", () => {
    const profile = { resume_skills: ["TypeScript", "React"], seniority_level: "senior", location: "Remote" };
    const job = {
      id: "job1",
      skills: ["TypeScript", "Node.js", "React"],
      must_have_skills: ["TypeScript"],
      seniority_level: "senior",
      location: "Remote",
    };
    const result = matchJob(profile, job);
    expect(result.scores.total).toBeGreaterThan(0);
    expect(result.reasons[0]).toContain("Matched");
  });

  it("returns zero when must-haves missing", () => {
    const profile = { resume_skills: ["React"], seniority_level: "mid" };
    const job = {
      id: "job2",
      skills: ["Go"],
      must_have_skills: ["Go"],
      seniority_level: "mid",
    };
    const result = matchJob(profile, job);
    expect(result.scores.total).toBe(0);
    expect(result.reasons).toContain("Missing must-have skills");
  });
});
