import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/ncb-utils";

/**
 * TEMPORARY: Create missing user in ncba_user table
 * This endpoint creates the authenticated user as a database user
 * if they don't already exist. For one-time setup use only.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";

  if (!cookieHeader) {
    return new NextResponse(JSON.stringify({ error: "No authentication" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get user from session
    const sessionRes = await fetch(
      `${CONFIG.authApiUrl}/get-session?instance=${CONFIG.instance}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Instance": CONFIG.instance,
          Cookie: cookieHeader,
        },
      },
    );

    if (!sessionRes.ok) {
      return new NextResponse(JSON.stringify({ error: "Session invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionData = (await sessionRes.json()) as {
      user?: {
        id: string;
        name?: string;
        email?: string;
        image?: string;
        emailVerified?: boolean;
      };
    };

    if (!sessionData.user) {
      return new NextResponse(JSON.stringify({ error: "No user in session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = sessionData.user;

    console.log(`[create-user] Creating user in ncba_user:`, user);

    // Create user in ncba_user table
    const createRes = await fetch(
      `${CONFIG.dataApiUrl}/create/ncba_user?instance=${CONFIG.instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Database-Instance": CONFIG.instance,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name || null,
          email: user.email,
          emailverified: user.emailVerified ? 1 : 0,
          image: user.image || null,
        }),
      },
    );

    const responseText = await createRes.text();

    console.log(`[create-user] NCB response status:`, createRes.status);
    console.log(`[create-user] NCB response:`, responseText);

    if (!createRes.ok) {
      return new NextResponse(
        JSON.stringify({
          error: "Failed to create user in database",
          details: responseText,
        }),
        {
          status: createRes.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "User created in ncba_user table",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[create-user] Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
