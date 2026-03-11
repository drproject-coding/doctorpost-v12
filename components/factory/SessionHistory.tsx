"use client";
import React, { useState, useEffect } from "react";
import { Button, Card } from "@doctorproject/react";
import { Clock, Trash2, Play, RotateCcw } from "lucide-react";
import {
  listSessions as listLocalSessions,
  deleteSession as deleteLocalSession,
  type SavedSession,
} from "@/lib/sessionStorage";

interface SessionHistoryProps {
  onResume: (stateJson: string) => void;
  onView: (stateJson: string) => void;
  onRetryFromPhase?: (stateJson: string, phase: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  idle: "Not started",
  direction: "Direction",
  discovery: "Discovery",
  evidence: "Evidence",
  writing: "Writing",
  scoring: "Scoring",
  formatting: "Formatting",
  review: "Review",
  learning: "Learning",
  complete: "Complete",
  error: "Error",
};

export function SessionHistory({
  onResume,
  onView,
  onRetryFromPhase,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [source, setSource] = useState<"local" | "ncb">("local");

  useEffect(() => {
    // Try NCB API first, fall back to localStorage
    fetch("/api/pipeline/sessions", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Map NCB records to SavedSession shape
          const mapped: SavedSession[] = data.map(
            (r: {
              sessionId: string;
              title: string;
              currentPhase: string;
              stateJson: string;
              createdAt: string;
              updatedAt: string;
            }) => ({
              id: r.sessionId,
              title: r.title,
              phase: r.currentPhase as SavedSession["phase"],
              stateJson: r.stateJson,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            }),
          );
          setSessions(mapped);
          setSource("ncb");
        } else {
          setSessions(listLocalSessions());
          setSource("local");
        }
      })
      .catch(() => {
        setSessions(listLocalSessions());
        setSource("local");
      });
  }, []);

  if (sessions.length === 0) return null;

  const handleDelete = (id: string) => {
    if (source === "ncb") {
      fetch("/api/pipeline/sessions", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      }).then(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      });
    } else {
      deleteLocalSession(id);
      setSessions(listLocalSessions());
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const displayed = expanded ? sessions : sessions.slice(0, 3);

  return (
    <Card variant="raised" style={{ marginBottom: "var(--drp-space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--drp-space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <Clock size={16} style={{ color: "var(--drp-grey)" }} />
          <h4
            style={{
              fontSize: "var(--drp-text-md)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Recent Sessions
          </h4>
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
            }}
          >
            ({sessions.length})
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
        {displayed.map((session) => (
          <div
            key={session.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-3)",
              padding: "var(--drp-space-2) var(--drp-space-3)",
              border: "var(--drp-border)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.title || "Untitled session"}
              </div>
              <div
                style={{
                  fontSize: "var(--drp-text-xs)",
                  color: "var(--drp-grey)",
                  display: "flex",
                  gap: "var(--drp-space-2)",
                }}
              >
                <span>{formatDate(session.updatedAt)}</span>
                <span
                  style={{
                    padding: "0 4px",
                    background:
                      session.phase === "complete"
                        ? "rgba(0, 170, 0, 0.15)"
                        : session.phase === "error"
                          ? "rgba(255, 68, 68, 0.12)"
                          : "rgba(233, 215, 152, 0.3)",
                    fontWeight: 600,
                  }}
                >
                  {PHASE_LABELS[session.phase] || session.phase}
                </span>
              </div>
            </div>
            {session.phase === "error" && onRetryFromPhase ? (
              (() => {
                // Parse stateJson to find errorAtPhase
                let errorAtPhase: string | undefined;
                try {
                  const parsed = JSON.parse(session.stateJson);
                  errorAtPhase = parsed.errorAtPhase;
                } catch {
                  /* ignore */
                }
                return errorAtPhase ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      onRetryFromPhase(session.stateJson, errorAtPhase!)
                    }
                    style={{ flexShrink: 0 }}
                  >
                    <RotateCcw size={12} />
                    Retry {PHASE_LABELS[errorAtPhase] || errorAtPhase}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onResume(session.stateJson)}
                    style={{ flexShrink: 0 }}
                  >
                    <Play size={12} />
                    Resume
                  </Button>
                );
              })()
            ) : session.phase === "complete" ? (
              <Button
                size="sm"
                onClick={() => onView(session.stateJson)}
                style={{ flexShrink: 0 }}
              >
                View
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onResume(session.stateJson)}
                style={{ flexShrink: 0 }}
              >
                <Play size={12} />
                Resume
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(session.id)}
              style={{ flexShrink: 0, color: "var(--drp-grey)" }}
              title="Delete session"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      {sessions.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: "var(--drp-space-2)",
            color: "var(--drp-purple)",
            textDecoration: "underline",
          }}
        >
          {expanded ? "Show less" : `Show all ${sessions.length} sessions`}
        </Button>
      )}
    </Card>
  );
}
