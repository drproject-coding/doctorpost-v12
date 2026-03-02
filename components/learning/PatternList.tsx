"use client";
import React from "react";
import { Card } from "@bruddle/react";
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
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Detected Patterns
      </h3>

      {patterns.length === 0 ? (
        <p
          style={{
            fontSize: "var(--bru-text-sm)",
            color: "var(--bru-grey)",
          }}
        >
          No patterns detected yet. Patterns emerge as you use the Content
          Factory and the learning agent records recurring signals.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--bru-space-3)" }}>
          {patterns.map((p, idx) => (
            <Card
              key={`${p.category}::${p.signalType}`}
              variant="flat"
              style={{ padding: "var(--bru-space-3)" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--bru-space-2)",
                  marginBottom: "var(--bru-space-2)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "0 4px",
                    background: p.promotionReady
                      ? "var(--bru-success, #00AA00)"
                      : "var(--bru-purple)",
                    color: "white",
                  }}
                >
                  {p.promotionReady ? "Promotion Ready" : `${p.count} signals`}
                </span>
                <span
                  style={{ fontSize: "var(--bru-text-sm)", fontWeight: 700 }}
                >
                  {p.category}
                </span>
                <span
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                  }}
                >
                  {p.signalType}
                </span>
              </div>

              {/* Recent observations */}
              <div style={{ display: "grid", gap: "var(--bru-space-1)" }}>
                {p.recentObservations.map((obs, oi) => (
                  <div
                    key={`obs-${idx}-${oi}`}
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      color: "var(--bru-grey)",
                      paddingLeft: "var(--bru-space-2)",
                      borderLeft: "2px solid var(--bru-border-color, #e0e0e0)",
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
                    marginTop: "var(--bru-space-2)",
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                  }}
                >
                  {p.count}/10 signals toward rule promotion
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      background: "var(--bru-border-color, #e0e0e0)",
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (p.count / 10) * 100)}%`,
                        height: "100%",
                        background: "var(--bru-purple)",
                      }}
                    />
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
