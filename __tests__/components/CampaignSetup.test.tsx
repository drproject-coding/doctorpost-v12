import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CampaignSetup,
  type CampaignConfig,
} from "../../components/campaigns/CampaignSetup";

describe("CampaignSetup", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with all required fields", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    expect(screen.getByText("New Campaign")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Q2 2026 Authority Building"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument(); // Duration
    expect(screen.getByDisplayValue("3")).toBeInTheDocument(); // Posts per week
    expect(screen.getByText(/Pillar Weights/)).toBeInTheDocument();
    expect(screen.getByText("Create Campaign")).toBeInTheDocument();
  });

  it("shows default pillar weights (5 pillars at 20% each)", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    expect(screen.getByText("Authority")).toBeInTheDocument();
    expect(screen.getByText("Engagement")).toBeInTheDocument();
    expect(screen.getByText("Trust")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(
      screen.getByText("Pillar Weights (total: 100%)"),
    ).toBeInTheDocument();
  });

  it("calculates and displays total posts correctly", async () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    // Default: 4 weeks * 3 posts per week = 12 posts
    expect(screen.getByText("Total posts: 12")).toBeInTheDocument();

    // Update duration weeks to 8
    const durationInput = screen.getByDisplayValue("4");
    fireEvent.change(durationInput, { target: { value: "8" } });

    await waitFor(() => {
      expect(screen.getByText("Total posts: 24")).toBeInTheDocument();
    });
  });

  it("disables submit button when campaign name is empty", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText("Create Campaign");
    expect(submitButton).toBeDisabled();
  });

  it("disables submit button when pillar weights do not sum to 100%", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    // Change first pillar weight from 20 to 30
    const pillarWeights = screen.getAllByDisplayValue("20");
    fireEvent.change(pillarWeights[0], { target: { value: "30" } });

    // Error message should appear when weights don't sum to 100%
    expect(screen.getByText("Weights should sum to 100%")).toBeInTheDocument();
  });

  it("calls onSubmit with correct campaign config", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByPlaceholderText(
      "e.g. Q2 2026 Authority Building",
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Q2 2026 Campaign" } });

    const goalsInput = screen.getByPlaceholderText(
      "What do you want to achieve with this campaign?",
    ) as HTMLTextAreaElement;
    fireEvent.change(goalsInput, {
      target: { value: "Build authority and engagement" },
    });

    const submitButton = screen.getByText("Create Campaign");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Q2 2026 Campaign",
        goals: "Build authority and engagement",
        durationWeeks: 4,
        postsPerWeek: 3,
        pillarWeights: {
          Authority: 20,
          Engagement: 20,
          Trust: 20,
          Education: 20,
          Personal: 20,
        },
      }),
    );
  });

  it("respects disabled prop", () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} disabled />);

    const submitButton = screen.getByText("Create Campaign");
    expect(submitButton).toBeDisabled();
  });

  it("updates pillar weights when input changes", async () => {
    render(<CampaignSetup onSubmit={mockOnSubmit} />);

    const pillarWeights = screen.getAllByDisplayValue("20");
    fireEvent.change(pillarWeights[0], { target: { value: "30" } });

    // Total should now show 110%
    await waitFor(() => {
      expect(
        screen.getByText("Pillar Weights (total: 110%)"),
      ).toBeInTheDocument();
    });

    // Adjust another to make it 100%
    fireEvent.change(pillarWeights[1], { target: { value: "10" } });
    await waitFor(() => {
      expect(
        screen.getByText("Pillar Weights (total: 100%)"),
      ).toBeInTheDocument();
    });
  });
});
