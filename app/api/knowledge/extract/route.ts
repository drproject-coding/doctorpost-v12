/**
 * Template extraction API route.
 *
 * POST /api/knowledge/extract
 * Body: { content: string }
 * Returns: ExtractedTemplate JSON
 *
 * API key is resolved server-side from the user's brand profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, CONFIG, extractAuthCookies } from "@/lib/ncb-utils";
import { extractTemplate } from "@/lib/agents/templateExtractor";

/** Fetch Claude API key from the user's brand profile (server-side). */
async function getClaudeApiKey(cookieHeader: string): Promise<string | null> {
  const url = `${CONFIG.dataApiUrl}/read/brand_profiles?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: extractAuthCookies(cookieHeader),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const rows = Array.isArray(data) ? data : data.data || data.rows || [];
  const profile = rows[0] as Record<string, unknown> | undefined;
  if (!profile) return null;
  // Try both possible field names
  const key =
    (profile.claude_api_key as string) ||
    ((profile.ai_settings as Record<string, unknown>)?.claudeApiKey as string);
  return key || null;
}

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  // Resolve API key server-side
  const apiKey = await getClaudeApiKey(cookie);
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Claude API key found. Set it in Settings first." },
      { status: 400 },
    );
  }

  try {
    const template = await extractTemplate(body.content, apiKey);
    return NextResponse.json(template);
  } catch (err) {
    return NextResponse.json(
      { error: `Extraction failed: ${String(err)}` },
      { status: 500 },
    );
  }
}
