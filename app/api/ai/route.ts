/**
 * Server-side AI proxy route.
 *
 * POST /api/ai — Accepts an AI request and resolves API keys server-side
 * so that keys never leave the server boundary.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";
import { generateWithAi } from "@/lib/ai/aiService";
import type { AiRequest, AiSettings } from "@/lib/types";

const VALID_PROVIDERS = new Set(["claude", "1forall", "straico"]);

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { request: AiRequest };
  try {
    body = (await req.json()) as { request: AiRequest };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.request?.systemPrompt !== "string" ||
    typeof body.request?.userMessage !== "string"
  ) {
    return NextResponse.json(
      {
        error: "Missing or invalid request.systemPrompt / request.userMessage",
      },
      { status: 400 },
    );
  }

  // Resolve keys server-side from user profile
  const profile = await fetchUserProfile(cookie);
  if (!profile) {
    return NextResponse.json(
      {
        error:
          "No profile found. Please configure your AI provider in Settings.",
      },
      { status: 400 },
    );
  }

  const rawProvider = profile.ai_provider || "claude";
  const settings: AiSettings = {
    activeProvider: VALID_PROVIDERS.has(rawProvider)
      ? (rawProvider as AiSettings["activeProvider"])
      : "claude",
    claudeApiKey: profile.claude_api_key || "",
    straicoApiKey: profile.straico_api_key || "",
    straicoModel: profile.straico_model || "openai/gpt-4o-mini",
    oneforallApiKey: profile.oneforall_api_key || "",
    oneforallModel: profile.oneforall_model || "anthropic/claude-4-sonnet",
  };

  try {
    const result = await generateWithAi(body.request, settings);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI call failed" },
      { status: 500 },
    );
  }
}
