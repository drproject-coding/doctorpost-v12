import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { openAIKey?: string };
  if (!body.openAIKey) {
    return NextResponse.json(
      { success: false, message: "API key is required" },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({ apiKey: body.openAIKey });
    // Make a minimal API call to validate the key
    await client.models.list();
    return NextResponse.json({
      success: true,
      message: "API key is valid",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Invalid API key";
    return NextResponse.json({
      success: false,
      message: `API key validation failed: ${message}`,
    });
  }
}
