import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import { generateContentWithOpenAI } from "@/lib/server/openai-service";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { prompt?: string };
  if (!body.prompt) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 },
    );
  }

  try {
    const content = await generateContentWithOpenAI(body.prompt);
    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
