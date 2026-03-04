import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";

  try {
    const user = await getSessionUser(cookieHeader);

    return new Response(
      JSON.stringify(
        {
          success: true,
          user,
          cookiePresent: !!cookieHeader,
          cookieLength: cookieHeader.length,
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
