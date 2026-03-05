import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvidencePack } from "../../components/factory/EvidencePack";

describe("EvidencePack", () => {
  const mockEvidence = {
    claims: [
      {
        fact: "AI content consumption has increased by 40% in 2024",
        source: "Industry Report",
        sourceUrl: "https://example.com/report",
        verification: "verified" as const,
        usageNote: "Use this statistic in the introduction",
      },
      {
        fact: "75% of marketers use AI tools for content creation",
        source: "Survey Data",
        sourceUrl: "",
        verification: "estimate" as const,
        usageNote: "",
      },
    ],
    humanVoices: [
      {
        quote: "I love how AI helps me brainstorm new ideas",
        context: "User feedback",
        sentiment: "positive",
      },
      {
        quote: "Sometimes AI content feels too generic",
        context: "User concern",
        sentiment: "negative",
      },
    ],
    counterArguments: [
      "AI content lacks human touch",
      "Quality varies significantly between tools",
    ],
    freshAngles: [
      "Focus on AI-human collaboration",
      "Emphasize unique value propositions",
    ],
  };

  it("renders evidence pack with all sections", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    expect(screen.getByText("Evidence Pack")).toBeInTheDocument();
    expect(screen.getByText("Claims & Data (2)")).toBeInTheDocument();
    expect(screen.getByText("Human Voices (2)")).toBeInTheDocument();
    expect(screen.getByText("Counter Arguments (2)")).toBeInTheDocument();
    expect(screen.getByText("Fresh Angles (2)")).toBeInTheDocument();
  });

  it("expands and collapses sections", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Claims section should be expanded by default
    expect(
      screen.getByText("AI content consumption has increased by 40% in 2024"),
    ).toBeInTheDocument();

    // Click to collapse claims
    const claimsButton = screen.getByText("Claims & Data (2)");
    fireEvent.click(claimsButton);
    expect(
      screen.queryByText("AI content consumption has increased by 40% in 2024"),
    ).not.toBeInTheDocument();

    // Click to expand human voices — section is collapsed by default
    const voicesButton = screen.getByText("Human Voices (2)");
    fireEvent.click(voicesButton);
    // The component wraps quotes in <em> with curly quotes: "quote"
    expect(
      screen.getByText(/I love how AI helps me brainstorm new ideas/),
    ).toBeInTheDocument();
  });

  it("displays claims with verification status", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Use selector to get the badge <span>, not the filter <button> with same text
    const verifiedBadge = screen.getByText("verified", { selector: "span" });
    expect(verifiedBadge).toHaveStyle({ fontWeight: "700" });

    const estimateBadge = screen.getByText("estimate", { selector: "span" });
    expect(estimateBadge).toHaveStyle({ fontWeight: "700" });
  });

  it("shows source links when available", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    const link = screen.getByText("Link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com/report");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("displays human voices with sentiment", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Human voices section is collapsed by default — expand it first
    const voicesButton = screen.getByText("Human Voices (2)");
    fireEvent.click(voicesButton);

    // Quotes are wrapped in curly quotes by the component (\u201c...\u201d)
    expect(
      screen.getByText(/I love how AI helps me brainstorm new ideas/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("User feedback — Sentiment: positive"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sometimes AI content feels too generic/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("User concern — Sentiment: negative"),
    ).toBeInTheDocument();
  });

  it("displays counter arguments as list", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Counter arguments section is collapsed by default — expand it first
    const counterButton = screen.getByText("Counter Arguments (2)");
    fireEvent.click(counterButton);

    expect(
      screen.getByText("AI content lacks human touch"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Quality varies significantly between tools"),
    ).toBeInTheDocument();
  });

  it("displays fresh angles as list", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Fresh angles section is collapsed by default — expand it first
    const anglesButton = screen.getByText("Fresh Angles (2)");
    fireEvent.click(anglesButton);

    expect(
      screen.getByText("Focus on AI-human collaboration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Emphasize unique value propositions"),
    ).toBeInTheDocument();
  });

  it("shows usage notes for claims", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    expect(
      screen.getByText("Use this statistic in the introduction"),
    ).toBeInTheDocument();
  });

  it("handles empty evidence gracefully", () => {
    const emptyEvidence = {
      claims: [],
      humanVoices: [],
      counterArguments: [],
      freshAngles: [],
    };

    render(<EvidencePack evidence={emptyEvidence} />);

    expect(screen.getByText("Evidence Pack")).toBeInTheDocument();
    expect(screen.getByText("Claims & Data (0)")).toBeInTheDocument();
    expect(screen.getByText("Human Voices (0)")).toBeInTheDocument();
    // Counter Arguments and Fresh Angles should not be rendered if empty
    expect(screen.queryByText("Counter Arguments")).not.toBeInTheDocument();
    expect(screen.queryByText("Fresh Angles")).not.toBeInTheDocument();
  });

  it("applies correct styling to verification badges", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Use selector to get the badge <span>, not the filter <button> with same text
    const verifiedBadge = screen.getByText("verified", { selector: "span" });
    expect(verifiedBadge).toHaveStyle({ background: "rgba(0, 170, 0, 0.15)" });

    const estimateBadge = screen.getByText("estimate", { selector: "span" });
    expect(estimateBadge).toHaveStyle({
      background: "rgba(233, 215, 152, 0.3)",
    });
  });

  it("maintains consistent section layout", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    // Section buttons + filter buttons (all/verified/estimate/anecdotal) + action buttons
    // (Select all, Clear, Verified only) = 4 + 4 + 3 = 11 when claims is expanded
    const sectionButtons = screen.getAllByRole("button");
    expect(sectionButtons).toHaveLength(11);
  });

  it("shows correct counts in section titles", () => {
    render(<EvidencePack evidence={mockEvidence} />);

    expect(screen.getByText("Claims & Data (2)")).toBeInTheDocument();
    expect(screen.getByText("Human Voices (2)")).toBeInTheDocument();
    expect(screen.getByText("Counter Arguments (2)")).toBeInTheDocument();
    expect(screen.getByText("Fresh Angles (2)")).toBeInTheDocument();
  });
});
