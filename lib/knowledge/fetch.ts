/**
 * Server-side knowledge document fetcher.
 * Used by API routes that need the user's knowledge docs.
 */

import { CONFIG, extractRows, extractAuthCookies } from "../ncb-utils";
import type { NcbDocumentRow, KnowledgeDocument } from "./types";
import { mapDocumentFromNcb } from "./types";

/** Fetch all active knowledge docs for a user (server-side, via NCB API). */
export async function fetchKnowledgeForUser(
  userId: string,
  cookieHeader: string,
): Promise<KnowledgeDocument[]> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/read/documents?instance=${CONFIG.instance}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        Cookie: authCookies,
      },
    });
    if (!res.ok) return [];
    const rows = extractRows<NcbDocumentRow>(await res.json());
    return rows.map(mapDocumentFromNcb);
  } catch {
    return [];
  }
}
