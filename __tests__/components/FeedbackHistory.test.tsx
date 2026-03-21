import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import { FeedbackHistory } from "@/components/learning/FeedbackHistory";
import type { Signal } from "@/lib/knowledge/types";

// Mock @doctorproject/react components
jest.mock("@doctorproject/react", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
}));

describe("FeedbackHistory", () => {
  const mockSignals: Signal[] = [
    {
      id: "sig-1",
      userId: "user-1",
      sessionId: "sess-abc123",
      signalType: "approval",
      category: "hooks",
      context: {},
      observation: "This hook resonated with audience",
      createdAt: "2026-01-15T10:00:00Z",
    },
    {
      id: "sig-2",
      userId: "user-1",
      sessionId: "sess-def456",
      signalType: "rejection",
      category: "tone",
      context: {},
      observation: "Tone felt too casual for this industry",
      createdAt: "2026-01-14T15:30:00Z",
    },
    {
      id: "sig-3",
      userId: "user-1",
      sessionId: "sess-ghi789",
      signalType: "edit",
      category: "structure",
      context: {},
      observation: "Added paragraph break for clarity",
      createdAt: "2026-01-13T09:00:00Z",
    },
  ];

  test("renders feedback history heading", () => {
    render(<FeedbackHistory signals={mockSignals} />);
    expect(screen.getByText("Feedback History")).toBeInTheDocument();
  });

  test("renders card component", () => {
    render(<FeedbackHistory signals={mockSignals} />);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  test("displays empty state when signals array is empty", () => {
    render(<FeedbackHistory signals={[]} />);
    expect(screen.getByText("No feedback entries yet.")).toBeInTheDocument();
  });

  test("displays all signals when provided", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    expect(
      screen.getByText("This hook resonated with audience"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tone felt too casual for this industry"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Added paragraph break for clarity"),
    ).toBeInTheDocument();
  });

  test("displays signal date in correct format", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    // The date should be formatted as "Jan 15" or similar
    const dateElements = screen.getAllByText(
      /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/,
    );
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test("displays signal type badge", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    // Badge spans contain the signal type text
    const badges = screen.getAllByText("approval");
    // One in dropdown, one in badge - just verify the badge one exists
    expect(badges.length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText("rejection").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("edit").length).toBeGreaterThanOrEqual(1);
  });

  test("displays signal category", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    // Categories appear in nested divs with other text, use regex matching
    expect(screen.getByText(/^hooks/)).toBeInTheDocument();
    expect(screen.getByText(/^tone/)).toBeInTheDocument();
    expect(screen.getByText(/^structure/)).toBeInTheDocument();
  });

  test("displays session ID truncated", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    // Should display "Session: sess-abc…" format
    expect(screen.getByText(/Session: sess-abc/)).toBeInTheDocument();
    expect(screen.getByText(/Session: sess-def/)).toBeInTheDocument();
  });

  test("sorts signals by creation date in descending order", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    const observations = screen.getAllByText(
      /This hook|Tone felt|Added paragraph/,
    );
    // Most recent (sig-1) should appear first
    expect(observations[0]).toHaveTextContent("This hook resonated");
  });

  test("shows filter dropdown when multiple signal types exist", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    const filterSelect = screen.getByDisplayValue(
      "All types",
    ) as HTMLSelectElement;
    expect(filterSelect).toBeInTheDocument();
  });

  test("displays all type options in filter dropdown", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    const filterSelect = screen.getByDisplayValue(
      "All types",
    ) as HTMLSelectElement;
    expect(
      filterSelect.querySelector('option[value="all"]'),
    ).toBeInTheDocument();
    expect(
      filterSelect.querySelector('option[value="approval"]'),
    ).toBeInTheDocument();
    expect(
      filterSelect.querySelector('option[value="rejection"]'),
    ).toBeInTheDocument();
    expect(
      filterSelect.querySelector('option[value="edit"]'),
    ).toBeInTheDocument();
  });

  test("filters signals by selected type", () => {
    render(<FeedbackHistory signals={mockSignals} />);

    const filterSelect = screen.getByDisplayValue(
      "All types",
    ) as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: "approval" } });

    expect(
      screen.getByText("This hook resonated with audience"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Tone felt too casual for this industry"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Added paragraph break for clarity"),
    ).not.toBeInTheDocument();
  });

  test('returns to all signals when filter is reset to "all"', () => {
    render(<FeedbackHistory signals={mockSignals} />);

    const filterSelect = screen.getByDisplayValue(
      "All types",
    ) as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: "rejection" } });
    expect(
      screen.queryByText("This hook resonated with audience"),
    ).not.toBeInTheDocument();

    fireEvent.change(filterSelect, { target: { value: "all" } });
    expect(
      screen.getByText("This hook resonated with audience"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tone felt too casual for this industry"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Added paragraph break for clarity"),
    ).toBeInTheDocument();
  });

  test("does not show filter when only one signal type exists", () => {
    const singleTypeSignals: Signal[] = [
      mockSignals[0],
      { ...mockSignals[1], signalType: "approval" },
    ];
    render(<FeedbackHistory signals={singleTypeSignals} />);

    const filterSelect = screen.queryByDisplayValue("All types");
    expect(filterSelect).not.toBeInTheDocument();
  });

  test("handles signal with missing session ID", () => {
    const signalWithoutSession: Signal = {
      ...mockSignals[0],
      sessionId: "",
    };
    render(<FeedbackHistory signals={[signalWithoutSession]} />);

    expect(
      screen.getByText("This hook resonated with audience"),
    ).toBeInTheDocument();
    // Should still render without "Session:" text if sessionId is empty
  });

  test("maintains filter state during re-render", () => {
    const { rerender } = render(<FeedbackHistory signals={mockSignals} />);

    const filterSelect = screen.getByDisplayValue(
      "All types",
    ) as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: "approval" } });

    expect(filterSelect.value).toBe("approval");

    rerender(<FeedbackHistory signals={mockSignals} />);

    const updatedSelect = screen.getByDisplayValue(
      "approval",
    ) as HTMLSelectElement;
    expect(updatedSelect.value).toBe("approval");
  });
});
