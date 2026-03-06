/**
 * POST /api/test-model
 *
 * Tests a provider's text or image model with a prefilled prompt.
 * Accepts API keys directly (not from profile) so the user can test
 * keys they haven't saved yet.
 *
 * Body: {
 *   type: "text" | "image"
 *   provider: "claude" | "straico" | "1forall"
 *   apiKey: string
 *   model?: string        — text model ID (required for straico/1forall)
 *   imageModel?: string   — image model ID (required for image type)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import { generateWithAi } from "@/lib/ai/aiService";
import { generateImage } from "@/lib/providers/image";
import type { AiSettings } from "@/lib/types";

const TEXT_PROMPT =
  "Respond with exactly this sentence and nothing else: 'Text model working correctly!'";

const IMAGE_PROMPT =
  "A simple illustration: a bright green checkmark inside a white circle on a light blue background. Clean, minimal, flat design.";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type: "text" | "image";
    provider: "claude" | "straico" | "1forall";
    apiKey: string;
    model?: string;
    imageModel?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, provider, apiKey, model, imageModel } = body;

  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (type === "text") {
    const settings: AiSettings = {
      activeProvider: provider,
      claudeApiKey: provider === "claude" ? apiKey : "",
      straicoApiKey: provider === "straico" ? apiKey : "",
      straicoModel: provider === "straico" ? (model ?? "openai/gpt-4o-mini") : "",
      straicoImageModel: "",
      oneforallApiKey: provider === "1forall" ? apiKey : "",
      oneforallModel: provider === "1forall" ? (model ?? "anthropic/claude-4-sonnet") : "",
      oneforallImageModel: "",
    };

    try {
      const result = await generateWithAi(
        {
          systemPrompt: "You are a helpful assistant. Follow the user's instruction exactly.",
          userMessage: TEXT_PROMPT,
          maxTokens: 60,
        },
        settings,
      );
      return NextResponse.json({ type: "text", result: result.content.trim() });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Text generation failed" },
        { status: 500 },
      );
    }
  }

  // Image test
  if (type === "image") {
    if (provider === "claude") {
      return NextResponse.json(
        { error: "Claude does not support image generation" },
        { status: 400 },
      );
    }

    const imgProvider = provider === "straico" ? "straico" : "1forall";
    const imgModel =
      imageModel?.trim() ||
      (provider === "straico" ? "flux/1.1" : "dall-e");

    try {
      const result = await generateImage(imgProvider, apiKey, imgModel, {
        prompt: IMAGE_PROMPT,
        aspectRatio: "1:1",
        title: "DoctorPost model test",
      });
      return NextResponse.json({ type: "image", imageUrl: result.imageUrl });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Image generation failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
