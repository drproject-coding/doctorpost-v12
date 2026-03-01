/**
 * Knowledge ingest API — auto-classifies pasted content.
 *
 * POST /api/knowledge/ingest
 * Body: { content: string }
 * Returns: { category, subcategory, name }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/ncb-utils";
import type { DocumentCategory } from "@/lib/knowledge/types";

/** Simple keyword-based classifier for knowledge documents. */
function classifyContent(content: string): {
  category: DocumentCategory;
  subcategory: string;
  name: string;
} {
  const lower = content.toLowerCase();
  const firstLine = content
    .split("\n")[0]
    .replace(/^#+\s*/, "")
    .trim();

  // Check for template patterns
  if (
    lower.includes("template") ||
    lower.includes("## structure") ||
    lower.includes("## format")
  ) {
    return {
      category: "templates",
      subcategory: "templates",
      name: firstLine || "template",
    };
  }

  // Check for hook patterns
  if (
    lower.includes("hook") &&
    (lower.includes("example") || lower.includes("category"))
  ) {
    return {
      category: "library",
      subcategory: "hooks",
      name: firstLine || "hooks",
    };
  }

  // Check for closer/CTA patterns
  if (lower.includes("closer") || lower.includes("closing line")) {
    return { category: "library", subcategory: "closers", name: "closers" };
  }
  if (lower.includes("call to action") || lower.includes("cta")) {
    return { category: "library", subcategory: "ctas", name: "ctas" };
  }

  // Check for rule patterns
  if (
    lower.includes("rule") ||
    lower.includes("forbidden") ||
    lower.includes("never") ||
    lower.includes("always") ||
    lower.includes("must")
  ) {
    const sub = lower.includes("scoring")
      ? "scoring-rules"
      : lower.includes("format")
        ? "formatting-rules"
        : lower.includes("voice") || lower.includes("tone")
          ? "brand-voice"
          : "hard-rules";
    return { category: "rules", subcategory: sub, name: firstLine || sub };
  }

  // Check for reference patterns
  if (
    lower.includes("benchmark") ||
    lower.includes("kpi") ||
    lower.includes("vocabulary") ||
    lower.includes("technique")
  ) {
    return {
      category: "references",
      subcategory: "references",
      name: firstLine || "reference",
    };
  }

  // Default
  return {
    category: "references",
    subcategory: "references",
    name: firstLine || "imported",
  };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req.headers.get("cookie") || "");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const classification = classifyContent(body.content);
  return NextResponse.json(classification);
}
