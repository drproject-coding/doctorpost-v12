import { NextRequest } from "next/server";
import { getSessionUser, fetchUserProfile } from "@/lib/ncb-utils";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";

  try {
    const user = await getSessionUser(cookieHeader);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const profile = await fetchUserProfile(cookieHeader);

    return new Response(
      JSON.stringify(
        {
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
          profile: profile
            ? {
                ai_provider: profile.ai_provider,
                claude_api_key: profile.claude_api_key
                  ? "***SET***"
                  : "NOT SET",
                oneforall_api_key: profile.oneforall_api_key
                  ? "***SET***"
                  : "NOT SET",
                oneforall_model: profile.oneforall_model,
                straico_api_key: profile.straico_api_key
                  ? "***SET***"
                  : "NOT SET",
                straico_model: profile.straico_model,
              }
            : null,
          message:
            "If ai_provider is 'claude' but you have 1forall active, update your settings to select 1forall and save.",
        },
        null,
        2,
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify(
        {
          success: false,
          error: String(err),
        },
        null,
        2,
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
