import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import { searchSubtopicsWithOpenAI } from "@/lib/server/openai-service";
import { searchSubtopicsWithPerplexity } from "@/lib/server/perplexity-service";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    topic?: string;
    count?: number;
    service?: string;
  };
  if (!body.topic) {
    return NextResponse.json(
      { error: "topic is required" },
      { status: 400 },
    );
  }

  const count = body.count ?? 5;
  const service = body.service ?? "openai";

  try {
    const subtopics =
      service === "perplexity"
        ? await searchSubtopicsWithPerplexity(body.topic, count)
        : await searchSubtopicsWithOpenAI(body.topic, count);
    return NextResponse.json(subtopics);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch subtopics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
