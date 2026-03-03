/**
 * Pipeline session persistence using localStorage.
 * Interim solution until database persistence is set up (Task 12).
 */

import type { PipelinePhase } from "./agents/orchestrator";

export interface SavedSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Display title from the selected topic headline */
  title: string;
  /** Current phase when saved */
  phase: PipelinePhase;
  /** Serialized pipeline state */
  stateJson: string;
}

const STORAGE_KEY = "doctorpost_sessions";
const MAX_SESSIONS = 20;

function getSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: SavedSession[]) {
  if (typeof window === "undefined") return;
  // Keep only most recent sessions
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function saveSession(
  id: string,
  title: string,
  phase: PipelinePhase,
  stateJson: string,
): void {
  const sessions = getSessions();
  const existing = sessions.findIndex((s) => s.id === id);
  const now = new Date().toISOString();

  const session: SavedSession = {
    id,
    createdAt: existing >= 0 ? sessions[existing].createdAt : now,
    updatedAt: now,
    title,
    phase,
    stateJson,
  };

  if (existing >= 0) {
    sessions[existing] = session;
  } else {
    sessions.unshift(session);
  }

  writeSessions(sessions);
}

export function listSessions(): SavedSession[] {
  return getSessions().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function loadSession(id: string): SavedSession | null {
  return getSessions().find((s) => s.id === id) ?? null;
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  writeSessions(sessions);
}
