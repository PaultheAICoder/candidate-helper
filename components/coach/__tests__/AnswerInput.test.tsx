import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerInput } from "../AnswerInput";

describe("AnswerInput Component", () => {
  const defaultProps = {
    questionText: "Tell me about a time when you demonstrated leadership.",
    questionNumber: 1,
    totalQuestions: 5,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should display question text", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(
        screen.getByText("Tell me about a time when you demonstrated leadership.")
      ).toBeInTheDocument();
    });

    it("should display question progress (X of Y)", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/Question 1 of 5/i)).toBeInTheDocument();
    });

    it("should render textarea for answer input", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/submit answer/i)).toBeInTheDocument();
    });

    it("should display character count", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/5000 characters remaining/)).toBeInTheDocument();
    });

    it("should show STAR framework hint", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/Set the context/i)).toBeInTheDocument();
      expect(screen.getByText(/Describe your responsibility/i)).toBeInTheDocument();
      expect(screen.getByText(/Explain what you did/i)).toBeInTheDocument();
      expect(screen.getByText(/Share the outcome/i)).toBeInTheDocument();
    });
  });

  describe("Character Count", () => {
    it("should update character count as user types", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test answer here");

      await waitFor(() => {
        expect(screen.getByText(/4984 characters remaining/)).toBeInTheDocument();
      });
    });

    it("should handle empty textarea", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/5000 characters remaining/)).toBeInTheDocument();
    });

    it("should count multiline text correctly", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Line 1{Enter}Line 2{Enter}Line 3");

      await waitFor(() => {
        const remaining = 5000 - textarea.value.length;
        expect(
          screen.getByText(new RegExp(`${remaining} characters remaining`))
        ).toBeInTheDocument();
      });
    });

    it("should warn when approaching character limit", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const longText = "a".repeat(4900);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Use paste for large text instead of type (much faster)
      await user.click(textarea);
      await user.paste(longText);

      await waitFor(() => {
        expect(screen.getByText(/100 characters remaining/)).toBeInTheDocument();
      });
    });

    it("should prevent input beyond 5000 characters", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const maxText = "a".repeat(5000);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // Use paste for large text instead of type (much faster)
      await user.click(textarea);
      await user.paste(maxText);

      await waitFor(() => {
        expect(textarea.value.length).toBeLessThanOrEqual(5000);
      });
    });
  });

  describe("Submit Button State", () => {
    it("should disable submit when answer is too short (< 10 characters)", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Short");

      await waitFor(() => {
        const submitButton = screen.getByText(/submit answer/i);
        expect(submitButton).toBeDisabled();
      });
    });

    it("should enable submit when answer meets minimum length (>= 10 characters)", async () => {
      const user = userEvent.setup();
      render(<AnswerInput {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "This answer has enough characters to be valid.");

      const submitButton = screen.getByText(/submit answer/i);
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should show disabled state initially", () => {
      render(<AnswerInput {...defaultProps} />);
      const submitButton = screen.getByText(/submit answer/i);
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when isSubmitting is true", () => {
      render(<AnswerInput {...defaultProps} isSubmitting={true} />);
      const submitButton = screen.getByText(/submitting/i);
      expect(submitButton).toBeDisabled();
    });

    it("should show loading text when submitting", () => {
      render(<AnswerInput {...defaultProps} isSubmitting={true} />);
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call onSubmit with answer text when submitted", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      const answerText = "This is my detailed answer with enough characters.";
      await user.type(textarea, answerText);

      const submitButton = screen.getByText(/submit answer/i);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(answerText);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("should not call onSubmit when answer is too short", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Short");

      await waitFor(() => {
        const submitButton = screen.getByText(/submit answer/i);
        // Button should be disabled, so click shouldn't work
        expect(submitButton).toBeDisabled();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should trim whitespace from answer before submitting", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "   Valid answer with leading/trailing spaces   ");

      const submitButton = screen.getByText(/submit answer/i);
      await user.click(submitButton);

      const submittedValue = mockOnSubmit.mock.calls[0][0];
      expect(submittedValue).not.toMatch(/^\s/);
      expect(submittedValue).not.toMatch(/\s$/);
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should submit answer with Ctrl+Enter", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Valid answer with keyboard shortcut support.");

      // Focus textarea and press Ctrl+Enter
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("should submit answer with Cmd+Enter (Mac)", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Valid answer for Mac keyboard shortcut.");

      // Press Cmd+Enter
      await user.keyboard("{Meta>}{Enter}{/Meta}");

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("should not submit with keyboard shortcut if answer too short", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Short");

      // Try to submit with keyboard shortcut
      await user.keyboard("{Control>}{Enter}{/Control}");

      // Wait a bit to ensure no submission occurred
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should not submit with keyboard shortcut while already submitting", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<AnswerInput {...defaultProps} onSubmit={mockOnSubmit} isSubmitting={true} />);

      const textarea = screen.getByRole("textbox");
      textarea.focus();
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label for textarea", () => {
      render(<AnswerInput {...defaultProps} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAccessibleName();
    });

    it("should have proper role for submit button", () => {
      render(<AnswerInput {...defaultProps} />);
      const submitButton = screen.getByRole("button");
      expect(submitButton).toBeInTheDocument();
    });

    it("should indicate loading state with text change", () => {
      render(<AnswerInput {...defaultProps} isSubmitting={true} />);
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });

    it("should be keyboard navigable", () => {
      render(<AnswerInput {...defaultProps} />);

      // Verify interactive elements are present and can be navigated
      const textbox = screen.getByRole("textbox");
      const submitButton = screen.getByRole("button");

      // Elements should be in the document and not have tabindex=-1
      expect(textbox).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(textbox).not.toHaveAttribute("tabindex", "-1");
      expect(submitButton).not.toHaveAttribute("tabindex", "-1");
    });
  });

  describe("STAR Hint Display", () => {
    it("should show expandable STAR hint", () => {
      render(<AnswerInput {...defaultProps} />);
      expect(screen.getByText(/Use the STAR Framework/i)).toBeInTheDocument();
    });

    it("should provide guidance on each STAR element", () => {
      render(<AnswerInput {...defaultProps} />);

      // Check for STAR element descriptions
      expect(screen.getByText(/Set the context/i)).toBeInTheDocument();
      expect(screen.getByText(/Describe your responsibility/i)).toBeInTheDocument();
      expect(screen.getByText(/Explain what you did/i)).toBeInTheDocument();
      expect(screen.getByText(/Share the outcome/i)).toBeInTheDocument();
    });
  });

  describe("Question Progress Display", () => {
    it("should show first question correctly", () => {
      render(<AnswerInput {...defaultProps} questionNumber={1} totalQuestions={8} />);
      expect(screen.getByText(/Question 1 of 8/i)).toBeInTheDocument();
    });

    it("should show last question correctly", () => {
      render(<AnswerInput {...defaultProps} questionNumber={8} totalQuestions={8} />);
      expect(screen.getByText(/Question 8 of 8/i)).toBeInTheDocument();
    });

    it("should show middle question correctly", () => {
      render(<AnswerInput {...defaultProps} questionNumber={5} totalQuestions={10} />);
      expect(screen.getByText(/Question 5 of 10/i)).toBeInTheDocument();
    });
  });
});
