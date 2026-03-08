/**
 * GET /api/used-topics
 *
 * Returns all used topic headlines for the authenticated user.
 * Used by client-side features (Create page) to filter out duplicate topic suggestions.
 */

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import { getUsedTopics } from "@/lib/agents/getUsedTopics";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookie);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headlines = await getUsedTopics(user.id, cookie);
  return new Response(JSON.stringify({ headlines }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
