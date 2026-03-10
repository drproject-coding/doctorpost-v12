import React from "react";
import { render, screen } from "@testing-library/react";
import { ResearchBrief } from "../../components/factory/ResearchBrief";

describe("ResearchBrief", () => {
  const mockBrief = {
    subtopicAngles: [
      {
        angle: "How to optimize content for AI algorithms",
        source: "Reddit",
        relevance: "High",
      },
      {
        angle: "The future of human creativity in AI era",
        source: "Twitter",
        relevance: "Medium",
      },
    ],
    painPoints: [
      {
        quote: "I spend hours creating content that gets no engagement",
        source: "User Survey",
        context: "Content creators frustrated with low reach",
      },
    ],
    currentDebates: [
      "Should AI-generated content be disclosed?",
      "Is human creativity becoming obsolete?",
    ],
    questionsAsked: [
      "How do I make my content stand out?",
      "What makes content truly engaging?",
    ],
  };

  const mockRefinedTopic = {
    pillar: "Content Strategy",
    angle: "AI-Optimized Content Creation",
    decisionMistake: "Focusing only on SEO without considering AI algorithms",
    headline: "Mastering AI-Optimized Content: The Future of Engagement",
    reasoning: "AI algorithms now play a crucial role in content discovery",
    templateRecommendation: "Hook-Value-CTA",
    hookCategoryRecommendation: "Question",
  };

  it("renders research brief with all sections", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(screen.getByText("Research Brief")).toBeInTheDocument();
    expect(screen.getByText("Subtopic Angles")).toBeInTheDocument();
    expect(screen.getByText("Pain Points")).toBeInTheDocument();
    expect(screen.getByText("Current Debates")).toBeInTheDocument();
    expect(screen.getByText("Questions People Are Asking")).toBeInTheDocument();
  });

  it("renders refined topic when provided", () => {
    render(<ResearchBrief brief={mockBrief} refinedTopic={mockRefinedTopic} />);

    expect(screen.getByText("Refined Topic")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mastering AI-Optimized Content: The Future of Engagement",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI-Optimized Content Creation"),
    ).toBeInTheDocument();
  });

  it("displays subtopic angles correctly", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(
      screen.getByText("How to optimize content for AI algorithms"),
    ).toBeInTheDocument();
    // Source and relevance are rendered together in one text node: "Reddit — High"
    expect(screen.getByText(/Reddit/)).toBeInTheDocument();
    expect(screen.getByText(/High/)).toBeInTheDocument();
  });

  it("displays pain points with quotes", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(
      screen.getByText(
        /I spend hours creating content that gets no engagement/,
      ),
    ).toBeInTheDocument();
    // Source and context are rendered together in one text node: "User Survey — Content creators frustrated with low reach"
    expect(screen.getByText(/User Survey/)).toBeInTheDocument();
    expect(
      screen.getByText(/Content creators frustrated with low reach/),
    ).toBeInTheDocument();
  });

  it("displays current debates as list", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(
      screen.getByText("Should AI-generated content be disclosed?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Is human creativity becoming obsolete?"),
    ).toBeInTheDocument();
  });

  it("displays questions asked as list", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(
      screen.getByText("How do I make my content stand out?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("What makes content truly engaging?"),
    ).toBeInTheDocument();
  });

  it("handles empty brief gracefully", () => {
    const emptyBrief = {
      subtopicAngles: [],
      painPoints: [],
      currentDebates: [],
      questionsAsked: [],
    };

    render(<ResearchBrief brief={emptyBrief} />);

    expect(screen.getByText("Research Brief")).toBeInTheDocument();
    // Should not crash with empty data
  });

  it("applies correct styling classes", () => {
    render(<ResearchBrief brief={mockBrief} />);

    // The Card component with variant="raised" renders with class "drp-card--raised"
    const card = screen.getByText("Research Brief").closest("div");
    expect(card).toHaveClass("drp-card--raised");
  });

  it("shows refined topic with correct styling", () => {
    render(<ResearchBrief brief={mockBrief} refinedTopic={mockRefinedTopic} />);

    // The refined topic section has inline styles using CSS variables
    const refinedTopicSection = screen
      .getByText("Refined Topic")
      .closest("div");
    expect(refinedTopicSection).toHaveStyle({ background: "var(--drp-cream)" });
    expect(refinedTopicSection).toHaveStyle({ border: "var(--drp-border)" });
  });

  it("handles missing refined topic", () => {
    render(<ResearchBrief brief={mockBrief} />);

    expect(screen.queryByText("Refined Topic")).not.toBeInTheDocument();
  });

  it("maintains consistent layout structure", () => {
    render(<ResearchBrief brief={mockBrief} />);

    // Check that all sections have proper heading elements (h4)
    const sections = screen.getAllByRole("heading", { level: 4 });
    expect(sections).toHaveLength(4); // Subtopic Angles, Pain Points, Current Debates, Questions Asked
  });
});
