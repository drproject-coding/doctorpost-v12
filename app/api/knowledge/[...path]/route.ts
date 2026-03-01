/**
 * Knowledge Base CRUD API routes.
 * Proxies to the NCB data layer with auth enforcement.
 * Supports: documents, document_versions, signals, rule_proposals
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, proxyToNCB } from "@/lib/ncb-utils";

const UNAUTHORIZED = (msg = "Unauthorized") =>
  new NextResponse(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

const BAD_REQUEST = (msg: string) =>
  new NextResponse(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });

// Allowed tables for knowledge CRUD
const ALLOWED_TABLES = new Set([
  "documents",
  "document_versions",
  "signals",
  "rule_proposals",
  "campaigns",
  "campaign_posts",
]);

const ALLOWED_OPERATIONS = new Set(["read", "create", "update", "delete"]);

function validatePath(segments: string[]): {
  valid: boolean;
  operation: string;
  table: string;
  id?: string;
} {
  // Expected patterns:
  //   read/documents, read/documents/123
  //   create/documents
  //   update/documents/123
  //   delete/documents/123
  if (segments.length < 2) return { valid: false, operation: "", table: "" };
  const [operation, table, ...rest] = segments;
  if (!ALLOWED_OPERATIONS.has(operation))
    return { valid: false, operation, table };
  if (!ALLOWED_TABLES.has(table)) return { valid: false, operation, table };
  return { valid: true, operation, table, id: rest[0] };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  const { valid, table } = validatePath(path);
  if (!valid) return BAD_REQUEST(`Invalid path or table: ${table}`);

  return proxyToNCB(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  const { valid, table } = validatePath(path);
  if (!valid) return BAD_REQUEST(`Invalid path or table: ${table}`);

  const body = await req.text();
  if (body) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      // Enforce user_id on creates
      delete parsed.user_id;
      parsed.user_id = user.id;
      return proxyToNCB(req, path.join("/"), JSON.stringify(parsed));
    } catch {
      // fall through
    }
  }
  return proxyToNCB(req, path.join("/"), body);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  const { valid, table } = validatePath(path);
  if (!valid) return BAD_REQUEST(`Invalid path or table: ${table}`);

  const body = await req.text();
  if (body) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      // Strip user_id from updates (can't change ownership)
      delete parsed.user_id;
      return proxyToNCB(req, path.join("/"), JSON.stringify(parsed));
    } catch {
      // fall through
    }
  }
  return proxyToNCB(req, path.join("/"), body);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) return UNAUTHORIZED();

  const { valid, table } = validatePath(path);
  if (!valid) return BAD_REQUEST(`Invalid path or table: ${table}`);

  return proxyToNCB(req, path.join("/"));
}
