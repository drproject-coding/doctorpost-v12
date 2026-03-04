import { NextRequest } from "next/server";
import { getSessionUser, CONFIG, extractAuthCookies } from "@/lib/ncb-utils";

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

    // Simulate what the proxy does
    const payload = {
      title: "Debug Test Post",
      content: "This is a debug test to see if post creation works",
      pillar: "Test Pillar",
      status: "draft",
      user_id: user.id,
    };

    console.log(
      "[DEBUG] Payload to send to NCB:",
      JSON.stringify(payload, null, 2),
    );

    const authCookies = extractAuthCookies(cookieHeader);
    const url = `${CONFIG.dataApiUrl}/create/posts?instance=${CONFIG.instance}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        Cookie: authCookies,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log("[DEBUG] NCB Response status:", res.status);
    console.log("[DEBUG] NCB Response body:", responseText);

    return new Response(
      JSON.stringify(
        {
          success: res.ok,
          status: res.status,
          payload,
          ncbResponse: responseText,
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
