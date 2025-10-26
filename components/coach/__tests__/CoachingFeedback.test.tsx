import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoachingFeedback } from "../CoachingFeedback";
import type { PerQuestionFeedback } from "@/types/models";

describe("CoachingFeedback Component", () => {
  const mockFeedback: PerQuestionFeedback = {
    narrative:
      "Great job demonstrating leadership! You clearly explained the situation and your specific actions. Consider adding more measurable results to strengthen your answer.",
    example_answer:
      "In my role as Team Lead at Company X, I faced a situation where two team members had conflicting approaches to a critical project deadline. My responsibility was to resolve the conflict and keep the project on track. I scheduled a meeting with both team members, facilitated a discussion to understand each perspective, and helped them find common ground by focusing on shared goals. As a result, we delivered the project on time and the team members developed a better working relationship.",
  };

  describe("Rendering", () => {
    it("should display question number", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={3} />);
      expect(screen.getByText(/Question 3/i)).toBeInTheDocument();
    });

    it("should display narrative feedback", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.getByText(/Great job demonstrating leadership/i)).toBeInTheDocument();
    });

    it("should show example answer toggle button", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.getByText(/Show Example Improved Answer/i)).toBeInTheDocument();
    });

    it('should display "Coaching Feedback" header', () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.getByText(/Coaching Feedback/i)).toBeInTheDocument();
    });
  });

  describe("Example Answer Toggle", () => {
    it("should hide example answer by default", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.queryByText(/In my role as Team Lead/i)).not.toBeInTheDocument();
    });

    it("should show example answer when toggle button is clicked", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });
    });

    it("should hide example answer when toggle button is clicked again", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);

      // Show example
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });

      // Hide example
      const hideButton = screen.getByText(/Hide Example Improved Answer/i);
      await user.click(hideButton);
      await waitFor(() => {
        expect(screen.queryByText(/In my role as Team Lead/i)).not.toBeInTheDocument();
      });
    });

    it("should change button text when example is shown", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const showButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(showButton);

      await waitFor(() => {
        expect(screen.getByText(/Hide Example Improved Answer/i)).toBeInTheDocument();
      });
    });

    it("should show + icon when example is hidden", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.getByText("+")).toBeInTheDocument();
    });

    it("should show − icon when example is shown", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText("−")).toBeInTheDocument();
      });
    });
  });

  describe("Example Answer Display", () => {
    it("should display full example answer text", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        const exampleText = screen.getByText(/In my role as Team Lead at Company X/);
        expect(exampleText).toBeInTheDocument();
      });
    });

    it("should show placeholder note", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(
          screen.getByText(/This example uses only facts from your original answer/i)
        ).toBeInTheDocument();
      });
    });

    it("should style example answer distinctly", async () => {
      const user = userEvent.setup();
      const { container } = render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        const exampleContainer = container.querySelector(".bg-primary\\/5");
        expect(exampleContainer).toBeInTheDocument();
      });
    });
  });

  describe("Low-Anxiety Mode", () => {
    it("should accept lowAnxietyMode prop", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} lowAnxietyMode={true} />);
      // Component should still render normally
      expect(screen.getByText(/Coaching Feedback/i)).toBeInTheDocument();
    });

    it("should still show narrative in low-anxiety mode", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} lowAnxietyMode={true} />);
      expect(screen.getByText(/Great job demonstrating leadership/i)).toBeInTheDocument();
    });

    it("should still allow example toggle in low-anxiety mode", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} lowAnxietyMode={true} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should show example content when button is clicked", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByRole("button");
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });
    });

    it("should hide example content by default", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.queryByText(/In my role as Team Lead/i)).not.toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      await user.tab();
      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toHaveFocus();

      await user.keyboard("{Enter}");
      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });
    });

    it("should support keyboard activation with Space", async () => {
      const user = userEvent.setup();
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);

      const toggleButton = screen.getByRole("button");
      toggleButton.focus();

      await user.keyboard(" ");
      await waitFor(() => {
        expect(screen.getByText(/In my role as Team Lead/i)).toBeInTheDocument();
      });
    });
  });

  describe("Layout and Styling", () => {
    it("should have proper card styling", () => {
      const { container } = render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      const card = container.querySelector(".bg-card");
      expect(card).toBeInTheDocument();
    });

    it("should have proper spacing", () => {
      const { container } = render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      const card = container.querySelector(".space-y-4");
      expect(card).toBeInTheDocument();
    });

    it("should have border and rounded corners", () => {
      const { container } = render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      const card = container.querySelector(".border");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("rounded-lg");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long narrative text", () => {
      const longFeedback = {
        narrative: "A".repeat(1000),
        example_answer: "Example",
      };

      render(<CoachingFeedback feedback={longFeedback} questionNumber={1} />);
      expect(screen.getByText(longFeedback.narrative)).toBeInTheDocument();
    });

    it("should handle very long example answer", async () => {
      const user = userEvent.setup();
      const longFeedback = {
        narrative: "Great!",
        example_answer: "A".repeat(2000),
      };

      render(<CoachingFeedback feedback={longFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(longFeedback.example_answer)).toBeInTheDocument();
      });
    });

    it("should handle empty narrative gracefully", () => {
      const emptyFeedback = {
        narrative: "",
        example_answer: "Example answer",
      };

      render(<CoachingFeedback feedback={emptyFeedback} questionNumber={1} />);
      expect(screen.getByText(/Coaching Feedback/i)).toBeInTheDocument();
    });

    it("should handle empty example answer gracefully", async () => {
      const user = userEvent.setup();
      const emptyExampleFeedback = {
        narrative: "Good job!",
        example_answer: "",
      };

      render(<CoachingFeedback feedback={emptyExampleFeedback} questionNumber={1} />);

      const toggleButton = screen.getByText(/Show Example Improved Answer/i);
      await user.click(toggleButton);

      // Should not crash and button should change to Hide
      await waitFor(() => {
        expect(screen.getByText(/Hide Example Improved Answer/i)).toBeInTheDocument();
      });
    });

    it("should handle question number 1", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={1} />);
      expect(screen.getByText(/Question 1/i)).toBeInTheDocument();
    });

    it("should handle double-digit question numbers", () => {
      render(<CoachingFeedback feedback={mockFeedback} questionNumber={10} />);
      expect(screen.getByText(/Question 10/i)).toBeInTheDocument();
    });
  });

  describe("Multiple Feedback Cards", () => {
    it("should render multiple cards independently", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <CoachingFeedback feedback={mockFeedback} questionNumber={1} />
          <CoachingFeedback feedback={mockFeedback} questionNumber={2} />
        </div>
      );

      const buttons = screen.getAllByText(/Show Example Improved Answer/i);
      expect(buttons).toHaveLength(2);

      // Click first button
      await user.click(buttons[0]);

      await waitFor(() => {
        // Only one example should be shown
        const examples = screen.getAllByText(/In my role as Team Lead/i);
        expect(examples).toHaveLength(1);
      });
    });
  });
});
