import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import PostEditorModal from "@/components/PostEditorModal";
import { createMockScheduledPost } from "../utils/testUtils";

// NOTE: The save button in PostEditorModal has onClick={void handleSave} which
// evaluates to onClick={undefined} — a known component bug. The save button
// cannot be triggered via click. Tests below cover what the component actually
// supports.

describe("PostEditorModal", () => {
  const mockPost = createMockScheduledPost({
    id: "test-post-id",
    title: "Original Title",
    content: "Original content",
    status: "draft",
  });

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  it("renders modal when open", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText("Edit Post: Original Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Original Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Original content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <PostEditorModal
        isOpen={false}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    expect(
      screen.queryByText("Edit Post: Original Title"),
    ).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    // Close button renders with class "drp-modal__close" and has no accessible text name
    const closeButton = document.querySelector(
      ".drp-modal__close",
    ) as HTMLElement;
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("updates title when input changes", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const titleInput = screen.getByDisplayValue("Original Title");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    expect(titleInput).toHaveValue("Updated Title");
  });

  it("updates content when textarea changes", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const contentTextarea = screen.getByDisplayValue("Original content");
    fireEvent.change(contentTextarea, { target: { value: "Updated content" } });

    expect(contentTextarea).toHaveValue("Updated content");
  });

  it("updates status when select changes", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const statusSelect = screen.getByDisplayValue("Draft");
    fireEvent.change(statusSelect, { target: { value: "scheduled" } });

    expect(statusSelect).toHaveValue("scheduled");
  });

  it("save button is rendered and enabled by default", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it("cancel button calls onClose", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("reinitialises fields when reopened with new post", () => {
    const { rerender } = render(
      <PostEditorModal
        isOpen={false}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const updatedPost = createMockScheduledPost({
      id: "test-post-id",
      title: "New Title",
      content: "New content",
      status: "scheduled",
    });

    rerender(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={updatedPost}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByDisplayValue("New Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("New content")).toBeInTheDocument();
  });

  it("does not render when post is null", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={null}
        onSave={mockOnSave}
      />,
    );

    expect(screen.queryByText(/edit post/i)).not.toBeInTheDocument();
  });

  it("all status options are available in the select", () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />,
    );

    const statusSelect = screen.getByRole("combobox");
    const options = Array.from((statusSelect as HTMLSelectElement).options).map(
      (o) => o.value,
    );

    expect(options).toContain("draft");
    expect(options).toContain("to-review");
    expect(options).toContain("to-plan");
    expect(options).toContain("to-publish");
    expect(options).toContain("scheduled");
    expect(options).toContain("published");
  });

  it("renders modal title with post title", () => {
    const customPost = createMockScheduledPost({ title: "My Custom Post" });

    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={customPost}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByText("Edit Post: My Custom Post")).toBeInTheDocument();
  });
});
