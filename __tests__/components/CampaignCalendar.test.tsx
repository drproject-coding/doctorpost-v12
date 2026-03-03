import React from "react";
import { render, screen } from "@testing-library/react";
import { CampaignCalendar } from "../../components/campaigns/CampaignCalendar";
import type { CampaignSlot } from "../../lib/agents/campaignPlanner";
import type { TopicProposal } from "../../lib/knowledge/types";

describe("CampaignCalendar", () => {
  const defaultTopicCard: TopicProposal = {
    headline: "Test Topic",
    pillar: "Authority",
    templateRecommendation: "Insight Post",
    angle: "informative",
    decisionMistake: "Avoiding this topic",
    reasoning: "Strong engagement potential",
    hookCategoryRecommendation: "question",
  };

  const mockSlot = (
    overrides: Omit<Partial<CampaignSlot>, "topicCard"> & {
      topicCard?: Partial<TopicProposal>;
    } = {},
  ): CampaignSlot =>
    ({
      weekNumber: 1,
      slotOrder: 1,
      slotDate: "2026-03-10",
      topicCard: { ...defaultTopicCard, ...overrides.topicCard },
      ...Object.fromEntries(
        Object.entries(overrides).filter(([k]) => k !== "topicCard"),
      ),
    }) as CampaignSlot;

  it("renders the campaign calendar heading", () => {
    const slots: CampaignSlot[] = [];
    render(
      <CampaignCalendar slots={slots} durationWeeks={2} postsPerWeek={3} />,
    );

    expect(screen.getByText("Campaign Calendar")).toBeInTheDocument();
  });

  it("displays week headings for each week", () => {
    const slots: CampaignSlot[] = [
      mockSlot({ weekNumber: 1, slotOrder: 1 }),
      mockSlot({ weekNumber: 2, slotOrder: 1 }),
      mockSlot({ weekNumber: 3, slotOrder: 1 }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={3} postsPerWeek={1} />,
    );

    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("Week 2")).toBeInTheDocument();
    expect(screen.getByText("Week 3")).toBeInTheDocument();
  });

  it("displays slot content with headline, pillar, and date", () => {
    const slots: CampaignSlot[] = [
      mockSlot({
        weekNumber: 1,
        slotOrder: 1,
        slotDate: "2026-03-10",
        topicCard: {
          headline: "How to Build Authority",
          pillar: "Authority",
          templateRecommendation: "Insight Post",
        },
      }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={1} postsPerWeek={1} />,
    );

    expect(screen.getByText("How to Build Authority")).toBeInTheDocument();
    expect(screen.getByText("Authority")).toBeInTheDocument();
    expect(screen.getByText(/Tue, Mar 10/i)).toBeInTheDocument();
  });

  it("shows template recommendation when available", () => {
    const slots: CampaignSlot[] = [
      mockSlot({
        weekNumber: 1,
        slotOrder: 1,
        topicCard: {
          headline: "Topic",
          pillar: "Engagement",
          templateRecommendation: "Story Post",
        },
      }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={1} postsPerWeek={1} />,
    );

    expect(screen.getByText("Story Post")).toBeInTheDocument();
  });

  it("handles slots without template recommendation", () => {
    const slots: CampaignSlot[] = [
      mockSlot({
        weekNumber: 1,
        slotOrder: 1,
        topicCard: {
          headline: "Topic Without Template",
          pillar: "Education",
        },
      }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={1} postsPerWeek={1} />,
    );

    expect(screen.getByText("Topic Without Template")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
  });

  it("correctly groups slots by week", () => {
    const slots: CampaignSlot[] = [
      mockSlot({
        weekNumber: 1,
        slotOrder: 1,
        topicCard: { headline: "Week 1 Post 1", pillar: "Authority" },
      }),
      mockSlot({
        weekNumber: 1,
        slotOrder: 2,
        topicCard: { headline: "Week 1 Post 2", pillar: "Engagement" },
      }),
      mockSlot({
        weekNumber: 2,
        slotOrder: 1,
        topicCard: { headline: "Week 2 Post 1", pillar: "Trust" },
      }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={2} postsPerWeek={2} />,
    );

    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("Week 2")).toBeInTheDocument();
    expect(screen.getByText("Week 1 Post 1")).toBeInTheDocument();
    expect(screen.getByText("Week 1 Post 2")).toBeInTheDocument();
    expect(screen.getByText("Week 2 Post 1")).toBeInTheDocument();
  });

  it("renders multiple slots with different pillars", () => {
    const slots: CampaignSlot[] = [
      mockSlot({
        weekNumber: 1,
        slotOrder: 1,
        topicCard: { headline: "Authority Post", pillar: "Authority" },
      }),
      mockSlot({
        weekNumber: 1,
        slotOrder: 2,
        topicCard: { headline: "Engagement Post", pillar: "Engagement" },
      }),
      mockSlot({
        weekNumber: 1,
        slotOrder: 3,
        topicCard: { headline: "Trust Post", pillar: "Trust" },
      }),
    ];

    render(
      <CampaignCalendar slots={slots} durationWeeks={1} postsPerWeek={3} />,
    );

    expect(screen.getByText("Authority")).toBeInTheDocument();
    expect(screen.getByText("Engagement")).toBeInTheDocument();
    expect(screen.getByText("Trust")).toBeInTheDocument();
  });
});
