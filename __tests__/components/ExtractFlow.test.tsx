import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExtractFlow } from "../../components/knowledge/ExtractFlow";
import { jest } from "@jest/globals";

// Mock the auth context
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { name: "Test User" },
  }),
}));

// Mock fetch globally (component uses fetch directly, not an API layer)
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("ExtractFlow", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const mockTemplate = {
    name: "LinkedIn Post Template",
    structure: "Hook → Value → CTA",
    hookPattern: "Question or bold statement",
    closerPattern: "Call to action with question",
    estimatedLength: 250,
    toneNotes: "Professional and engaging",
    exampleHooks: ["Have you ever wondered...", "What if I told you..."],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders extract flow with initial paste step", () => {
    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(
      screen.getByRole("heading", { name: /Extract Template/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Paste an admired LinkedIn post"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Paste the full LinkedIn post here..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Extract Template/ }),
    ).toBeInTheDocument();
  });

  it("disables extract button when no content", () => {
    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    expect(extractButton).toBeDisabled();
  });

  it("enables extract button when content is provided", () => {
    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    expect(extractButton).not.toBeDisabled();
  });

  it("calls cancel when cancel button is clicked", () => {
    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("transitions to extracting step when extract is clicked", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(
        screen.getByText("Analyzing post structure..."),
      ).toBeInTheDocument();
    });
  });

  it("shows extracting step with loading animation", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(
        screen.getByText("Analyzing post structure..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "AI is deconstructing the post into a reusable template",
        ),
      ).toBeInTheDocument();
    });
  });

  it("transitions to preview step after successful extraction", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });
  });

  it("shows template preview with all sections", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Name")).toBeInTheDocument();
      expect(screen.getByText("Hook Pattern")).toBeInTheDocument();
      expect(screen.getByText("Closer Pattern")).toBeInTheDocument();
      expect(screen.getByText("Structure")).toBeInTheDocument();
      expect(screen.getByText("Example Hooks")).toBeInTheDocument();
    });
  });

  it("displays template data correctly", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Hook Pattern")).toBeInTheDocument();
      expect(
        screen.getByText("Question or bold statement"),
      ).toBeInTheDocument();
      expect(screen.getByText("Closer Pattern")).toBeInTheDocument();
      expect(
        screen.getByText("Call to action with question"),
      ).toBeInTheDocument();
      expect(screen.getByText("Hook → Value → CTA")).toBeInTheDocument();
      expect(screen.getByText(/Professional and engaging/)).toBeInTheDocument();
      expect(screen.getByText(/~250 chars/)).toBeInTheDocument();
    });
  });

  it("shows example hooks as list", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Have you ever wondered...")).toBeInTheDocument();
      expect(screen.getByText("What if I told you...")).toBeInTheDocument();
    });
  });

  it("allows editing template name", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("LinkedIn Post Template");
      fireEvent.change(nameInput, {
        target: { value: "Custom Template Name" },
      });
      expect(nameInput).toHaveValue("Custom Template Name");
    });
  });

  it("calls API to save template when save is clicked", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
      } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Extract template
    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Save template
    const saveButton = screen.getByText("Save Template");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/knowledge/create/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("LinkedIn Post Template"),
      });
    });
  });

  it("calls onComplete after successful save", async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
      } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Extract template
    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Save template
    const saveButton = screen.getByText("Save Template");
    fireEvent.click(saveButton);

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByText("Saving template...")).toBeInTheDocument();
    });

    // Advance timer for the setTimeout(onComplete, 1500)
    jest.advanceTimersByTime(1500);

    expect(mockOnComplete).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("shows error feedback when extraction fails", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Extraction failed" }),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(
        screen.getByText("Error: Error: Extraction failed"),
      ).toBeInTheDocument();
    });
  });

  it("shows error feedback when save fails", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
      } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Extract template
    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Save template
    const saveButton = screen.getByText("Save Template");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Error: Error: Failed to save template"),
      ).toBeInTheDocument();
    });
  });

  it("shows saving state during save operation", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      } as any)
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Extract template
    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Save template
    const saveButton = screen.getByText("Save Template");
    fireEvent.click(saveButton);

    expect(screen.getByText("Saving template...")).toBeInTheDocument();
  });

  it("allows going back to paste step from preview", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Go back
    const backButton = screen.getByText("Back");
    fireEvent.click(backButton);

    expect(
      screen.getByText("Paste an admired LinkedIn post"),
    ).toBeInTheDocument();
  });

  it("disables save button when template name is empty", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplate),
    } as any);

    render(<ExtractFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste the full LinkedIn post here...",
    );
    fireEvent.change(textarea, { target: { value: "Test post content" } });

    const extractButton = screen.getByRole("button", {
      name: /Extract Template/,
    });
    fireEvent.click(extractButton);

    await waitFor(() => {
      expect(screen.getByText("Template Preview")).toBeInTheDocument();
    });

    // Clear template name
    const nameInput = screen.getByDisplayValue("LinkedIn Post Template");
    fireEvent.change(nameInput, { target: { value: "" } });

    const saveButton = screen.getByText("Save Template");
    expect(saveButton).toBeDisabled();
  });
});
