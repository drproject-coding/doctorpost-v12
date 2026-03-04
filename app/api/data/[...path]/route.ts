import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, proxyToNCB } from "@/lib/ncb-utils";

const UNAUTHORIZED = (msg = "Unauthorized") =>
  new NextResponse(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Convert ISO 8601 datetime strings to MySQL format (YYYY-MM-DD HH:MM:SS)
 * Handles both full ISO strings with timezone and partial strings
 */
function convertDatetimeFields(obj: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && isIso8601DateTime(value)) {
      obj[key] = convertIso8601ToMysql(value);
      console.log(
        `[convertDatetimeFields] Converted ${key}: ${value} → ${obj[key]}`,
      );
    }
  }
}

/**
 * Check if a string looks like an ISO 8601 datetime
 */
function isIso8601DateTime(str: string): boolean {
  // Pattern: YYYY-MM-DDTHH:MM:SS with optional milliseconds and timezone
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
}

/**
 * Convert ISO 8601 to MySQL datetime format
 */
function convertIso8601ToMysql(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return isoString; // Return unchanged if not a valid date
  }

  // Format as YYYY-MM-DD HH:MM:SS
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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

  if (!user || !user.id) {
    console.log(
      `[POST ${pathStr}] ERROR: getSessionUser returned null/falsy or user.id is missing`,
    );
    return UNAUTHORIZED("Session user not found or user ID is invalid");
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

      // Convert ISO 8601 datetime strings to MySQL format
      convertDatetimeFields(parsed);

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

      // Convert ISO 8601 datetime strings to MySQL format
      convertDatetimeFields(parsed);

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
