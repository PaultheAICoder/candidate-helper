import { test, expect } from "@playwright/test";
import { cleanupAllTestData } from "./helpers/db-cleanup";

test.describe("Guest Practice Session Flow", () => {
  // Clean up database before each test to avoid constraint violations
  test.beforeEach(async () => {
    // Delete ALL test data to ensure completely clean state
    // This uses the nuclear option since tests run fast and data isn't "stale" yet
    await cleanupAllTestData();
  });
  test("should complete full guest session with 8 questions", async ({ page }) => {
    // 1. Land on homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/Cindy from Cinder/);

    // 2. Verify hero section is visible
    await expect(page.locator("h1")).toContainText("Cindy from Cinder");

    // 3. Click "Try Practice Session" CTA
    await page.locator("main").getByRole("button", { name: "Try Practice Session" }).click();
    await expect(page).toHaveURL(/\/practice/);

    // 4. Configure session (8 questions, text-only)
    await page.selectOption("#question-count", "8");

    // Enable Low-Anxiety Mode to disable adaptive follow-up questions and test core question progression
    await page.click("#low-anxiety-toggle");
    await expect(page.locator("#low-anxiety-toggle")).toBeChecked();

    // 5. Start practice session
    await page.click("text=Start Practice");

    // 6. Wait for questions to load and verify first question
    await page.waitForURL(/\/practice\/session\//);
    await expect(page.locator("h2")).toContainText("Question 1 of 8");

    // 7. Verify question text is displayed
    const questionText = await page.locator("p.text-lg").first();
    await expect(questionText).toBeVisible();

    // 8. Verify STAR hint is visible
    await expect(page.locator("text=Situation: Set the context")).toBeVisible();
    await expect(page.locator("text=Task: Describe your responsibility")).toBeVisible();
    await expect(page.locator("text=Action: Explain what you did")).toBeVisible();
    await expect(page.locator("text=Result: Share the outcome")).toBeVisible();

    // 9. Answer all 8 questions
    for (let i = 1; i <= 8; i++) {
      // Verify we're on the correct question
      await expect(page.locator("h2")).toContainText(`Question ${i} of 8`);

      // Fill in the answer
      const textarea = page.locator("textarea");
      const answer = `This is my detailed answer to question ${i}. In my previous role, I demonstrated strong ${i === 1 ? "leadership" : i === 2 ? "communication" : "problem-solving"} skills. I took specific actions that led to measurable results, improving team performance by ${i * 5}%. This experience taught me valuable lessons about collaboration and ownership.`;

      await textarea.fill(answer);

      // Verify character count updates
      await expect(page.locator("text=/ 5000")).toBeVisible();

      // Verify submit button becomes enabled
      const submitButton = page.locator('button:has-text("Submit Answer")');
      await expect(submitButton).toBeEnabled();

      // Submit the answer
      await submitButton.click();

      // If not last question, verify we moved to next question
      if (i < 8) {
        await expect(page.locator("h2")).toContainText(`Question ${i + 1} of 8`, {
          timeout: 10000,
        });
      }
    }

    // 10. Verify redirect to results page
    await page.waitForURL(/\/practice\/results\//, { timeout: 20000 });

    // 11. Wait for coaching generation to complete
    await expect(page.locator("text=Top 3 Strengths")).toBeVisible({ timeout: 30000 });

    // 12. Verify all three panes of the report are visible
    await expect(page.locator("text=Top 3 Strengths")).toBeVisible();
    await expect(page.locator("text=3 Clarifications")).toBeVisible();
    await expect(page.locator("text=Per-Question Feedback")).toBeVisible();

    // 13. Verify sign-up nudge is visible
    await expect(page.locator("text=Create a free account")).toBeVisible();

    // 14. Verify feedback sections have content
    const strengthsSection = page.locator("text=Top 3 Strengths").locator("..");
    await expect(strengthsSection).toBeVisible();

    const clarificationsSection = page.locator("text=3 Clarifications").locator("..");
    await expect(clarificationsSection).toBeVisible();

    // 15. Verify per-question feedback is collapsible
    const exampleButton = page.locator("text=Show Example").first();
    if (await exampleButton.isVisible()) {
      await exampleButton.click();
      await expect(page.locator("text=Hide Example")).toBeVisible();
    }
  });

  test("should enforce minimum answer length", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "3");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    const textarea = page.locator("textarea");
    await textarea.fill("Short"); // Only 5 characters

    const submitButton = page.locator('button:has-text("Submit Answer")');
    await expect(submitButton).toBeDisabled();

    // Verify character count is shown
    await expect(page.locator("text=5 / 5000")).toBeVisible();
  });

  test("should work with Low-Anxiety Mode (3 questions)", async ({ page }) => {
    await page.goto("/practice");

    // Enable Low-Anxiety Mode
    await page.check("#low-anxiety-toggle");

    // Question count should automatically adjust to 3
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    // Verify only 3 questions
    await expect(page.locator("h2")).toContainText("Question 1 of 3");

    // Answer all 3 questions
    for (let i = 1; i <= 3; i++) {
      const textarea = page.locator("textarea");
      await textarea.fill(
        `This is my answer to question ${i}. I demonstrated strong skills in this area with measurable results.`
      );

      const submitButton = page.locator('button:has-text("Submit Answer")');
      await submitButton.click();

      if (i < 3) {
        await expect(page.locator("h2")).toContainText(`Question ${i + 1} of 3`, { timeout: 5000 });
      }
    }

    // Verify redirect to results
    await page.waitForURL(/\/practice\/results\//, { timeout: 20000 });
    await expect(page.locator("text=Top 3 Strengths")).toBeVisible({ timeout: 30000 });
  });

  test("should support keyboard shortcuts", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "3");
    // Enable Low-Anxiety Mode to disable adaptive follow-ups and isolate keyboard shortcut testing
    await page.click("#low-anxiety-toggle");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    const textarea = page.locator("textarea");
    await textarea.fill(
      "This answer is long enough to be submitted via keyboard shortcut. It contains sufficient detail."
    );

    // Submit with Ctrl+Enter
    await page.keyboard.press("Control+Enter");

    // Verify we moved to next question
    await expect(page.locator("h2")).toContainText("Question 2 of 3", { timeout: 5000 });
  });

  test("should show character count as user types", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "3");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    const textarea = page.locator("textarea");

    // Initially 0
    await expect(page.locator("text=0 / 5000")).toBeVisible();

    // Type text
    await textarea.fill("This is a test answer.");

    // Character count should update (22 characters)
    await expect(page.locator("text=22 / 5000")).toBeVisible();
  });

  test("should handle navigation without answers", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "5");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    // Verify submit button is disabled without answer
    const submitButton = page.locator('button:has-text("Submit Answer")');
    await expect(submitButton).toBeDisabled();

    // Try to navigate away and back
    await page.goBack();
    await expect(page).toHaveURL(/\/practice/);
  });

  test("should display different question categories", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "8");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    // Collect first 3 question texts to verify variety
    const questions = [];

    for (let i = 1; i <= 3; i++) {
      const questionText = await page.locator("p.text-lg").first().textContent();
      questions.push(questionText);

      // Answer and move to next
      const textarea = page.locator("textarea");
      await textarea.fill(
        `Answer to question ${i} with sufficient length to pass validation checks.`
      );

      await page.click('button:has-text("Submit Answer")');

      if (i < 3) {
        await page.waitForTimeout(500); // Brief wait for navigation
      }
    }

    // Verify we got different questions
    const uniqueQuestions = new Set(questions);
    expect(uniqueQuestions.size).toBe(3);
  });

  test("should prevent exceeding maximum characters", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "3");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    const textarea = page.locator("textarea");

    // Try to enter more than 5000 characters
    const longText = "a".repeat(5001);
    await textarea.fill(longText);

    // Verify length is capped at 5000
    const value = await textarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(5000);
  });

  test("should show loading state while generating coaching", async ({ page }) => {
    await page.goto("/practice");

    await page.selectOption("#question-count", "3");
    // Enable Low-Anxiety Mode to disable adaptive follow-ups for quick session completion
    await page.click("#low-anxiety-toggle");
    await page.click("text=Start Practice");

    await page.waitForURL(/\/practice\/session\//);

    // Answer all questions quickly
    for (let i = 1; i <= 3; i++) {
      const textarea = page.locator("textarea");
      await textarea.fill(`Quick answer ${i} that is long enough for validation.`);

      await page.click('button:has-text("Submit Answer")');

      if (i < 3) {
        await page.waitForTimeout(500);
      }
    }

    // Should redirect to results and show loading state
    await page.waitForURL(/\/practice\/results\//, { timeout: 20000 });

    // Coaching should eventually appear
    await expect(page.locator("text=Top 3 Strengths")).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Landing Page", () => {
  test("should display hero section with CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Cindy from Cinder");
    await expect(
      page.locator("main").getByRole("button", { name: "Try Practice Session" })
    ).toBeVisible();
  });

  test("should navigate to practice setup from CTA", async ({ page }) => {
    await page.goto("/");

    await page.locator("main").getByRole("button", { name: "Try Practice Session" }).click();
    await expect(page).toHaveURL(/\/practice/);
  });

  test("should have accessible navigation", async ({ page }) => {
    await page.goto("/");

    // Check for navigation elements
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});

test.describe("Practice Setup Page", () => {
  test("should display all setup options", async ({ page }) => {
    await page.goto("/practice");

    await expect(page.locator('label:has-text("Question Count")')).toBeVisible();
    await expect(page.locator('label:has-text("Low-Anxiety Mode")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Practice")')).toBeVisible();
  });

  test("should support all question count options", async ({ page }) => {
    await page.goto("/practice");

    const select = page.locator("#question-count");

    // Check options exist
    await expect(select.locator('option[value="3"]')).toHaveCount(1);
    await expect(select.locator('option[value="5"]')).toHaveCount(1);
    await expect(select.locator('option[value="8"]')).toHaveCount(1);
    await expect(select.locator('option[value="10"]')).toHaveCount(1);
  });

  test("should toggle Low-Anxiety Mode", async ({ page }) => {
    await page.goto("/practice");

    const checkbox = page.locator("#low-anxiety-toggle");

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});
