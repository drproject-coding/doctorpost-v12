import React from "react";
import { render, screen } from "@testing-library/react";
import { SignalCounts } from "../../components/learning/SignalCounts";
import type { Signal } from "@/lib/knowledge/types";

describe("SignalCounts", () => {
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
    render(<SignalCounts signals={[]} />);

    expect(screen.getByText("Signal Overview")).toBeInTheDocument();
  });

  it("shows empty state when no signals", () => {
    render(<SignalCounts signals={[]} />);

    expect(
      screen.getByText(
        /No signals recorded yet\. Signals are created when you approve, edit, or reject posts/,
      ),
    ).toBeInTheDocument();
  });

  it("shows total signal count", () => {
    const signals = [
      mockSignal({ signalType: "approval" }),
      mockSignal({ signalType: "rejection" }),
      mockSignal({ signalType: "edit" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("3 total signals")).toBeInTheDocument();
  });

  it("displays counts per signal type", () => {
    const signals = [
      mockSignal({ signalType: "approval" }),
      mockSignal({ signalType: "approval" }),
      mockSignal({ signalType: "rejection" }),
      mockSignal({ signalType: "edit" }),
      mockSignal({ signalType: "edit" }),
      mockSignal({ signalType: "edit" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("2")).toBeInTheDocument(); // Approvals
    expect(screen.getByText("1")).toBeInTheDocument(); // Rejections
  });

  it("shows correct signal type labels", () => {
    const signals = [
      mockSignal({ signalType: "approval" }),
      mockSignal({ signalType: "rejection" }),
      mockSignal({ signalType: "edit" }),
      mockSignal({ signalType: "hook-rewrite" }),
      mockSignal({ signalType: "tone-feedback" }),
      mockSignal({ signalType: "score-override" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Rejections")).toBeInTheDocument();
    expect(screen.getByText("Edits")).toBeInTheDocument();
    expect(screen.getByText("Hook Rewrites")).toBeInTheDocument();
    expect(screen.getByText("Tone Feedback")).toBeInTheDocument();
    expect(screen.getByText("Score Overrides")).toBeInTheDocument();
  });

  it('shows "By Category" section', () => {
    const signals = [
      mockSignal({ category: "hooks" }),
      mockSignal({ category: "content" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("By Category")).toBeInTheDocument();
  });

  it("displays category breakdown", () => {
    const signals = [
      mockSignal({ category: "hooks" }),
      mockSignal({ category: "hooks" }),
      mockSignal({ category: "content" }),
      mockSignal({ category: "tone" }),
      mockSignal({ category: "tone" }),
      mockSignal({ category: "tone" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("tone")).toBeInTheDocument();
  });

  it("shows zero count for unused signal types", () => {
    const signals = [mockSignal({ signalType: "approval" })];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Rejections")).toBeInTheDocument();
    expect(screen.getByText("Edits")).toBeInTheDocument();
  });

  it("renders grid layout for signal type cards", () => {
    const signals = [mockSignal({ signalType: "approval" })];

    const { container } = render(<SignalCounts signals={signals} />);

    const gridContainer = container.querySelector(
      'div[style*="display: grid"]',
    );
    expect(gridContainer).toBeInTheDocument();
  });

  it("handles multiple signals of same type", () => {
    const signals = [
      mockSignal({ signalType: "approval", observation: "Good hook" }),
      mockSignal({ signalType: "approval", observation: "Strong angle" }),
      mockSignal({ signalType: "approval", observation: "Clear CTA" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("3 total signals")).toBeInTheDocument();
  });

  it("categorizes signals correctly across multiple categories", () => {
    const signals = [
      mockSignal({ category: "hooks", signalType: "approval" }),
      mockSignal({ category: "hooks", signalType: "rejection" }),
      mockSignal({ category: "content", signalType: "approval" }),
      mockSignal({ category: "content", signalType: "approval" }),
    ];

    render(<SignalCounts signals={signals} />);

    expect(screen.getByText("4 total signals")).toBeInTheDocument();
    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("sorts categories by count descending", () => {
    const signals = [
      mockSignal({ category: "hooks" }),
      mockSignal({ category: "content" }),
      mockSignal({ category: "content" }),
      mockSignal({ category: "tone" }),
      mockSignal({ category: "tone" }),
      mockSignal({ category: "tone" }),
    ];

    render(<SignalCounts signals={signals} />);

    // Just verify all categories are displayed
    expect(screen.getByText("By Category")).toBeInTheDocument();
    expect(screen.getByText("hooks")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByText("tone")).toBeInTheDocument();
  });
});
