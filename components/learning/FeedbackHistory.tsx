"use client";
import React, { useState } from "react";
import type { Signal } from "@/lib/knowledge/types";

interface FeedbackHistoryProps {
  signals: Signal[];
}

export function FeedbackHistory({ signals }: FeedbackHistoryProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const sorted = [...signals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const signalTypes = Array.from(new Set(signals.map((s) => s.signalType)));

  const filtered =
    filterType === "all"
      ? sorted
      : sorted.filter((s) => s.signalType === filterType);

  return (
    <div className="bru-card bru-card--raised">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Feedback History
        </h3>

        {/* Filter */}
        {signalTypes.length > 1 && (
          <select
            className="bru-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: "auto", fontSize: "var(--bru-text-sm)" }}
          >
            <option value="all">All types</option>
            {signalTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            fontSize: "var(--bru-text-sm)",
            color: "var(--bru-grey)",
          }}
        >
          No feedback entries yet.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
          {filtered.map((signal, idx) => (
            <div
              key={signal.id}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 80px 1fr",
                gap: "var(--bru-space-2)",
                padding: "var(--bru-space-2)",
                borderBottom: "1px solid var(--bru-border-color, #e0e0e0)",
                alignItems: "start",
              }}
            >
              {/* Date */}
              <span
                style={{
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-grey)",
                }}
              >
                {new Date(signal.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>

              {/* Type badge */}
              <span
                style={{
                  fontSize: "var(--bru-text-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "0 4px",
                  background: "var(--bru-purple)",
                  color: "white",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {signal.signalType}
              </span>

              {/* Observation */}
              <div>
                <div style={{ fontSize: "var(--bru-text-sm)" }}>
                  {signal.observation}
                </div>
                <div
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    marginTop: 2,
                  }}
                >
                  {signal.category}
                  {signal.sessionId &&
                    ` · Session: ${signal.sessionId.slice(0, 8)}…`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
