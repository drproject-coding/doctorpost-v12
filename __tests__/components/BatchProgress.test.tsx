import React from "react";
import { render, screen } from "@testing-library/react";
import { BatchProgress } from "../../components/campaigns/BatchProgress";

describe("BatchProgress", () => {
  it("renders heading", () => {
    render(<BatchProgress phase="idle" slotsPlanned={0} totalSlots={10} />);

    expect(screen.getByText("Campaign Progress")).toBeInTheDocument();
  });

  it('shows "Ready to start" text for idle phase', () => {
    render(<BatchProgress phase="idle" slotsPlanned={0} totalSlots={10} />);

    expect(screen.getByText("Ready to start")).toBeInTheDocument();
  });

  it('shows "Creating campaign..." text for creating phase', () => {
    render(<BatchProgress phase="creating" slotsPlanned={0} totalSlots={10} />);

    expect(screen.getByText("Creating campaign...")).toBeInTheDocument();
  });

  it('shows "AI is planning topics..." text for planning phase', () => {
    render(<BatchProgress phase="planning" slotsPlanned={0} totalSlots={10} />);

    expect(screen.getByText("AI is planning topics...")).toBeInTheDocument();
  });

  it("shows saving progress text with counts", () => {
    render(<BatchProgress phase="saving" slotsPlanned={3} totalSlots={10} />);

    expect(screen.getByText("Saving slots (3/10)...")).toBeInTheDocument();
  });

  it("shows completion text with total slots", () => {
    render(
      <BatchProgress phase="complete" slotsPlanned={10} totalSlots={10} />,
    );

    expect(screen.getByText("Complete! 10 posts planned.")).toBeInTheDocument();
  });

  it("shows error text when phase is error", () => {
    render(<BatchProgress phase="error" slotsPlanned={3} totalSlots={10} />);

    expect(screen.getByText("An error occurred")).toBeInTheDocument();
  });

  it("displays error message when error prop provided", () => {
    render(
      <BatchProgress
        phase="error"
        slotsPlanned={3}
        totalSlots={10}
        error="Network connection failed"
      />,
    );

    expect(screen.getByText("Network connection failed")).toBeInTheDocument();
  });

  it("shows progress bar with correct percentage", () => {
    const { container } = render(
      <BatchProgress phase="saving" slotsPlanned={5} totalSlots={10} />,
    );

    const progressFill = container.querySelector('div[style*="width: 50%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it("shows pillar distribution when phase is complete with distribution", () => {
    render(
      <BatchProgress
        phase="complete"
        slotsPlanned={10}
        totalSlots={10}
        pillarDistribution={{ Leadership: 4, Innovation: 3, Insights: 3 }}
      />,
    );

    expect(screen.getByText("Pillar Distribution")).toBeInTheDocument();
    expect(screen.getByText("Leadership")).toBeInTheDocument();
    expect(screen.getByText("Innovation")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("does not show pillar distribution when phase is not complete", () => {
    render(
      <BatchProgress
        phase="planning"
        slotsPlanned={0}
        totalSlots={10}
        pillarDistribution={{ Leadership: 4, Innovation: 3, Insights: 3 }}
      />,
    );

    expect(screen.queryByText("Pillar Distribution")).not.toBeInTheDocument();
  });

  it("does not show pillar distribution when not provided", () => {
    render(
      <BatchProgress phase="complete" slotsPlanned={10} totalSlots={10} />,
    );

    expect(screen.queryByText("Pillar Distribution")).not.toBeInTheDocument();
  });

  it("calculates progress percentage correctly at 0%", () => {
    const { container } = render(
      <BatchProgress phase="idle" slotsPlanned={0} totalSlots={10} />,
    );

    const progressFill = container.querySelector('div[style*="width: 0%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it("calculates progress percentage correctly at 100%", () => {
    const { container } = render(
      <BatchProgress phase="complete" slotsPlanned={10} totalSlots={10} />,
    );

    const progressFill = container.querySelector('div[style*="width: 100%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it("handles edge case when totalSlots is 0", () => {
    render(<BatchProgress phase="idle" slotsPlanned={0} totalSlots={0} />);

    expect(screen.getByText("Campaign Progress")).toBeInTheDocument();
  });

  it("shows both error message and phase text", () => {
    render(
      <BatchProgress
        phase="error"
        slotsPlanned={2}
        totalSlots={10}
        error="Campaign creation failed"
      />,
    );

    expect(screen.getByText("An error occurred")).toBeInTheDocument();
    expect(screen.getByText("Campaign creation failed")).toBeInTheDocument();
  });
});
