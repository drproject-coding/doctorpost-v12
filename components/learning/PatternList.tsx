"use client";
import React from "react";
import { Badge, Card, ProgressBar } from "@doctorproject/react";
import type { Signal } from "@/lib/knowledge/types";

interface PatternListProps {
  signals: Signal[];
}

interface DetectedPattern {
  category: string;
  signalType: string;
  count: number;
  recentObservations: string[];
  promotionReady: boolean;
}

/**
 * Detects recurring patterns by grouping signals by (category, signalType).
 * A pattern is "promotion ready" when it reaches 10+ occurrences.
 */
function detectPatterns(signals: Signal[]): DetectedPattern[] {
  const groups = new Map<string, Signal[]>();
  for (const s of signals) {
    const key = `${s.category}::${s.signalType}`;
    const arr = groups.get(key) || [];
    arr.push(s);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([key, sigs]) => {
      const [category, signalType] = key.split("::");
      const sorted = sigs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return {
        category,
        signalType,
        count: sigs.length,
        recentObservations: sorted.slice(0, 3).map((s) => s.observation),
        promotionReady: sigs.length >= 10,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function PatternList({ signals }: PatternListProps) {
  const patterns = detectPatterns(signals);

  return (
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--drp-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-4)",
        }}
      >
        Detected Patterns
      </h3>

      {patterns.length === 0 ? (
        <p
          style={{
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-grey)",
          }}
        >
          No patterns detected yet. Patterns emerge as you use the Content
          Factory and the learning agent records recurring signals.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--drp-space-3)" }}>
          {patterns.map((p) => (
            <Card
              key={`${p.category}::${p.signalType}`}
              variant="flat"
              style={{ padding: "var(--drp-space-3)" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-2)",
                  marginBottom: "var(--drp-space-2)",
                }}
              >
                <Badge variant={p.promotionReady ? "mint" : "primary"}>
                  {p.promotionReady ? "Promotion Ready" : `${p.count} signals`}
                </Badge>
                <span
                  style={{ fontSize: "var(--drp-text-sm)", fontWeight: 700 }}
                >
                  {p.category}
                </span>
                <span
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  {p.signalType}
                </span>
              </div>

              {/* Recent observations */}
              <div style={{ display: "grid", gap: "var(--drp-space-1)" }}>
                {p.recentObservations.map((obs, oi) => (
                  <div
                    key={`obs-${p.category}-${p.signalType}-${oi}`}
                    style={{
                      fontSize: "var(--drp-text-xs)",
                      color: "var(--drp-grey)",
                      paddingLeft: "var(--drp-space-2)",
                      borderLeft: "2px solid var(--drp-border-color, #e0e0e0)",
                    }}
                  >
                    {obs}
                  </div>
                ))}
              </div>

              {/* Progress toward promotion */}
              {!p.promotionReady && (
                <div
                  style={{
                    marginTop: "var(--drp-space-2)",
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  {p.count}/10 signals toward rule promotion
                  <div style={{ marginTop: "var(--drp-space-1)" }}>
                    <ProgressBar value={Math.min(100, (p.count / 10) * 100)} />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
