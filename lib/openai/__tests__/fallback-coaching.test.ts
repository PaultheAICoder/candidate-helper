import { fallbackCoaching } from "@/lib/openai/fallback-coaching";

describe("fallbackCoaching", () => {
  it("returns STAR scores and narrative", () => {
    const result = fallbackCoaching("Tell me about a time", "I led a migration project");
    expect(result.star_scores.situation).toBeGreaterThan(0);
    expect(result.narrative).toMatch(/strengthen/);
    expect(result.example_answer).toContain("Try adding");
  });
});
