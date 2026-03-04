import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  extractAuthCookies,
  CONFIG,
  extractRows,
} from "@/lib/ncb-utils";

async function ncbFetch(
  method: string,
  path: string,
  cookies: string,
  body?: string,
) {
  const url = `${CONFIG.dataApiUrl}/${path}?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: cookies,
    },
    body: body || undefined,
  });
  return res;
}

/**
 * POST /api/auth/ensure-user
 * Ensures the authenticated user exists in the NCB database.
 * Creates a minimal profile if the user doesn't have one yet.
 * This prevents foreign key constraint violations when creating posts.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookieHeader);

  if (!user || !user.id) {
    console.log("[ensure-user] No authenticated user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[ensure-user] Ensuring user exists: ${user.id}`);

  const authCookies = extractAuthCookies(cookieHeader);

  try {
    // Check if profile already exists
    const readRes = await ncbFetch("GET", "read/profiles", authCookies);
    const readData = await readRes.json();
    const rows = extractRows<Record<string, unknown>>(readData);

    if (rows.length > 0) {
      console.log(`[ensure-user] Profile already exists for user ${user.id}`);
      return NextResponse.json({
        success: true,
        action: "already_exists",
        user_id: user.id,
      });
    }

    // Profile doesn't exist, create a minimal one
    console.log(`[ensure-user] Creating minimal profile for user ${user.id}`);

    const minimalProfile = {
      user_id: user.id,
      first_name: user.name?.split(" ")[0] || "User",
      last_name: user.name?.split(" ")[1] || "",
      company_name: "",
      role: "",
      industry: "",
      audience: JSON.stringify([]),
      tones: JSON.stringify([]),
      offers: JSON.stringify([]),
      taboos: JSON.stringify([]),
      style_guide_emoji: true,
      style_guide_hashtags: 3,
      style_guide_links: "end",
      copy_guideline: "",
      content_strategy: "",
      definition: "",
      ai_provider: "claude",
      claude_api_key: "",
      straico_api_key: "",
      straico_model: "openai/gpt-4o-mini",
      oneforall_api_key: "",
      oneforall_model: "anthropic/claude-4-sonnet",
    };

    const createRes = await ncbFetch(
      "POST",
      "create/profiles",
      authCookies,
      JSON.stringify(minimalProfile),
    );

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error(`[ensure-user] Failed to create profile:`, errorText);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 },
      );
    }

    const createData = await createRes.json();
    console.log(`[ensure-user] Profile created successfully`);

    return NextResponse.json({
      success: true,
      action: "created",
      user_id: user.id,
      profile: createData,
    });
  } catch (error) {
    console.error("[ensure-user] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to ensure user",
      },
      { status: 500 },
    );
  }
}
