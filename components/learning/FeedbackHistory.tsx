"use client";
import React, { useState } from "react";
import { Badge, Card, Select } from "@doctorproject/react";
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

  const filterOptions = [
    { value: "all", label: "All types" },
    ...signalTypes.map((t) => ({ value: t, label: t })),
  ];

  return (
    <Card variant="raised">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--drp-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--drp-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Feedback History
        </h3>

        {/* Filter */}
        {signalTypes.length > 1 && (
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: "auto", fontSize: "var(--drp-text-sm)" }}
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-grey)",
          }}
        >
          No feedback entries yet.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
          {filtered.map((signal) => (
            <div
              key={signal.id}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 80px 1fr",
                gap: "var(--drp-space-2)",
                padding: "var(--drp-space-2)",
                borderBottom: "1px solid var(--drp-border-color, #e0e0e0)",
                alignItems: "start",
              }}
            >
              {/* Date */}
              <span
                style={{
                  fontSize: "var(--drp-text-xs)",
                  color: "var(--drp-grey)",
                }}
              >
                {new Date(signal.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>

              {/* Type badge */}
              <Badge variant="primary">{signal.signalType}</Badge>

              {/* Observation */}
              <div>
                <div style={{ fontSize: "var(--drp-text-sm)" }}>
                  {signal.observation}
                </div>
                <div
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
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
    </Card>
  );
}
