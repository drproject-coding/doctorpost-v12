/**
 * Server-side AI client factory — BYOK (Bring Your Own Key).
 *
 * Users store their Anthropic API key in their NCB brand profile under the
 * `claude_api_key` column. This module retrieves that key server-side and
 * returns an initialized Anthropic SDK client.
 *
 * IMPORTANT: This file must only be imported in Server Components or Route
 * Handlers. Never import it in client-side code — doing so would expose the
 * user's API key to the browser.
 */

import Anthropic from "@anthropic-ai/sdk";

import { CONFIG, extractAuthCookies, extractRows } from "@/lib/ncb-utils";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface NcbProfileRow {
  id: string;
  claude_api_key?: string | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches the user's Anthropic API key from their NCB brand profile.
 *
 * @param _userId       - The authenticated user's ID (reserved for future
 *                        per-user scoping; NCB currently scopes via session
 *                        cookies automatically).
 * @param sessionCookie - The raw `Cookie` header string from the incoming
 *                        request (e.g. `req.headers.get("cookie") ?? ""`).
 * @returns The stored API key string, or `null` if the user has no profile or
 *          the key field is empty.
 */
export async function getUserApiKey(
  _userId: string,
  sessionCookie: string,
): Promise<string | null> {
  const authCookies = extractAuthCookies(sessionCookie);

  const url = `${CONFIG.dataApiUrl}/read/profiles?instance=${CONFIG.instance}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (!res.ok) {
    console.error(
      `[getUserApiKey] NCB profile fetch failed: ${res.status} ${res.statusText}`,
    );
    return null;
  }

  const rows = extractRows<NcbProfileRow>(await res.json());
  const profile = rows[0];

  if (!profile) return null;

  const key = profile.claude_api_key;
  return key && key.trim() !== "" ? key.trim() : null;
}

/**
 * Returns an initialized Anthropic client using the API key stored in the
 * user's brand profile.
 *
 * @param userId        - The authenticated user's ID.
 * @param sessionCookie - The raw `Cookie` header string from the incoming
 *                        request (e.g. `req.headers.get("cookie") ?? ""`).
 * @throws {Error} If the user has no Anthropic API key configured.
 */
export async function getAIClient(
  userId: string,
  sessionCookie: string,
): Promise<Anthropic> {
  const apiKey = await getUserApiKey(userId, sessionCookie);

  if (!apiKey) {
    throw new Error(
      "No Anthropic API key configured. Please add your API key in Settings.",
    );
  }

  return createAnthropicClient(apiKey);
}

/**
 * Creates an Anthropic SDK client from a known API key.
 *
 * Use this when the key is already available (e.g. retrieved from
 * `getUserApiKey` earlier in the same request). Prefer `getAIClient` when
 * you need the full lookup + client in one call.
 *
 * @param apiKey - A valid Anthropic API key (sk-ant-…).
 */
export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}
