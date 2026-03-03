import React from "react";
import { render, screen } from "@testing-library/react";
import { PatternList } from "../../components/learning/PatternList";
import type { Signal } from "@/lib/knowledge/types";

describe("PatternList", () => {
  const mockSignal = (overrides: Partial<Signal> = {}): Signal => ({
    id: "sig-1",
    userId: "user-1",
    sessionId: "session-abc123",
    signalType: "approval" as const,
    category: "hooks",
    context: {},
    observation: "Good hook pattern",
    createdAt: "2026-01-15T10:00:00Z",
    ...overrides,
  });

  it("renders heading", () => {
    render(<PatternList signals={[]} />);

    expect(screen.getByText("Detected Patterns")).toBeInTheDocument();
  });

  it("shows empty state when no signals", () => {
    render(<PatternList signals={[]} />);

    expect(
      screen.getByText(
        /No patterns detected yet\. Patterns emerge as you use the Content Factory/,
      ),
    ).toBeInTheDocument();
  });

  it("detects pattern from signals grouped by category and type", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Pattern 1",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Pattern 2",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Pattern 3",
      }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("approval")).toBeInTheDocument();
  });

  it("shows signal count badge", () => {
    const signals = [
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("3 signals")).toBeInTheDocument();
  });

  it('shows "Promotion Ready" status when pattern reaches 10+ signals', () => {
    const signals = Array.from({ length: 10 }, (_, i) =>
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: `Observation ${i + 1}`,
        id: `sig-${i}`,
      }),
    );

    render(<PatternList signals={signals} />);

    expect(screen.getByText("Promotion Ready")).toBeInTheDocument();
  });

  it("shows progress text for patterns below threshold", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 1",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 2",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 3",
      }),
    ];

    render(<PatternList signals={signals} />);

    expect(
      screen.getByText("3/10 signals toward rule promotion"),
    ).toBeInTheDocument();
  });

  it("shows progress bar for patterns below threshold", () => {
    const signals = [
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "approval" }),
    ];

    const { container } = render(<PatternList signals={signals} />);

    const progressFill = container.querySelector('div[style*="width: 50%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it("does not show progress bar for promotion ready patterns", () => {
    const signals = Array.from({ length: 10 }, (_, i) =>
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: `Obs ${i}`,
        id: `sig-${i}`,
      }),
    );

    render(<PatternList signals={signals} />);

    expect(
      screen.queryByText(/signals toward rule promotion/),
    ).not.toBeInTheDocument();
  });

  it("displays recent observations", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Recent observation 1",
        createdAt: "2026-01-15T12:00:00Z",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Recent observation 2",
        createdAt: "2026-01-15T11:00:00Z",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Older observation",
        createdAt: "2026-01-14T10:00:00Z",
      }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("Recent observation 1")).toBeInTheDocument();
    expect(screen.getByText("Recent observation 2")).toBeInTheDocument();
    expect(screen.getByText("Older observation")).toBeInTheDocument();
  });

  it("sorts patterns by count descending", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "H1",
        id: "h1",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "H2",
        id: "h2",
      }),
      mockSignal({
        category: "content",
        signalType: "edit",
        observation: "C1",
        id: "c1",
      }),
      mockSignal({
        category: "content",
        signalType: "edit",
        observation: "C2",
        id: "c2",
      }),
      mockSignal({
        category: "content",
        signalType: "edit",
        observation: "C3",
        id: "c3",
      }),
    ];

    render(<PatternList signals={signals} />);

    const categoryTexts = screen.getAllByText(/hooks|content/);
    // Content should appear first (3 signals) before hooks (2 signals)
    const firstCategory = categoryTexts[0].textContent;
    expect(firstCategory).toBe("content");
  });

  it("handles multiple patterns with different categories and types", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Good hook",
        id: "h1",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Strong hook",
        id: "h2",
      }),
      mockSignal({
        category: "content",
        signalType: "edit",
        observation: "Content fix",
        id: "c1",
      }),
      mockSignal({
        category: "tone",
        signalType: "tone-feedback",
        observation: "Tone issue",
        id: "t1",
      }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("tone")).toBeInTheDocument();
    expect(screen.getByText("approval")).toBeInTheDocument();
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.getByText("tone-feedback")).toBeInTheDocument();
  });

  it("shows only 3 most recent observations", () => {
    const signals = [
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 1",
        createdAt: "2026-01-15T14:00:00Z",
        id: "sig-1",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 2",
        createdAt: "2026-01-15T13:00:00Z",
        id: "sig-2",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 3",
        createdAt: "2026-01-15T12:00:00Z",
        id: "sig-3",
      }),
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: "Obs 4 (hidden)",
        createdAt: "2026-01-15T11:00:00Z",
        id: "sig-4",
      }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("Obs 1")).toBeInTheDocument();
    expect(screen.getByText("Obs 2")).toBeInTheDocument();
    expect(screen.getByText("Obs 3")).toBeInTheDocument();
    expect(screen.queryByText("Obs 4 (hidden)")).not.toBeInTheDocument();
  });

  it("shows 9/10 progress for 9 signals", () => {
    const signals = Array.from({ length: 9 }, (_, i) =>
      mockSignal({
        category: "hooks",
        signalType: "approval",
        observation: `Obs ${i}`,
        id: `sig-${i}`,
      }),
    );

    render(<PatternList signals={signals} />);

    expect(
      screen.getByText("9/10 signals toward rule promotion"),
    ).toBeInTheDocument();
  });

  it("displays multiple patterns correctly", () => {
    const signals = [
      mockSignal({ category: "hooks", signalType: "approval", id: "h1" }),
      mockSignal({ category: "hooks", signalType: "approval", id: "h2" }),
      mockSignal({ category: "content", signalType: "edit", id: "c1" }),
      mockSignal({ category: "content", signalType: "edit", id: "c2" }),
    ];

    render(<PatternList signals={signals} />);

    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("approval")).toBeInTheDocument();
    expect(screen.getByText("edit")).toBeInTheDocument();
  });
});
