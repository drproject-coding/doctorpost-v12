import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, proxyToNCB } from "@/lib/ncb-utils";

const UNAUTHORIZED = (msg = "Unauthorized") =>
  new NextResponse(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();
  return proxyToNCB(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  console.log(`[POST ${pathStr}] ===== REQUEST START =====`);
  console.log(`[POST ${pathStr}] Cookie header present:`, !!cookieHeader);
  if (cookieHeader) {
    console.log(
      `[POST ${pathStr}] Cookie header (first 100 chars):`,
      cookieHeader.substring(0, 100),
    );
  }

  const user = await getSessionUser(cookieHeader);
  console.log(
    `[POST ${pathStr}] getSessionUser returned:`,
    JSON.stringify(user, null, 2),
  );

  if (!user) {
    console.log(`[POST ${pathStr}] ERROR: getSessionUser returned null/falsy`);
    return UNAUTHORIZED("Session user not found");
  }

  console.log(`[POST ${pathStr}] user.id value: "${user.id}"`);
  console.log(`[POST ${pathStr}] user.id type: ${typeof user.id}`);
  console.log(`[POST ${pathStr}] user.id is truthy: ${!!user.id}`);

  if (pathStr.startsWith("create/") && body) {
    console.log(`[POST ${pathStr}] Processing create request with body`);
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      console.log(
        `[POST ${pathStr}] Parsed body:`,
        JSON.stringify(parsed, null, 2),
      );

      if (parsed.user_id) {
        console.log(
          `[POST ${pathStr}] WARNING: Request already has user_id: "${parsed.user_id}"`,
        );
      }

      delete parsed.user_id;
      parsed.user_id = user.id;

      console.log(
        `[POST ${pathStr}] Final payload with injected user_id:`,
        JSON.stringify(parsed, null, 2),
      );
      console.log(`[POST ${pathStr}] Calling proxyToNCB with final payload`);

      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch (error) {
      console.error(`[POST ${pathStr}] Error processing body:`, error);
      console.error(`[POST ${pathStr}] Body was:`, body);
      // fall through
    }
  }

  console.log(
    `[POST ${pathStr}] Not a create request or no body, proxying as-is`,
  );
  return proxyToNCB(req, pathStr, body);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  if (body) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      delete parsed.user_id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {
      // fall through
    }
  }
  return proxyToNCB(req, pathStr, body);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();
  return proxyToNCB(req, path.join("/"));
}
