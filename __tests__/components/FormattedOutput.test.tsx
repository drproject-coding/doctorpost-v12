import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormattedOutput } from "../../components/factory/FormattedOutput";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe("FormattedOutput", () => {
  const mockPost = {
    content:
      "This is a sample LinkedIn post content that demonstrates the formatting capabilities of the content factory. It includes a hook, value proposition, and call-to-action.",
    characterCount: 245,
    hookBeforeFold: {
      mobile: true,
      desktop: false,
    },
    suggestedPinnedComment:
      "What do you think about AI in content creation? Share your thoughts below!",
    metadata: {
      template: "Hook-Value-CTA",
      pillar: "Content Strategy",
      angle: "AI Optimization",
      score: 85,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders formatted post with all sections", () => {
    render(<FormattedOutput post={mockPost} />);

    expect(screen.getByText("Formatted Post")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(
      screen.getByText(/This is a sample LinkedIn post content/, {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(screen.getByText("Mobile fold")).toBeInTheDocument();
    expect(screen.getByText("Desktop fold")).toBeInTheDocument();
    expect(screen.getByText("Template")).toBeInTheDocument();
    expect(screen.getByText("Pillar")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
  });

  it("displays post content in LinkedIn-style preview", () => {
    render(<FormattedOutput post={mockPost} />);

    const preview = screen.getByText(/This is a sample LinkedIn post content/, {
      exact: false,
    });
    expect(preview).toBeInTheDocument();
    expect(preview.closest("pre")).toHaveStyle({ whiteSpace: "pre-wrap" });
  });

  it("shows correct metadata values", () => {
    render(<FormattedOutput post={mockPost} />);

    expect(screen.getByText("245")).toBeInTheDocument(); // Character count
    expect(screen.getByText("Above")).toBeInTheDocument(); // Mobile fold
    expect(screen.getByText("Below")).toBeInTheDocument(); // Desktop fold
    expect(screen.getByText("Hook-Value-CTA")).toBeInTheDocument(); // Template
    expect(screen.getByText("Content Strategy")).toBeInTheDocument(); // Pillar
    expect(screen.getByText("85")).toBeInTheDocument(); // Score
  });

  it("displays suggested pinned comment when available", () => {
    render(<FormattedOutput post={mockPost} />);

    expect(screen.getByText("Suggested Pinned Comment")).toBeInTheDocument();
    expect(
      screen.getByText(
        "What do you think about AI in content creation? Share your thoughts below!",
      ),
    ).toBeInTheDocument();
  });

  it("hides suggested pinned comment when not available", () => {
    const postWithoutComment = { ...mockPost, suggestedPinnedComment: "" };
    render(<FormattedOutput post={postWithoutComment} />);

    expect(
      screen.queryByText("Suggested Pinned Comment"),
    ).not.toBeInTheDocument();
  });

  it("handles copy functionality", async () => {
    render(<FormattedOutput post={mockPost} />);

    const copyButton = screen.getByText("Copy");
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockPost.content,
    );

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("shows copy button with correct icon", () => {
    render(<FormattedOutput post={mockPost} />);

    const copyButton = screen.getByText("Copy");
    expect(copyButton).toBeInTheDocument();
  });

  it("applies correct styling to metadata stats", () => {
    render(<FormattedOutput post={mockPost} />);

    const characterStat = screen.getByText("245").closest("div");
    expect(characterStat).toHaveStyle({ fontSize: "var(--bru-text-xs)" });
  });

  it("displays hook fold information correctly", () => {
    render(<FormattedOutput post={mockPost} />);

    expect(screen.getByText("Mobile fold")).toBeInTheDocument();
    expect(screen.getByText("Above")).toBeInTheDocument(); // Mobile is above fold
    expect(screen.getByText("Desktop fold")).toBeInTheDocument();
    expect(screen.getByText("Below")).toBeInTheDocument(); // Desktop is below fold
  });

  it("handles empty post content gracefully", () => {
    const emptyPost = {
      ...mockPost,
      content: "",
      characterCount: 0,
      hookBeforeFold: { mobile: false, desktop: false },
    };

    render(<FormattedOutput post={emptyPost} />);

    expect(screen.getByText("0")).toBeInTheDocument(); // Character count
    expect(screen.getAllByText("Below").length).toBeGreaterThanOrEqual(2); // Both mobile and desktop below fold
  });

  it("maintains responsive grid layout for metadata", () => {
    render(<FormattedOutput post={mockPost} />);

    // The MetaStat outer div has the grid styles; 'Characters' label is inside a nested div.
    // Go up two levels: label div -> MetaStat outer div -> grid container div
    const metadataGrid = screen.getByText("Characters").closest("div")
      ?.parentElement?.parentElement;
    expect(metadataGrid).toHaveStyle({ display: "grid" });
    expect(metadataGrid).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    });
  });

  it("shows correct styling for LinkedIn preview", () => {
    render(<FormattedOutput post={mockPost} />);

    // pre → padding div → LinkedIn card div (has background + maxWidth)
    const previewContainer = screen
      .getByText(/This is a sample LinkedIn post content/, { exact: false })
      .closest("pre")?.parentElement?.parentElement;
    expect(previewContainer).toHaveStyle({ background: "white" });
    // Card uses boxShadow for border effect, no border property
    expect(previewContainer).toHaveStyle({ overflow: "hidden" });
    // Default previewMode is "mobile" so maxWidth is 375
    expect(previewContainer).toHaveStyle({ maxWidth: "375px" });
  });
});
