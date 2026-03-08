/**
 * Fetches all "used" topic headlines for a user across the entire app.
 *
 * Sources:
 * - campaign_posts (excluding rejected — those were bad quality, not used territory)
 * - posts (library — all generated posts regardless of status)
 *
 * Used by Campaign, Factory (pipeline), and Create to prevent topic cannibalism.
 */

import { CONFIG } from "@/lib/ncb-utils";

type NcbRow = Record<string, string>;

async function fetchRows(url: string, cookie: string): Promise<NcbRow[]> {
  try {
    const res = await fetch(url, { headers: { Cookie: cookie } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      rows?: NcbRow[];
      data?: NcbRow[];
    };
    return data?.rows || data?.data || [];
  } catch {
    return [];
  }
}

export async function getUsedTopics(
  userId: string,
  cookie: string,
): Promise<string[]> {
  const base = `${CONFIG.dataApiUrl}`;
  const instance = `instance=${CONFIG.instance}`;

  const [campaignRows, postRows] = await Promise.all([
    // Campaign ideas — all except rejected
    fetchRows(
      `${base}/read/campaign_posts?${instance}&user_id=${userId}&_limit=500`,
      cookie,
    ),
    // Library posts — all generated posts
    fetchRows(
      `${base}/read/posts?${instance}&user_id=${userId}&_limit=500`,
      cookie,
    ),
  ]);

  const headlines: string[] = [];

  for (const row of campaignRows) {
    if (row.generation_status === "rejected") continue;
    try {
      const card = JSON.parse(row.topic_card) as { headline?: string };
      if (card.headline) headlines.push(card.headline);
    } catch {
      // skip malformed
    }
  }

  for (const row of postRows) {
    // Use title or first line of content as the "headline"
    const title = row.title || row.post_text?.split("\n")[0] || "";
    if (title) headlines.push(title);
  }

  return headlines;
}
