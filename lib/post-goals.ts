export interface PostGoal {
  id: string;
  label: string;
  description: string;
}

export const POST_GOALS: PostGoal[] = [
  {
    id: "awareness",
    label: "Awareness",
    description:
      "Reach new audiences. Get seen by people who don't know you yet.",
  },
  {
    id: "authority",
    label: "Authority",
    description: "Establish expertise. Differentiate from noise in your niche.",
  },
  {
    id: "trust",
    label: "Trust Building",
    description: "Move followers from passive observers to believers.",
  },
  {
    id: "engagement",
    label: "Engagement",
    description: "Spark conversation, debate, reactions. Comments over likes.",
  },
  {
    id: "audience_growth",
    label: "Audience Growth",
    description:
      "Gain the right followers. Attract your ICP, repel everyone else.",
  },
  {
    id: "lead_generation",
    label: "Lead Generation",
    description: "Trigger inbound interest from potential clients or partners.",
  },
  {
    id: "traffic",
    label: "Traffic",
    description: "Drive people off-platform to your newsletter, site, or tool.",
  },
  {
    id: "conversion",
    label: "Conversion",
    description: "Move warm leads closer to a decision. Subtle CTAs.",
  },
  {
    id: "retention",
    label: "Retention",
    description: "Keep existing clients and followers engaged. Reduce churn.",
  },
  {
    id: "recruitment",
    label: "Recruitment",
    description: "Attract talent, collaborators, press, or co-creators.",
  },
];

export const POST_GOAL_IDS = POST_GOALS.map((g) => g.id);
