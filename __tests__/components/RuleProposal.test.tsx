import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RuleProposalCard } from "@/components/learning/RuleProposal";
import type { RuleProposal, ProposalStatus } from "@/lib/knowledge/types";

// Mock @doctorproject/react components
jest.mock("@doctorproject/react", () => ({
  Alert: ({ variant, children }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Check: () => <span data-testid="icon-check">✓</span>,
  X: () => <span data-testid="icon-x">✗</span>,
}));

describe("RuleProposalCard", () => {
  const mockProposal: RuleProposal = {
    id: "prop-1",
    userId: "user-1",
    status: "pending",
    proposalType: "hook-improvement",
    targetDocument: "hook-library",
    confidence: 0.85,
    reasoning:
      "This hook has higher engagement potential based on audience analysis.",
    evidenceSignals: ["sig-1", "sig-2", "sig-3"],
    currentContent: "Current hook text",
    proposedContent: "Improved hook text with better opening",
    createdAt: "2026-01-15T10:00:00Z",
  };

  const mockOnUpdateStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders proposal card with status badge", () => {
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("hook-improvement")).toBeInTheDocument();
  });

  test("displays proposal information correctly", () => {
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.getByText(/Target: hook-library/)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 85%/)).toBeInTheDocument();
    expect(screen.getByText(mockProposal.reasoning)).toBeInTheDocument();
    expect(screen.getByText(/Based on 3 signals/)).toBeInTheDocument();
  });

  test("shows diff toggle button", () => {
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const diffButton = screen.getByText("Show diff");
    expect(diffButton).toBeInTheDocument();
  });

  test("toggles diff visibility on button click", () => {
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const diffButton = screen.getByText("Show diff");
    fireEvent.click(diffButton);

    expect(screen.getByText("Hide diff")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Proposed")).toBeInTheDocument();
    expect(screen.getByText("Current hook text")).toBeInTheDocument();
    expect(
      screen.getByText("Improved hook text with better opening"),
    ).toBeInTheDocument();
  });

  test("shows approve and reject buttons only when status is pending", () => {
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  test("does not show approve and reject buttons when status is approved", () => {
    const approvedProposal: RuleProposal = {
      ...mockProposal,
      status: "approved",
    };
    render(
      <RuleProposalCard
        proposal={approvedProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  test("does not show approve and reject buttons when status is rejected", () => {
    const rejectedProposal: RuleProposal = {
      ...mockProposal,
      status: "rejected",
    };
    render(
      <RuleProposalCard
        proposal={rejectedProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  test('calls onUpdateStatus with "approved" when approve button is clicked', async () => {
    mockOnUpdateStatus.mockResolvedValue(undefined);
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockOnUpdateStatus).toHaveBeenCalledWith("prop-1", "approved");
    });
  });

  test('calls onUpdateStatus with "rejected" when reject button is clicked', async () => {
    mockOnUpdateStatus.mockResolvedValue(undefined);
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockOnUpdateStatus).toHaveBeenCalledWith("prop-1", "rejected");
    });
  });

  test("displays error message when update fails", async () => {
    mockOnUpdateStatus.mockRejectedValue(new Error("Update failed"));
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByTestId("alert")).toBeInTheDocument();
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });

  test("disables buttons while updating", async () => {
    mockOnUpdateStatus.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    render(
      <RuleProposalCard
        proposal={mockProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    const approveButton = screen.getByText("Approve") as HTMLButtonElement;
    fireEvent.click(approveButton);

    expect(approveButton.disabled).toBe(true);

    await waitFor(
      () => {
        expect(approveButton.disabled).toBe(false);
      },
      { timeout: 200 },
    );
  });

  test("formats confidence as percentage correctly", () => {
    const lowConfidenceProposal: RuleProposal = {
      ...mockProposal,
      confidence: 0.456,
    };
    render(
      <RuleProposalCard
        proposal={lowConfidenceProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.getByText(/Confidence: 46%/)).toBeInTheDocument();
  });

  test("handles single evidence signal with correct grammar", () => {
    const singleSignalProposal: RuleProposal = {
      ...mockProposal,
      evidenceSignals: ["sig-1"],
    };
    render(
      <RuleProposalCard
        proposal={singleSignalProposal}
        onUpdateStatus={mockOnUpdateStatus}
      />,
    );

    expect(screen.getByText(/Based on 1 signal$/)).toBeInTheDocument();
  });
});
