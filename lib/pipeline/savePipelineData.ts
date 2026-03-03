/**
 * Server-side pipeline session persistence via NCB.
 *
 * Expected NCB table: pipeline_sessions
 * Columns: user_id, session_id, title, current_phase, status, state_json, created_at, updated_at
 *
 * The /api/data proxy auto-injects user_id on creates.
 */

import { CONFIG, extractAuthCookies, extractRows } from "@/lib/ncb-utils";

interface NcbSessionRow {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  current_phase: string;
  status: string;
  state_json: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineSessionRecord {
  id: string;
  sessionId: string;
  title: string;
  currentPhase: string;
  status: "active" | "complete" | "error";
  stateJson: string;
  createdAt: string;
  updatedAt: string;
}

function mapFromNcb(row: NcbSessionRow): PipelineSessionRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    currentPhase: row.current_phase,
    status: row.status as PipelineSessionRecord["status"],
    stateJson: row.state_json,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

/**
 * Upsert a pipeline session record in NCB.
 * If a record with the same session_id exists, update it; otherwise create.
 */
export async function savePipelineSession(
  cookieHeader: string,
  sessionId: string,
  title: string,
  phase: string,
  status: "active" | "complete" | "error",
  stateJson: string,
): Promise<void> {
  const authCookies = extractAuthCookies(cookieHeader);
  const now = new Date().toISOString();

  // Check if session exists
  const existing = await findSessionBySessionId(cookieHeader, sessionId);

  if (existing) {
    // Update
    const url = `${CONFIG.dataApiUrl}/update/pipeline_sessions/${existing.id}?instance=${CONFIG.instance}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        Cookie: authCookies,
      },
      body: JSON.stringify({
        title,
        current_phase: phase,
        status,
        state_json: stateJson,
        updated_at: now,
      }),
    });
    if (!res.ok) throw new Error(`NCB update failed: ${res.status}`);
  } else {
    // Create
    const url = `${CONFIG.dataApiUrl}/create/pipeline_sessions?instance=${CONFIG.instance}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": CONFIG.instance,
        Cookie: authCookies,
      },
      body: JSON.stringify({
        session_id: sessionId,
        title,
        current_phase: phase,
        status,
        state_json: stateJson,
        created_at: now,
        updated_at: now,
      }),
    });
    if (!res.ok) throw new Error(`NCB create failed: ${res.status}`);
  }
}

/**
 * Find session by session_id string.
 */
async function findSessionBySessionId(
  cookieHeader: string,
  sessionId: string,
): Promise<NcbSessionRow | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/read/pipeline_sessions?instance=${CONFIG.instance}&session_id=${encodeURIComponent(sessionId)}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });
  if (!res.ok) return null;
  const rows = extractRows<NcbSessionRow>(await res.json());
  return rows[0] ?? null;
}

/**
 * List user's pipeline sessions (most recent first).
 */
export async function listPipelineSessions(
  cookieHeader: string,
): Promise<PipelineSessionRecord[]> {
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/read/pipeline_sessions?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });
  if (!res.ok) return [];
  const rows = extractRows<NcbSessionRow>(await res.json());
  return rows
    .map(mapFromNcb)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

/**
 * Load a specific pipeline session.
 */
export async function loadPipelineSession(
  cookieHeader: string,
  sessionId: string,
): Promise<PipelineSessionRecord | null> {
  const row = await findSessionBySessionId(cookieHeader, sessionId);
  return row ? mapFromNcb(row) : null;
}

/**
 * Delete a pipeline session.
 */
export async function deletePipelineSession(
  cookieHeader: string,
  sessionId: string,
): Promise<void> {
  const row = await findSessionBySessionId(cookieHeader, sessionId);
  if (!row) return;
  const authCookies = extractAuthCookies(cookieHeader);
  const url = `${CONFIG.dataApiUrl}/delete/pipeline_sessions/${row.id}?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });
  if (!res.ok) throw new Error(`NCB delete failed: ${res.status}`);
}
