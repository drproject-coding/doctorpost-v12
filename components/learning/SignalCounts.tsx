"use client";
import React from "react";
import { Card } from "@doctorproject/react";
import type { Signal, SignalType } from "@/lib/knowledge/types";

interface SignalCountsProps {
  signals: Signal[];
}

const SIGNAL_LABELS: Record<SignalType, string> = {
  approval: "Approvals",
  rejection: "Rejections",
  edit: "Edits",
  "hook-rewrite": "Hook Rewrites",
  "tone-feedback": "Tone Feedback",
  "score-override": "Score Overrides",
};

export function SignalCounts({ signals }: SignalCountsProps) {
  const counts = signals.reduce(
    (acc, s) => {
      acc[s.signalType] = (acc[s.signalType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Category breakdown
  const categories = signals.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--drp-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-4)",
        }}
      >
        Signal Overview
      </h3>

      {signals.length === 0 ? (
        <p
          style={{
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-grey)",
          }}
        >
          No signals recorded yet. Signals are created when you approve, edit,
          or reject posts in the Content Factory.
        </p>
      ) : (
        <>
          {/* Total */}
          <div
            style={{
              fontSize: "var(--drp-text-lg)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-3)",
            }}
          >
            {signals.length} total signals
          </div>

          {/* By type */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "var(--drp-space-2)",
              marginBottom: "var(--drp-space-4)",
            }}
          >
            {Object.entries(SIGNAL_LABELS).map(([type, label]) => (
              <Card
                key={type}
                variant="flat"
                style={{ padding: "var(--drp-space-2)", textAlign: "center" }}
              >
                <div
                  style={{
                    fontSize: "var(--drp-text-h4)",
                    fontWeight: 700,
                    color: "var(--drp-purple)",
                  }}
                >
                  {counts[type] || 0}
                </div>
                <div
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  {label}
                </div>
              </Card>
            ))}
          </div>

          {/* By category */}
          <h4
            style={{
              fontSize: "var(--drp-text-md)",
              fontWeight: 700,
              marginBottom: "var(--drp-space-2)",
            }}
          >
            By Category
          </h4>
          <div
            style={{
              display: "flex",
              gap: "var(--drp-space-2)",
              flexWrap: "wrap",
            }}
          >
            {Object.entries(categories)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div
                  key={cat}
                  style={{
                    padding: "var(--drp-space-1) var(--drp-space-2)",
                    border: "var(--drp-border)",
                    fontSize: "var(--drp-text-xs)",
                  }}
                >
                  <strong>{cat}</strong>: {count}
                </div>
              ))}
          </div>
        </>
      )}
    </Card>
  );
}
