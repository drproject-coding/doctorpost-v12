/**
 * Server-side usage gating for the Studio AI pipeline.
 * Checks and increments monthly post generation limits per tier.
 *
 * Server-side only — do NOT import from client components.
 */

import { CONFIG, extractAuthCookies, extractRows } from "@/lib/ncb-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsageStatus {
  /** Whether the user is within their monthly limit and can generate. */
  allowed: boolean;
  /** Subscription tier: 'free' | 'pro' | 'power' */
  tier: string;
  /** Number of posts generated this month. */
  used: number;
  /** Monthly cap — null means unlimited. */
  limit: number | null;
  /** ISO date string for when the usage counter resets. */
  resetDate: string;
}

interface UserSettingsRow {
  id?: string;
  user_id?: string;
  tier?: string | null;
  monthly_usage_count?: number | null;
  monthly_usage_reset_date?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_LIMITS: Record<string, number | null> = {
  free: 5,
  pro: 30,
  power: null, // unlimited
};

const DEFAULT_TIER = "free";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the first day of next month as an ISO date string (YYYY-MM-DD).
 */
function nextMonthResetDate(): string {
  const now = new Date();
  const firstOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return firstOfNextMonth.toISOString().slice(0, 10);
}

/**
 * Return true when the stored reset date is in the past (i.e. the counter
 * should be zeroed before comparing against the limit).
 */
function resetDateHasPassed(resetDate: string | null | undefined): boolean {
  if (!resetDate) return true;
  const reset = new Date(resetDate);
  if (isNaN(reset.getTime())) return true;
  return new Date() > reset;
}

/**
 * Fetch the user_settings row for the authenticated user directly from NCB.
 * Returns null when no row exists yet.
 */
async function fetchUserSettings(
  cookieHeader: string,
): Promise<UserSettingsRow | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/read/user_settings?instance=${CONFIG.instance}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (!res.ok) {
    console.error(
      `[usage] fetchUserSettings failed: ${res.status} ${res.statusText}`,
    );
    return null;
  }

  const rows = extractRows<UserSettingsRow>(await res.json());
  return rows[0] ?? null;
}

/**
 * Create a brand-new user_settings row with zeroed usage and next-month reset.
 */
async function createUserSettings(
  userId: string,
  cookieHeader: string,
): Promise<void> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/create/user_settings?instance=${CONFIG.instance}`;

  const payload = {
    user_id: userId,
    tier: DEFAULT_TIER,
    monthly_usage_count: 0,
    monthly_usage_reset_date: nextMonthResetDate(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(
      `[usage] createUserSettings failed: ${res.status} ${res.statusText}`,
    );
  }
}

/**
 * PATCH an existing user_settings row identified by `rowId`.
 * `fields` contains only the columns to update.
 */
async function patchUserSettings(
  rowId: string,
  fields: Partial<{
    monthly_usage_count: number;
    monthly_usage_reset_date: string;
    tier: string;
  }>,
  cookieHeader: string,
): Promise<void> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/update/user_settings/${rowId}?instance=${CONFIG.instance}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    console.error(
      `[usage] patchUserSettings failed: ${res.status} ${res.statusText}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the user is allowed to generate another post this month.
 *
 * Handles:
 * - Missing user_settings row → treated as free tier, 0 usage
 * - Expired reset date → usage is considered 0 for the comparison (the actual
 *   reset happens on the next `incrementUsage` call)
 *
 * Does NOT mutate any DB state — safe to call speculatively.
 */
export async function checkUsageLimit(
  userId: string,
  sessionCookie: string,
): Promise<UsageStatus> {
  const row = await fetchUserSettings(sessionCookie);

  const tier = row?.tier ?? DEFAULT_TIER;
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS[DEFAULT_TIER];
  const resetDate = row?.monthly_usage_reset_date ?? nextMonthResetDate();

  // If the reset date has passed, treat current usage as 0 for the check.
  const effectiveUsed = resetDateHasPassed(row?.monthly_usage_reset_date)
    ? 0
    : (row?.monthly_usage_count ?? 0);

  const allowed = limit === null || effectiveUsed < limit;

  return {
    allowed,
    tier,
    used: effectiveUsed,
    limit,
    resetDate,
  };
}

/**
 * Increment the monthly usage counter after a successful generation.
 *
 * Handles:
 * - No existing row → creates one with count = 1
 * - Expired reset date → resets count to 1 and sets a fresh reset date
 * - Normal path → increments count by 1
 */
export async function incrementUsage(
  userId: string,
  sessionCookie: string,
): Promise<void> {
  const row = await fetchUserSettings(sessionCookie);

  if (!row || !row.id) {
    // No row exists — create with count = 1 and walk away.
    // createUserSettings defaults to 0; immediately patch to 1.
    await createUserSettings(userId, sessionCookie);

    // Fetch the newly created row to get its id for the patch.
    const created = await fetchUserSettings(sessionCookie);
    if (created?.id) {
      await patchUserSettings(
        created.id,
        { monthly_usage_count: 1 },
        sessionCookie,
      );
    }
    return;
  }

  const needsReset = resetDateHasPassed(row.monthly_usage_reset_date);

  if (needsReset) {
    // Reset window — start fresh at 1.
    await patchUserSettings(
      row.id,
      {
        monthly_usage_count: 1,
        monthly_usage_reset_date: nextMonthResetDate(),
      },
      sessionCookie,
    );
  } else {
    // Normal increment.
    const currentCount = row.monthly_usage_count ?? 0;
    await patchUserSettings(
      row.id,
      { monthly_usage_count: currentCount + 1 },
      sessionCookie,
    );
  }
}
