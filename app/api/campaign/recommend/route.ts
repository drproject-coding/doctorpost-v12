/**
 * GET /api/campaign/recommend
 *
 * Fetches all published posts for the current user, tallies their
 * pillar + goal distributions, and returns two recommendation variants:
 *   - strengthen: lean into what's already working
 *   - diversify:  boost underrepresented pillars & goals
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, CONFIG, extractRows } from "@/lib/ncb-utils";
import { POST_GOALS } from "@/lib/post-goals";

interface PostRow {
  id: string;
  pillar?: string | null;
  goal?: string | null;
  status?: string | null;
}

interface Distribution {
  pillars: Record<string, number>;
  goals: Record<string, number>;
  total: number;
}

interface RecommendVariant {
  mode: "strengthen" | "diversify";
  label: string;
  description: string;
  pillarWeights: Record<string, number>;
  suggestedGoals: string[];
  distribution: Distribution;
}

function toPct(
  counts: Record<string, number>,
  total: number,
): Record<string, number> {
  if (total === 0) return {};
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    result[k] = Math.round((v / total) * 100);
  }
  return result;
}

function normalize(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  if (total === 0) return weights;
  const result: Record<string, number> = {};
  let sum = 0;
  const keys = Object.keys(weights);
  for (let i = 0; i < keys.length - 1; i++) {
    result[keys[i]] = Math.round((weights[keys[i]] / total) * 100);
    sum += result[keys[i]];
  }
  result[keys[keys.length - 1]] = 100 - sum;
  return result;
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  // Fetch published posts
  const url = `${CONFIG.dataApiUrl}/read/posts?instance=${CONFIG.instance}&filters=${encodeURIComponent(JSON.stringify({ user_id: userId, status: "published" }))}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
      "X-Database-Instance": CONFIG.instance,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 502 },
    );
  }

  const json = await res.json();
  const posts = extractRows<PostRow>(json);

  if (posts.length === 0) {
    return NextResponse.json(
      { error: "No published posts found", posts: 0 },
      { status: 404 },
    );
  }

  // Tally distributions
  const pillarCounts: Record<string, number> = {};
  const goalCounts: Record<string, number> = {};

  for (const post of posts) {
    const pillar = post.pillar?.trim() || "Uncategorized";
    pillarCounts[pillar] = (pillarCounts[pillar] ?? 0) + 1;

    const goal = post.goal?.trim();
    if (goal) {
      goalCounts[goal] = (goalCounts[goal] ?? 0) + 1;
    }
  }

  const total = posts.length;
  const distribution: Distribution = {
    pillars: toPct(pillarCounts, total),
    goals: toPct(goalCounts, total),
    total,
  };

  // --- STRENGTHEN: amplify top-performing pillars & goals ---
  // Give extra weight to pillars with higher share
  const strengthenWeights: Record<string, number> = {};
  for (const [pillar, count] of Object.entries(pillarCounts)) {
    strengthenWeights[pillar] = count; // proportional to usage
  }
  const strengthenPillarWeights = normalize(strengthenWeights);

  // Top goals by usage
  const sortedGoals = Object.entries(goalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);
  const strengthenGoals = sortedGoals.slice(0, 3);

  // --- DIVERSIFY: boost underrepresented pillars & goals ---
  // Invert weights — give more to pillars used less
  const allPillars = Object.keys(pillarCounts);
  const maxCount = Math.max(...Object.values(pillarCounts));
  const diversifyWeights: Record<string, number> = {};
  for (const pillar of allPillars) {
    diversifyWeights[pillar] = maxCount - pillarCounts[pillar] + 1; // invert + floor at 1
  }
  const diversifyPillarWeights = normalize(diversifyWeights);

  // Goals NOT represented or least used
  const allGoalIds = POST_GOALS.map((g) => g.id);
  const unusedGoals = allGoalIds.filter((g) => !goalCounts[g]);
  const leastUsedGoals = Object.entries(goalCounts)
    .sort((a, b) => a[1] - b[1])
    .map(([g]) => g);
  const diversifyGoals = [...unusedGoals, ...leastUsedGoals].slice(0, 3);

  const variants: RecommendVariant[] = [
    {
      mode: "strengthen",
      label: "Strengthen what's working",
      description:
        "Double down on your best-performing pillars and goals. Ideal when you have a proven formula and want to grow from it.",
      pillarWeights: strengthenPillarWeights,
      suggestedGoals: strengthenGoals,
      distribution,
    },
    {
      mode: "diversify",
      label: "Diversify your content mix",
      description:
        "Expand into underrepresented pillars and unexplored goals. Ideal when you want to reach new audiences or break a plateau.",
      pillarWeights: diversifyPillarWeights,
      suggestedGoals: diversifyGoals,
      distribution,
    },
  ];

  return NextResponse.json({ variants, distribution, total });
}
