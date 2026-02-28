import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import { getOpenAIRecommendations } from "@/lib/server/openai-service";
import {
  enhancedPostTypes,
  enhancedHookPatterns,
  enhancedContentPillars,
  enhancedToneOptions,
} from "@/lib/dropdownData";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { topic?: string; subtopic?: string };
  if (!body.subtopic) {
    return NextResponse.json(
      { error: "subtopic is required" },
      { status: 400 },
    );
  }

  try {
    const recommendations = await getOpenAIRecommendations(
      body.subtopic,
      enhancedPostTypes,
      enhancedHookPatterns,
      enhancedContentPillars,
      enhancedToneOptions,
    );
    return NextResponse.json(recommendations);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
