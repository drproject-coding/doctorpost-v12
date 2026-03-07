/**
 * Campaign API route.
 *
 * POST /api/campaign — Create a campaign and generate its topic plan.
 *
 * Streams SSE events as the campaign planner fills slots.
 */

import { NextRequest } from "next/server";
import { getSessionUser, CONFIG, fetchUserProfile } from "@/lib/ncb-utils";
import { fetchKnowledgeForUser } from "@/lib/knowledge/fetch";
import {
  planCampaign,
  type CampaignPlanInput,
  type CampaignSlot,
} from "@/lib/agents/campaignPlanner";

interface CampaignRequestBody {
  name: string;
  durationWeeks: number;
  postsPerWeek: number;
  goals: string;
  pillarWeights: Record<string, number>;
  startDate: string;
  keys: {
    claude: string;
  };
}

async function createCampaignInDb(
  body: CampaignRequestBody,
  userId: string,
  cookieHeader: string,
): Promise<string> {
  const url = `${CONFIG.dataApiUrl}/create/campaigns?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      user_id: userId,
      name: body.name,
      duration_weeks: body.durationWeeks,
      posts_per_week: body.postsPerWeek,
      goals: body.goals,
      pillar_weights: JSON.stringify(body.pillarWeights),
      status: "planning",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create campaign: ${res.statusText}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function saveCampaignPost(
  campaignId: string,
  slot: CampaignSlot,
  cookieHeader: string,
): Promise<{ ncbId: string }> {
  const url = `${CONFIG.dataApiUrl}/create/campaign_posts?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      slot_date: slot.slotDate,
      slot_order: slot.slotOrder,
      topic_card: JSON.stringify(slot.topicCard),
      generation_status: "waiting_review",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to save campaign post: ${res.status} ${res.statusText} — ${body}`,
    );
  }
  const data = (await res.json()) as { id: string };
  return { ncbId: String(data.id) };
}

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: CampaignRequestBody;
  try {
    body = (await req.json()) as CampaignRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    !body.name ||
    !body.durationWeeks ||
    !body.postsPerWeek ||
    !body.keys?.claude
  ) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch user profile to get AI settings
  const profile = await fetchUserProfile(cookie);
  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch user profile" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Determine API key and provider based on user's AI settings
  let apiKey: string;
  let provider = profile.ai_provider || "claude";

  if (provider === "1forall") {
    apiKey = profile.oneforall_api_key || "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "No 1ForAll API key configured. Please add your key in Settings.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  } else if (provider === "straico") {
    apiKey = profile.straico_api_key || "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "No Straico API key configured. Please add your key in Settings.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  } else {
    // Default to Claude
    apiKey = profile.claude_api_key || "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "No Claude API key configured. Please add your key in Settings.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const knowledge = await fetchKnowledgeForUser(user.id, cookie);

  // Get provider model
  const providerModel =
    provider === "1forall"
      ? profile.oneforall_model
      : provider === "straico"
        ? profile.straico_model
        : undefined;

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        // Create campaign in DB
        send("status", { phase: "creating", message: "Creating campaign..." });
        const campaignId = await createCampaignInDb(body, user.id, cookie);
        send("status", { phase: "planning", campaignId });

        // Fetch all existing topic headlines for this user to avoid repeats
        let usedHeadlines: string[] = [];
        try {
          const existingRes = await fetch(
            `${CONFIG.dataApiUrl}/read/campaign_posts?instance=${CONFIG.instance}&user_id=${user.id}&_limit=500`,
            { headers: { Cookie: cookie } },
          );
          if (existingRes.ok) {
            const existingData = (await existingRes.json()) as {
              rows?: Record<string, string>[];
              data?: Record<string, string>[];
            };
            const rows = existingData?.rows || existingData?.data || [];
            usedHeadlines = rows
              .map((r) => {
                try {
                  return (
                    (JSON.parse(r.topic_card) as { headline?: string })
                      .headline || ""
                  );
                } catch {
                  return "";
                }
              })
              .filter(Boolean);
          }
        } catch {
          // Non-fatal — planning continues without dedup
        }

        // Plan topics
        const plan = await planCampaign({
          apiKey,
          provider: provider as "claude" | "1forall" | "straico",
          providerModel,
          knowledge,
          campaignId,
          durationWeeks: body.durationWeeks,
          postsPerWeek: body.postsPerWeek,
          goals: body.goals,
          pillarWeights: body.pillarWeights,
          startDate: body.startDate,
          usedHeadlines,
          signal: req.signal,
        } satisfies CampaignPlanInput);

        // Save slots to DB
        send("status", { phase: "saving", slotsCount: plan.slots.length });
        for (const slot of plan.slots) {
          const { ncbId } = await saveCampaignPost(campaignId, slot, cookie);
          send("slot", {
            ...slot,
            id: ncbId,
            generationStatus: "waiting_review",
          });
        }

        send("complete", {
          campaignId,
          totalSlots: plan.slots.length,
          pillarDistribution: plan.pillarDistribution,
        });
      } catch (err) {
        send("error", { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
