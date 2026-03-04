/**
 * Campaign Planner — generates a calendar of topics for multi-post campaigns.
 *
 * Uses the Strategist agent repeatedly to fill campaign slots,
 * respecting pillar weights and avoiding topic repetition.
 */

import type { KnowledgeDocument, TopicProposal } from "../knowledge/types";
import { runStrategist } from "./strategist";

export interface CampaignPlan {
  campaignId: string;
  slots: CampaignSlot[];
  pillarDistribution: Record<string, number>;
}

export interface CampaignSlot {
  weekNumber: number;
  slotOrder: number;
  slotDate: string;
  topicCard: TopicProposal;
}

export interface CampaignPlanInput {
  apiKey: string;
  provider?: "claude" | "1forall" | "straico";
  providerModel?: string;
  knowledge: KnowledgeDocument[];
  campaignId: string;
  durationWeeks: number;
  postsPerWeek: number;
  goals: string;
  pillarWeights: Record<string, number>;
  startDate: string; // ISO date
  recentPosts?: { pillar: string; date: string }[];
  signal?: AbortSignal;
}

/**
 * Plan all topic slots for a campaign.
 * Calls strategist in batches to generate topics matching pillar distribution.
 */
export async function planCampaign(
  input: CampaignPlanInput,
): Promise<CampaignPlan> {
  const totalPosts = input.durationWeeks * input.postsPerWeek;

  // Calculate target pillar counts from weights
  const pillarTargets: Record<string, number> = {};
  const pillarCounts: Record<string, number> = {};
  for (const [pillar, weight] of Object.entries(input.pillarWeights)) {
    pillarTargets[pillar] = Math.round((weight / 100) * totalPosts);
    pillarCounts[pillar] = 0;
  }

  const slots: CampaignSlot[] = [];
  const startDate = new Date(input.startDate);

  // Generate topics in batches of postsPerWeek
  for (let week = 0; week < input.durationWeeks; week++) {
    const output = await runStrategist({
      apiKey: input.apiKey,
      provider: input.provider,
      providerModel: input.providerModel,
      knowledge: input.knowledge,
      recentPosts: [
        ...(input.recentPosts || []),
        ...slots.map((s) => ({
          pillar: s.topicCard.pillar,
          date: s.slotDate,
        })),
      ],
      signal: input.signal,
    });

    // Pick best topics from proposals, balancing pillars
    const available = [...output.proposals];
    for (let slot = 0; slot < input.postsPerWeek; slot++) {
      const slotDate = new Date(startDate);
      slotDate.setDate(startDate.getDate() + week * 7 + slot * 2); // Spread posts across the week

      // Pick topic that best matches pillar balance
      const topic = pickBalancedTopic(available, pillarCounts, pillarTargets);

      if (topic) {
        pillarCounts[topic.pillar] = (pillarCounts[topic.pillar] || 0) + 1;
        const idx = available.indexOf(topic);
        if (idx !== -1) available.splice(idx, 1);

        slots.push({
          weekNumber: week + 1,
          slotOrder: slot + 1,
          slotDate: slotDate.toISOString().split("T")[0],
          topicCard: topic,
        });
      }
    }
  }

  return {
    campaignId: input.campaignId,
    slots,
    pillarDistribution: pillarCounts,
  };
}

/** Pick the topic whose pillar is most under-represented. */
function pickBalancedTopic(
  topics: TopicProposal[],
  counts: Record<string, number>,
  targets: Record<string, number>,
): TopicProposal | undefined {
  if (topics.length === 0) return undefined;

  // Sort topics by how far below target their pillar is
  const scored = topics.map((t) => ({
    topic: t,
    deficit: (targets[t.pillar] || 0) - (counts[t.pillar] || 0),
  }));
  scored.sort((a, b) => b.deficit - a.deficit);

  return scored[0].topic;
}
