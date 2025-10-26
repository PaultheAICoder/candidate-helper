import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("should render button with text content", () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });

    it("should render as a button element by default", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should render children correctly", () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should handle click events", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByText("Click"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not trigger click when disabled", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await user.click(screen.getByText("Disabled"));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should support keyboard activation with Enter", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByText("Press Enter");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalled();
    });

    it("should support keyboard activation with Space", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByText("Press Space");
      button.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<Button disabled>Disabled Button</Button>);
      expect(screen.getByText("Disabled Button")).toBeDisabled();
    });

    it("should apply disabled attribute", () => {
      render(<Button disabled>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("disabled");
    });

    it("should have disabled attribute when disabled", () => {
      render(<Button disabled>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("disabled");
    });
  });

  describe("Variants", () => {
    it("should apply default variant styles", () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("bg-blue-600");
    });

    it("should apply outline variant styles", () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("border");
    });

    it("should apply ghost variant styles", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("hover:bg-gray-100");
    });

    it("should apply link variant styles", () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("text-blue-600");
      expect(button).toHaveClass("hover:underline");
    });
  });

  describe("Sizes", () => {
    it("should apply default size styles", () => {
      const { container } = render(<Button>Default Size</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("h-10");
    });

    it("should apply small size styles", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("h-9");
    });

    it("should apply large size styles", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("h-11");
    });

    it("should apply icon size styles", () => {
      const { container } = render(<Button size="icon">Icon</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      const { container } = render(<Button className="custom-class">Custom</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("custom-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(<Button className="custom-class">Test</Button>);
      const button = container.firstChild;
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-blue-600");
    });

    it("should accept and apply aria-label", () => {
      render(<Button aria-label="Accessible button">Icon</Button>);
      const button = screen.getByLabelText("Accessible button");
      expect(button).toBeInTheDocument();
    });

    it("should support type attribute", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should render as button element", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Accessibility", () => {
    it("should be focusable", () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      render(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('should have role="button"', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should support custom ARIA attributes", () => {
      render(<Button aria-describedby="description-id">Described Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "description-id");
    });
  });

  describe("AsChild Prop (Radix Slot)", () => {
    it("should render as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByText("Link Button");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/test");
    });
  });
});
