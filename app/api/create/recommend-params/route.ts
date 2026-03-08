/**
 * POST /api/create/recommend-params
 *
 * After the user selects a subtopic, this endpoint calls AI to recommend
 * a content pillar, content angle, and post structure.
 *
 * 4-second timeout — returns null fields on timeout (silent fail).
 */

import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";
import { generateWithAi } from "@/lib/ai/aiService";
import type { AiSettings } from "@/lib/types";

// Valid values for server-side validation
const VALID_ANGLES = [
  "contrarian",
  "analytical",
  "observation",
  "actionable",
  "xVsY",
  "presentVsFuture",
  "listicle",
];

const VALID_STRUCTURES = [
  "opinionTake",
  "howTo",
  "observation",
  "story",
  "list",
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

interface RecommendRequest {
  topic: string;
  subtopic: string;
}

interface RecommendResponse {
  contentAngle: string | null;
  postStructure: string | null;
  contentPillar: string | null;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  const cookieHeader = req.headers.get("cookie") ?? "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RecommendRequest;
  try {
    body = (await req.json()) as RecommendRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.topic || !body.subtopic) {
    return NextResponse.json(
      { error: "Missing required fields: topic, subtopic" },
      { status: 400 },
    );
  }

  // --- Resolve AI settings from profile ---
  const profile = await fetchUserProfile(cookieHeader);
  if (!profile) {
    return NextResponse.json(nullResponse(), { status: 200 });
  }

  const activeProvider = ((profile.ai_provider as string) || "claude") as
    | "claude"
    | "straico"
    | "1forall";

  let apiKey: string;
  let model: string | undefined;

  if (activeProvider === "straico") {
    apiKey = (profile.straico_api_key as string) || "";
    model = (profile.straico_model as string) || "openai/gpt-4o-mini";
  } else if (activeProvider === "1forall") {
    apiKey = (profile.oneforall_api_key as string) || "";
    model = (profile.oneforall_model as string) || "anthropic/claude-4-sonnet";
  } else {
    apiKey = (profile.claude_api_key as string) || "";
    model = "claude-sonnet-4-6";
  }

  if (!apiKey) {
    return NextResponse.json(nullResponse(), { status: 200 });
  }

  // Parse user's pillars from profile
  let userPillars: string[] = [];
  try {
    const raw = profile.content_pillars as string | null;
    if (raw) userPillars = JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }

  let customPillars: string[] = [];
  try {
    const raw = profile.custom_pillars as string | null;
    if (raw) {
      const parsed = JSON.parse(raw) as { name: string }[];
      customPillars = parsed.map((p) => p.name);
    }
  } catch {
    /* ignore */
  }

  const allPillars = [...userPillars, ...customPillars];

  const settings: AiSettings = {
    activeProvider,
    claudeApiKey: activeProvider === "claude" ? apiKey : "",
    straicoApiKey: activeProvider === "straico" ? apiKey : "",
    straicoModel: activeProvider === "straico" ? (model ?? "") : "",
    straicoImageModel: "",
    oneforallApiKey: activeProvider === "1forall" ? apiKey : "",
    oneforallModel: activeProvider === "1forall" ? (model ?? "") : "",
    oneforallImageModel: "",
  };

  const systemPrompt = `You are a LinkedIn content strategist. Given a topic and subtopic, recommend the best content angle, post structure, and content pillar.

Content Angle options (pick exactly one id): contrarian, analytical, observation, actionable, xVsY, presentVsFuture, listicle
Post Structure options (pick exactly one id): opinionTake, howTo, observation, story, list
${allPillars.length > 0 ? `Content Pillar options (pick the best match): ${allPillars.join(", ")}` : "Content Pillar: suggest a fitting topic area"}

Return a single JSON object:
{
  "contentAngle": "<id>",
  "postStructure": "<id>",
  "contentPillar": "<string>",
  "confidence": <0-1>,
  "reasoning": { "contentAngle": "...", "postStructure": "...", "contentPillar": "..." }
}
Only return the JSON, no other text.`;

  try {
    const result = await Promise.race([
      generateWithAi(
        {
          systemPrompt,
          userMessage: `Topic: ${body.topic}\nSubtopic: ${body.subtopic}`,
        },
        settings,
      ),
      timeout(4000),
    ]);

    if (!result) {
      return NextResponse.json(nullResponse(), { status: 200 });
    }

    const cleaned = result.content
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    // Validate returned values
    const angle = VALID_ANGLES.includes(parsed.contentAngle as string)
      ? (parsed.contentAngle as string)
      : null;
    const structure = VALID_STRUCTURES.includes(parsed.postStructure as string)
      ? (parsed.postStructure as string)
      : null;
    const pillar =
      typeof parsed.contentPillar === "string" ? parsed.contentPillar : null;
    const confidence =
      typeof parsed.confidence === "number" ? parsed.confidence : 0;

    return NextResponse.json({
      contentAngle: angle,
      postStructure: structure,
      contentPillar: pillar,
      confidence,
    } satisfies RecommendResponse);
  } catch {
    // Silent fail — return nulls
    return NextResponse.json(nullResponse(), { status: 200 });
  }
}

function nullResponse(): RecommendResponse {
  return {
    contentAngle: null,
    postStructure: null,
    contentPillar: null,
    confidence: 0,
  };
}

function timeout(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
