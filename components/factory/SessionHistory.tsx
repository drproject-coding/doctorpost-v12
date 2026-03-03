"use client";
import React, { useState, useEffect } from "react";
import { Button, Card } from "@bruddle/react";
import { Clock, Trash2, Play } from "lucide-react";
import {
  listSessions,
  deleteSession,
  type SavedSession,
} from "@/lib/sessionStorage";

interface SessionHistoryProps {
  onResume: (stateJson: string) => void;
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

export function SessionHistory({ onResume }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setSessions(listSessions());
  }, []);

  if (sessions.length === 0) return null;

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(listSessions());
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
    <Card variant="raised" style={{ marginBottom: "var(--bru-space-4)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--bru-space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
          }}
        >
          <Clock size={16} style={{ color: "var(--bru-grey)" }} />
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Recent Sessions
          </h4>
          <span
            style={{
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
            }}
          >
            ({sessions.length})
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
        {displayed.map((session) => (
          <div
            key={session.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--bru-space-3)",
              padding: "var(--bru-space-2) var(--bru-space-3)",
              border: "var(--bru-border)",
              fontSize: "var(--bru-text-sm)",
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
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-grey)",
                  display: "flex",
                  gap: "var(--bru-space-2)",
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
            <Button
              size="sm"
              variant="primary"
              onClick={() => onResume(session.stateJson)}
              style={{ flexShrink: 0 }}
            >
              <Play size={12} />
              Resume
            </Button>
            <button
              onClick={() => handleDelete(session.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--bru-grey)",
                flexShrink: 0,
                padding: 4,
              }}
              title="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {sessions.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: "var(--bru-space-2)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-purple)",
            textDecoration: "underline",
          }}
        >
          {expanded ? "Show less" : `Show all ${sessions.length} sessions`}
        </button>
      )}
    </Card>
  );
}
