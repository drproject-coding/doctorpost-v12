import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportFlow } from "../../components/knowledge/ImportFlow";
import { jest } from "@jest/globals";

// Mock the auth context
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { name: "Test User" },
  }),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("ImportFlow", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it("renders import flow with initial input step", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(screen.getByText("Import Knowledge")).toBeInTheDocument();
    expect(screen.getByText("Paste text or upload a file")).toBeInTheDocument();
    expect(screen.getByText("Upload .md file")).toBeInTheDocument();
    expect(screen.getByText("Or paste content")).toBeInTheDocument();
    expect(screen.getByText("Next: Classify")).toBeInTheDocument();
  });

  it("shows file upload input", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // The label has no `for` attribute, so query the input directly
    const fileInput = screen
      .getByText("Upload .md file")
      .closest("div")
      ?.querySelector('input[type="file"]') as HTMLElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", ".md,.txt");
  });

  it("shows text area for pasting content", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    expect(textarea).toBeInTheDocument();
  });

  it("disables next button when no content", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const nextButton = screen.getByText("Next: Classify");
    expect(nextButton).toBeDisabled();
  });

  it("enables next button when content is provided", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    expect(nextButton).not.toBeDisabled();
  });

  it("calls cancel when cancel button is clicked", () => {
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("transitions to classify step when next is clicked", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: "rules", subcategory: "hooks" }),
    });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });
  });

  it("shows classify step with form fields", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: "rules", subcategory: "hooks" }),
    });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Document Name")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Subcategory")).toBeInTheDocument();
      expect(screen.getByText("Content Preview")).toBeInTheDocument();
    });
  });

  it("shows content preview in classify step", async () => {
    const longContent = "A".repeat(1500);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: "rules", subcategory: "hooks" }),
    });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: longContent } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      // "Content Preview" is a <label>; the <pre> is a sibling, not an ancestor.
      // Navigate up to the wrapping bru-field div, then find the <pre> inside it.
      const label = screen.getByText("Content Preview");
      const fieldDiv = label.closest(".bru-field");
      const preview = fieldDiv?.querySelector("pre") as HTMLElement;
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveTextContent("A".repeat(1000));
      expect(preview).toHaveTextContent("...");
    });
  });

  it("handles file upload", async () => {
    const mockFile = new File(["file content"], "test.md", {
      type: "text/markdown",
    });

    // The component calls setFileName synchronously in handleFileUpload before
    // invoking FileReader, so "Selected: test.md" appears as soon as the change
    // event fires — no FileReader mock needed for this assertion.
    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // The label has no `for` attribute; find the input via DOM traversal.
    const fileInput = screen
      .getByText("Upload .md file")
      .closest("div")
      ?.querySelector('input[type="file"]') as HTMLElement;

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText("Selected: test.md")).toBeInTheDocument();
    });
  });

  it("calls API to save document when import is clicked", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ category: "rules", subcategory: "hooks" }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Go to classify step
    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });

    // Fill form and save
    const nameInput = screen.getByPlaceholderText("e.g. brand-voice");
    fireEvent.change(nameInput, { target: { value: "Test Document" } });

    const importButton = screen.getByText("Import Document");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/knowledge/create/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "rules",
          subcategory: "hooks",
          name: "Test Document",
          content: "Test content",
          version: 1,
          is_active: true,
          source: "import",
          updated_by: "Test User",
        }),
      });
    });
  });

  it("shows success feedback after successful import", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ category: "rules", subcategory: "hooks" }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Go to classify step
    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });

    // Fill form and save
    const nameInput = screen.getByPlaceholderText("e.g. brand-voice");
    fireEvent.change(nameInput, { target: { value: "Test Document" } });

    const importButton = screen.getByText("Import Document");
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(
        screen.getByText("Document imported successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("shows error feedback when import fails", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ category: "rules", subcategory: "hooks" }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Go to classify step
    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });

    // Fill form and save
    const nameInput = screen.getByPlaceholderText("e.g. brand-voice");
    fireEvent.change(nameInput, { target: { value: "Test Document" } });

    const importButton = screen.getByText("Import Document");
    fireEvent.click(importButton);

    await waitFor(() => {
      // Component does: setFeedback(`Error: ${String(err)}`)
      // err is: new Error("Failed to save document")
      // String(err) === "Error: Failed to save document"
      // So the rendered text is: "Error: Error: Failed to save document"
      expect(
        screen.getByText("Error: Error: Failed to save document"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state during import", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ category: "rules", subcategory: "hooks" }),
      })
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Go to classify step
    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });

    // Fill form and save
    const nameInput = screen.getByPlaceholderText("e.g. brand-voice");
    fireEvent.change(nameInput, { target: { value: "Test Document" } });

    const importButton = screen.getByText("Import Document");
    fireEvent.click(importButton);

    expect(importButton).toHaveTextContent("Saving...");
    expect(importButton).toBeDisabled();
  });

  it("allows going back to input step", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ category: "rules", subcategory: "hooks" }),
    });

    render(<ImportFlow onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Go to classify step
    const textarea = screen.getByPlaceholderText(
      "Paste markdown content here...",
    );
    fireEvent.change(textarea, { target: { value: "Test content" } });

    const nextButton = screen.getByText("Next: Classify");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Classify & Name")).toBeInTheDocument();
    });

    // Go back
    const backButton = screen.getByText("Back");
    fireEvent.click(backButton);

    expect(screen.getByText("Paste text or upload a file")).toBeInTheDocument();
  });
});
