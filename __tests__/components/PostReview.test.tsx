import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PostReview } from "../../components/factory/PostReview";

describe("PostReview", () => {
  const mockContent = "This is the original post content that needs review.";
  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders post review with all action buttons", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    expect(screen.getByText("Review & Approve")).toBeInTheDocument();
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Edit Before Approve")).toBeInTheDocument();
    expect(screen.getByText("Add Feedback")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("displays original content", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    // Content is only shown in a textarea once edit mode is activated
    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue(mockContent)).toBeInTheDocument();
  });

  it("enters edit mode when edit button is clicked", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    expect(screen.getByText("Edit Post")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockContent)).toBeInTheDocument();
  });

  it("enters feedback mode when feedback button is clicked", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type feedback and press Add..."),
    ).toBeInTheDocument();
  });

  it("toggles edit mode on and off", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");

    // Enter edit mode
    fireEvent.click(editButton);
    expect(screen.getByText("Edit Post")).toBeInTheDocument();

    // Exit edit mode
    fireEvent.click(editButton);
    expect(screen.queryByText("Edit Post")).not.toBeInTheDocument();
  });

  it("toggles feedback mode on and off", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");

    // Enter feedback mode
    fireEvent.click(feedbackButton);
    expect(screen.getByText("Feedback")).toBeInTheDocument();

    // Exit feedback mode
    fireEvent.click(feedbackButton);
    expect(screen.queryByText("Feedback")).not.toBeInTheDocument();
  });

  it("allows editing content in edit mode", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockContent);
    fireEvent.change(textarea, {
      target: { value: "This is the edited content." },
    });

    expect(textarea).toHaveValue("This is the edited content.");
  });

  it("adds feedback when add button is clicked", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    const input = screen.getByPlaceholderText("Type feedback and press Add...");
    const addButton = screen.getByText("Add");

    fireEvent.change(input, { target: { value: "Great content!" } });
    fireEvent.click(addButton);

    expect(screen.getByText("Great content!")).toBeInTheDocument();
    expect(screen.getByText("Feedback (1)")).toBeInTheDocument();
  });

  it("adds feedback when Enter key is pressed", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    const input = screen.getByPlaceholderText("Type feedback and press Add...");

    fireEvent.change(input, { target: { value: "Good job!" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Good job!")).toBeInTheDocument();
  });

  it("removes feedback when remove button is clicked", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    const input = screen.getByPlaceholderText("Type feedback and press Add...");
    const addButton = screen.getByText("Add");

    fireEvent.change(input, { target: { value: "Needs improvement" } });
    fireEvent.click(addButton);

    expect(screen.getByText("Needs improvement")).toBeInTheDocument();

    const removeButton = screen.getByText("remove");
    fireEvent.click(removeButton);

    expect(screen.queryByText("Needs improvement")).not.toBeInTheDocument();
  });

  it("approves with original content when no edits made", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith(mockContent, []);
  });

  it("approves with edited content when edits made", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockContent);
    fireEvent.change(textarea, {
      target: { value: "This is the final approved content." },
    });

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith(
      "This is the final approved content.",
      [],
    );
  });

  it("approves with feedback when feedback provided", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    const input = screen.getByPlaceholderText("Type feedback and press Add...");
    const addButton = screen.getByText("Add");

    fireEvent.change(input, { target: { value: "Good content" } });
    fireEvent.click(addButton);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith(mockContent, ["Good content"]);
  });

  it("rejects with feedback when feedback provided", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const feedbackButton = screen.getByText("Add Feedback");
    fireEvent.click(feedbackButton);

    const input = screen.getByPlaceholderText("Type feedback and press Add...");
    const addButton = screen.getByText("Add");

    fireEvent.change(input, { target: { value: "Needs major revisions" } });
    fireEvent.click(addButton);

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    expect(mockOnReject).toHaveBeenCalledWith(["Needs major revisions"]);
  });

  it("shows character count in edit mode", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    // The component renders `{editedContent.length} characters` as a single
    // text node. mockContent is 52 characters long.
    expect(screen.getByText("52 characters")).toBeInTheDocument();
  });

  it("shows modified indicator when content is edited", () => {
    render(
      <PostReview
        content={mockContent}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />,
    );

    const editButton = screen.getByText("Edit Before Approve");
    fireEvent.click(editButton);

    const textarea = screen.getByDisplayValue(mockContent);
    fireEvent.change(textarea, { target: { value: "Modified content" } });

    // Modified indicator is rendered as a separate text node alongside character count
    expect(screen.getByText(/modified/)).toBeInTheDocument();
  });
});
