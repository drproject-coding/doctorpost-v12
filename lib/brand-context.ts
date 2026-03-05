/**
 * Server-side brand context builder for Studio AI pipeline agents.
 * Fetches the user's brand profile from NCB and formats it into a structured
 * string suitable for injection into AI agent system prompts.
 *
 * Server-side only — do NOT import in client components.
 */

import { BrandProfile } from "@/lib/types";
import { CONFIG, extractRows, extractAuthCookies } from "@/lib/ncb-utils";

// ---------------------------------------------------------------------------
// Internal NCB row type (mirrors NcbProfileRow in lib/api.ts)
// ---------------------------------------------------------------------------

interface NcbProfileRow {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  role?: string | null;
  industry?: string | null;
  audience?: string | null;
  tones?: string | null;
  offers?: string | null;
  taboos?: string | null;
  style_guide_emoji?: boolean | null;
  style_guide_hashtags?: number | null;
  style_guide_links?: string | null;
  copy_guideline?: string | null;
  content_strategy?: string | null;
  definition?: string | null;
  positioning?: string | null;
  ai_provider?: string | null;
  claude_api_key?: string | null;
  straico_api_key?: string | null;
  straico_model?: string | null;
  oneforall_api_key?: string | null;
  oneforall_model?: string | null;
  perplexity_api_key?: string | null;
  reddit_client_id?: string | null;
  reddit_client_secret?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed: unknown = JSON.parse(val);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function mapProfileFromNcbRow(row: NcbProfileRow): BrandProfile {
  const firstName = row.first_name ?? "";
  const lastName = row.last_name ?? "";
  const aiProvider = (row.ai_provider ??
    "claude") as BrandProfile["aiProvider"];
  return {
    id: row.id,
    name:
      firstName && lastName
        ? `${firstName} ${lastName}`
        : (row.company_name ?? "N/A"),
    firstName,
    lastName,
    companyName: row.company_name ?? "",
    role: row.role ?? "",
    aiProvider,
    claudeApiKey: row.claude_api_key ?? "",
    straicoApiKey: row.straico_api_key ?? "",
    straicoModel: row.straico_model ?? "openai/gpt-4o-mini",
    oneforallApiKey: row.oneforall_api_key ?? "",
    oneforallModel: row.oneforall_model ?? "anthropic/claude-4-sonnet",
    industry: row.industry ?? "",
    audience: parseJsonArray(row.audience),
    tones: parseJsonArray(row.tones),
    offers: parseJsonArray(row.offers),
    taboos: parseJsonArray(row.taboos),
    styleGuide: {
      emoji: row.style_guide_emoji ?? true,
      hashtags: row.style_guide_hashtags ?? 3,
      links: row.style_guide_links ?? "end",
    },
    copyGuideline: row.copy_guideline ?? "",
    contentStrategy: row.content_strategy ?? "",
    definition: row.definition ?? "",
    positioning: row.positioning ?? "",
    perplexityApiKey: row.perplexity_api_key ?? undefined,
    redditClientId: row.reddit_client_id ?? undefined,
    redditClientSecret: row.reddit_client_secret ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/**
 * Fetches the brand profile for `userId` from NCB (server-side) and returns
 * a formatted context string ready for injection into AI system prompts.
 *
 * @param userId       - The authenticated user's ID (used for logging only;
 *                       NCB scopes results to the authenticated session).
 * @param sessionCookie - Raw `Cookie` header value forwarded from the
 *                        incoming request, used to authenticate with NCB.
 */
export async function getBrandContext(
  userId: string,
  sessionCookie?: string,
): Promise<string> {
  const authCookies = extractAuthCookies(sessionCookie ?? "");
  const url = `${CONFIG.dataApiUrl}/read/profiles?instance=${CONFIG.instance}&limit=1`;

  let profile: BrandProfile | null = null;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        ...(authCookies ? { Cookie: authCookies } : {}),
      },
    });

    if (res.ok) {
      const rows = extractRows<NcbProfileRow>(await res.json());
      if (rows.length > 0) {
        profile = mapProfileFromNcbRow(rows[0]);
      }
    } else {
      console.warn(
        `[getBrandContext] NCB returned ${res.status} for user ${userId}`,
      );
    }
  } catch (err) {
    console.error(
      `[getBrandContext] Failed to fetch profile for user ${userId}:`,
      err,
    );
  }

  if (!profile) {
    return [
      "=== BRAND PROFILE ===",
      "",
      "No brand profile has been configured for this user.",
      "Proceed with generic LinkedIn content best practices.",
      "",
      "=== END BRAND PROFILE ===",
    ].join("\n");
  }

  return getBrandContextFromProfile(profile);
}

/**
 * Synchronous version — formats an already-fetched `BrandProfile` into the
 * structured context string used in AI system prompts.
 */
export function getBrandContextFromProfile(profile: BrandProfile): string {
  const hasName = profile.firstName || profile.lastName;
  const fullName = hasName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : null;

  const lines: string[] = ["=== BRAND PROFILE ===", ""];

  if (fullName) {
    lines.push(`NAME: ${fullName}`);
  }

  if (profile.companyName) {
    lines.push(`COMPANY: ${profile.companyName}`);
  }

  if (profile.role) {
    lines.push(`ROLE: ${profile.role}`);
  }

  if (profile.industry) {
    lines.push(`INDUSTRY: ${profile.industry}`);
  }

  // Voice & tone
  if (profile.tones.length > 0) {
    lines.push(
      "",
      "VOICE & TONE TRAITS:",
      ...profile.tones.map((t) => `- ${t}`),
    );
  }

  // Anti-tone
  if (profile.taboos.length > 0) {
    lines.push(
      "",
      "ANTI-TONE (never sound like this):",
      ...profile.taboos.map((t) => `- ${t}`),
    );
  }

  // Content strategy
  if (profile.contentStrategy) {
    lines.push("", "CONTENT STRATEGY:", profile.contentStrategy);
  }

  // Definition / value prop
  if (profile.definition) {
    lines.push("", "DEFINITION / VALUE PROP:", profile.definition);
  }

  // Positioning
  if (profile.positioning) {
    lines.push("", "POSITIONING:", profile.positioning);
  }

  // Target audience
  if (profile.audience.length > 0) {
    lines.push("", `TARGET AUDIENCE:`, profile.audience.join(", "));
  }

  // Offers
  if (profile.offers.length > 0) {
    lines.push("", "OFFERS:", ...profile.offers.map((o) => `- ${o}`));
  }

  // Copy guidelines
  if (profile.copyGuideline) {
    lines.push("", "COPY GUIDELINES:", profile.copyGuideline);
  }

  // Style guide
  lines.push(
    "",
    "STYLE GUIDE:",
    `- Emoji: ${profile.styleGuide.emoji ? "allowed" : "no emoji"}`,
    `- Hashtags: max ${profile.styleGuide.hashtags}`,
    `- Links: ${profile.styleGuide.links}`,
  );

  lines.push("", "=== END BRAND PROFILE ===");

  // If the profile was entirely empty, provide a fallback note
  const hasContent =
    fullName ||
    profile.companyName ||
    profile.role ||
    profile.industry ||
    profile.tones.length > 0 ||
    profile.taboos.length > 0 ||
    profile.contentStrategy ||
    profile.definition ||
    profile.positioning ||
    profile.audience.length > 0 ||
    profile.offers.length > 0 ||
    profile.copyGuideline;

  if (!hasContent) {
    return [
      "=== BRAND PROFILE ===",
      "",
      "Brand profile exists but no fields have been configured yet.",
      "Proceed with generic LinkedIn content best practices.",
      "",
      "=== END BRAND PROFILE ===",
    ].join("\n");
  }

  return lines.join("\n");
}
