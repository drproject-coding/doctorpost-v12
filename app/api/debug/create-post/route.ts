import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const user = await getSessionUser(cookieHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test payload with ISO 8601 datetime (should be converted by proxy)
    const payload = {
      title: "Debug Test Post",
      content: "This is a debug test to see if post creation works",
      scheduled_at: new Date().toISOString(),
      pillar: "Test Pillar",
      status: "draft",
    };

    console.log(
      "[DEBUG] Payload to send via proxy:",
      JSON.stringify(payload, null, 2),
    );

    // Use the authenticated proxy endpoint
    const res = await fetch(`${req.nextUrl.origin}/api/data/create/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log("[DEBUG] Proxy response status:", res.status);
    console.log("[DEBUG] Proxy response body:", responseText);

    return new Response(
      JSON.stringify(
        {
          success: res.ok,
          status: res.status,
          payload,
          proxyResponse: responseText,
          parsed: (() => {
            try {
              return JSON.parse(responseText);
            } catch {
              return null;
            }
          })(),
        },
        null,
        2,
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[DEBUG] Error:", err);
    return new Response(
      JSON.stringify(
        {
          error: String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
        null,
        2,
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
