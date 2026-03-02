import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  extractAuthCookies,
  CONFIG,
  extractRows,
} from "@/lib/ncb-utils";
import { SEED_MANIFEST } from "@/lib/knowledge/seed-data/manifest";
import { SEED_CONTENT } from "@/lib/knowledge/seed-data/content";

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
 * POST /api/seed-knowledge
 * Seeds all knowledge documents from the bundled content into the NCB documents table.
 * Idempotent — skips documents that already exist.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authCookies = extractAuthCookies(cookieHeader);
  const results: { name: string; status: string }[] = [];

  for (const entry of SEED_MANIFEST) {
    const content = SEED_CONTENT[entry.sourcePath];
    if (!content) {
      results.push({ name: entry.name, status: "missing-content" });
      continue;
    }

    try {
      // Check if document already exists
      const checkRes = await ncbFetch("GET", `read/documents`, authCookies);
      if (!checkRes.ok) {
        results.push({ name: entry.name, status: "check-failed" });
        continue;
      }

      const rows = extractRows<{ category: string; name: string }>(
        await checkRes.json(),
      );
      const exists = rows.some(
        (r) => r.category === entry.category && r.name === entry.name,
      );

      if (exists) {
        results.push({ name: entry.name, status: "skipped" });
        continue;
      }

      // Create document
      const createRes = await ncbFetch(
        "POST",
        "create/documents",
        authCookies,
        JSON.stringify({
          user_id: user.id,
          category: entry.category,
          subcategory: entry.subcategory,
          name: entry.name,
          content,
          version: 1,
          is_active: true,
          source: "seed",
          updated_by: "system",
        }),
      );

      results.push({
        name: entry.name,
        status: createRes.ok ? "created" : "error",
      });
    } catch {
      results.push({ name: entry.name, status: "error" });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter(
    (r) => r.status !== "created" && r.status !== "skipped",
  ).length;

  return NextResponse.json({
    summary: { created, skipped, errors, total: results.length },
    results,
  });
}
