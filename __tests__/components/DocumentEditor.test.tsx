import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentEditor } from "../../components/knowledge/DocumentEditor";

describe("DocumentEditor", () => {
  const mockProps = {
    documentId: "doc-123",
    name: "Content Strategy Guidelines",
    category: "rules",
    content: "Original content here",
    version: 1,
    onSave: jest.fn().mockResolvedValue(undefined),
    onClose: jest.fn(),
    onShowHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders document editor with all elements", () => {
    render(<DocumentEditor {...mockProps} />);

    expect(screen.getByText("Content Strategy Guidelines")).toBeInTheDocument();
    expect(screen.getByText(/rules/)).toBeInTheDocument();
    expect(screen.getByText(/v1/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Original content here"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Change reason (optional)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("displays version information correctly", () => {
    render(<DocumentEditor {...mockProps} version={5} />);

    expect(screen.getByText(/v5/)).toBeInTheDocument();
  });

  it("shows save button as disabled when no changes made", () => {
    render(<DocumentEditor {...mockProps} />);

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when content is changed", () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    expect(saveButton).not.toBeDisabled();
  });

  it("calls onSave when save is clicked with changes", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(
        "Modified content",
        "Manual edit",
      );
    });
  });

  it("calls onSave with custom reason when provided", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const reasonInput = screen.getByPlaceholderText("Change reason (optional)");
    fireEvent.change(reasonInput, { target: { value: "Updated guidelines" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(
        "Modified content",
        "Updated guidelines",
      );
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(<DocumentEditor {...mockProps} />);

    // Close button renders an SVG X icon; it is the second button (after the history button)
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[1];
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("calls onShowHistory when history button is clicked", () => {
    render(<DocumentEditor {...mockProps} />);

    const historyButton = screen.getByTitle("Version history");
    fireEvent.click(historyButton);

    expect(mockProps.onShowHistory).toHaveBeenCalled();
  });

  it("shows saving state during save operation", async () => {
    const slowSave = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    render(<DocumentEditor {...mockProps} onSave={slowSave} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(saveButton).toHaveTextContent("Saving...");
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(saveButton).toHaveTextContent("Save");
    });
  });

  it("shows success feedback after successful save", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });
  });

  it("shows error feedback when save fails", async () => {
    const failingSave = jest.fn().mockRejectedValue(new Error("Save failed"));
    render(<DocumentEditor {...mockProps} onSave={failingSave} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Error: Error: Save failed")).toBeInTheDocument();
    });
  });

  it("hides feedback after 3 seconds", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    // Wait for feedback to disappear (mocking setTimeout)
    jest.advanceTimersByTime(3000);
  });

  it("maintains disabled state when no changes", () => {
    render(<DocumentEditor {...mockProps} />);

    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();

    // Even after typing and reverting
    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Temporary change" } });
    fireEvent.change(textarea, { target: { value: "Original content here" } });

    expect(saveButton).toBeDisabled();
  });

  it("applies correct styling to editor textarea", () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    expect(textarea).toHaveStyle({ fontFamily: "monospace" });
    expect(textarea).toHaveStyle({ fontSize: "var(--drp-text-sm)" });
    expect(textarea).toHaveStyle({ resize: "vertical" });
  });

  it("applies correct styling to feedback message", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      const feedback = screen.getByText("Saved successfully");
      expect(feedback).toHaveStyle({ background: "rgba(0, 170, 0, 0.12)" });
      expect(feedback).toHaveStyle({ color: "var(--drp-success-dark)" });
    });
  });

  it("handles empty reason gracefully", async () => {
    render(<DocumentEditor {...mockProps} />);

    const textarea = screen.getByDisplayValue("Original content here");
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(
        "Modified content",
        "Manual edit",
      );
    });
  });
});
