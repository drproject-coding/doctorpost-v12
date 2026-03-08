import type { NcbDocumentRow } from "@/lib/knowledge/types";

/**
 * Resolve the best tone template for a given toneId.
 * Priority: user fork (source=user-edit) → system seed (source=seed) → null.
 *
 * Returns the raw template string (with {{brand.*}} variables still present).
 * Caller is responsible for interpolation.
 */
export async function resolvePromptTemplate(
  toneId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/knowledge/read/documents?category=templates&subcategory=${encodeURIComponent(toneId)}`,
      { credentials: "include" },
    );
    if (!res.ok) return null;

    const data = await res.json();
    const rows: NcbDocumentRow[] = Array.isArray(data)
      ? data
      : data.data || data.rows || [];

    // Prefer user fork over system seed
    const userFork = rows.find((r) => r.source === "user-edit");
    if (userFork) return userFork.content;

    const seed = rows.find((r) => r.source === "seed");
    if (seed) return seed.content;

    return null;
  } catch {
    return null;
  }
}
