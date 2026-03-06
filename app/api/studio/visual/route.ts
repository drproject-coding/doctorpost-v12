/**
 * POST /api/studio/visual
 *
 * Visual Intelligence Agent — SSE endpoint.
 * 1. AI fills the visual prompt template with content-specific imagery.
 * 2. Calls image generation directly on Straico or 1ForAll.
 * 3. Streams progress events → ends with { type: "complete", image_url, prompt_used }.
 */

import { NextRequest, NextResponse } from "next/server";

import { createAnthropicClient } from "@/lib/ai-client";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";
import { createSSEResponse } from "@/lib/sse";
import { callAgentClaude } from "@/lib/agents/callClaude";
import {
  pickBestTemplate,
  type VisualPromptTemplate,
} from "@/lib/ai/visualPrompts";
import {
  generateImage,
  STRAICO_DEFAULT_IMAGE_MODEL,
  ONEFORALL_DEFAULT_IMAGE_MODEL,
} from "@/lib/providers/image";

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  const cookieHeader = req.headers.get("cookie") ?? "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { post_text: string; format: string };
  try {
    body = (await req.json()) as { post_text: string; format: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { post_text, format } = body;
  if (!post_text || !format) {
    return NextResponse.json(
      { error: "Missing required fields: post_text, format" },
      { status: 400 },
    );
  }

  // --- Resolve provider + keys ---
  const profile = await fetchUserProfile(cookieHeader);
  const activeProvider = String(profile?.ai_provider ?? "claude") as
    | "claude"
    | "straico"
    | "1forall";

  const straicoKey = String(profile?.straico_api_key ?? "");
  const oneforallKey = String(profile?.oneforall_api_key ?? "");
  const claudeKey = String(profile?.claude_api_key ?? "");

  // LLM key for prompt filling
  let llmApiKey: string;
  let llmProviderModel: string | undefined;
  if (activeProvider === "straico") {
    llmApiKey = straicoKey;
    llmProviderModel = String(profile?.straico_model ?? "openai/gpt-4o-mini");
  } else if (activeProvider === "1forall") {
    llmApiKey = oneforallKey;
    llmProviderModel = String(
      profile?.oneforall_model ?? "anthropic/claude-4-sonnet",
    );
  } else {
    llmApiKey = claudeKey;
  }

  if (!llmApiKey) {
    return NextResponse.json(
      {
        error: "no_api_key",
        message: `No API key configured. Please add your key in Settings.`,
      },
      { status: 401 },
    );
  }

  // Image key: use same provider as active LLM provider if possible,
  // otherwise fall back to whichever has a key
  let imageProvider: "straico" | "1forall";
  let imageApiKey: string;
  let imageModel: string;

  if (activeProvider === "straico" && straicoKey) {
    imageProvider = "straico";
    imageApiKey = straicoKey;
    imageModel =
      String(profile?.straico_image_model ?? "") || STRAICO_DEFAULT_IMAGE_MODEL;
  } else if (activeProvider === "1forall" && oneforallKey) {
    imageProvider = "1forall";
    imageApiKey = oneforallKey;
    imageModel =
      String(profile?.oneforall_image_model ?? "") ||
      ONEFORALL_DEFAULT_IMAGE_MODEL;
  } else if (straicoKey) {
    imageProvider = "straico";
    imageApiKey = straicoKey;
    imageModel =
      String(profile?.straico_image_model ?? "") || STRAICO_DEFAULT_IMAGE_MODEL;
  } else if (oneforallKey) {
    imageProvider = "1forall";
    imageApiKey = oneforallKey;
    imageModel =
      String(profile?.oneforall_image_model ?? "") ||
      ONEFORALL_DEFAULT_IMAGE_MODEL;
  } else {
    return NextResponse.json(
      {
        error: "no_image_key",
        message:
          "Image generation requires a Straico or 1ForAll API key. Please add one in Settings.",
      },
      { status: 401 },
    );
  }

  const template = pickBestTemplate(post_text, format);

  return createSSEResponse(async (send) => {
    console.log(
      `[visual/route] Starting. provider=${activeProvider} imageProvider=${imageProvider} model=${imageModel} template=${template.id}`,
    );

    // Step 1: Fill template placeholder with AI
    send({
      type: "token",
      content: JSON.stringify({
        step: "Crafting visual concept...",
        percent: 15,
      }),
    });

    const filledPrompt = await fillTemplate(template, post_text, {
      apiKey: llmApiKey,
      provider: activeProvider,
      providerModel: llmProviderModel,
    });

    console.log("[visual/route] Template filled:", filledPrompt.slice(0, 120));

    send({
      type: "token",
      content: JSON.stringify({
        step: "Visual concept ready. Generating image...",
        percent: 35,
      }),
    });

    // Step 2: Generate image via lib/providers/image.ts
    const result = await generateImage(
      imageProvider,
      imageApiKey,
      imageModel,
      {
        prompt: filledPrompt,
        aspectRatio: template.aspectRatio as
          | "1:1"
          | "2:3"
          | "3:2"
          | "9:16"
          | "16:9"
          | undefined,
        title: "DoctorPost visual",
      },
      (step, percent) => {
        send({ type: "token", content: JSON.stringify({ step, percent }) });
      },
    );

    send({
      type: "stage_complete",
      stage: "visual",
      metadata: {
        image_url: result.imageUrl,
        prompt_used: filledPrompt,
        template_id: template.id,
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Fill template placeholder with AI
// ---------------------------------------------------------------------------

async function fillTemplate(
  template: VisualPromptTemplate,
  postText: string,
  opts: {
    apiKey: string;
    provider: "claude" | "straico" | "1forall";
    providerModel?: string;
  },
): Promise<string> {
  const systemPrompt = `You are a visual concept specialist. Given a LinkedIn post, you generate a short vivid visual description to insert into an image prompt template.`;

  const userMessage = `LinkedIn post:
<post>
${postText}
</post>

Image prompt template:
"${template.template}"

The [FILL] placeholder must be: ${template.placeholderHint}

Example: "${template.exampleFill}"

Output ONLY the replacement text for [FILL] — a concise phrase (10-20 words) that metaphorically captures the post's core message. No quotes, no explanation.`;

  let fillText: string;

  if (opts.provider === "claude") {
    const anthropic = createAnthropicClient(opts.apiKey);
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      temperature: 0.8,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    fillText =
      response.content[0].type === "text" ? response.content[0].text : "";
  } else {
    const { text } = await callAgentClaude({
      apiKey: opts.apiKey,
      model: "haiku",
      maxTokens: 100,
      systemPrompt,
      userMessage,
      provider: opts.provider,
      providerModel: opts.providerModel,
    });
    fillText = text;
  }

  const cleanFill = fillText.trim().replace(/^["']|["']$/g, "");
  return template.template.replace("[FILL]", cleanFill);
}
