"use client";
import React from "react";
import { Card } from "@bruddle/react";
import type { CampaignPostStatus } from "@/lib/knowledge/types";

interface CampaignAnalyticsProps {
  counts: Record<CampaignPostStatus, number>;
  total: number;
}

const FUNNEL: { status: CampaignPostStatus; label: string; color: string }[] = [
  { status: "waiting_review", label: "Generated", color: "#e0e0e0" },
  { status: "validated", label: "Validated", color: "#0066CC" },
  { status: "in_progress", label: "Writing", color: "#E85D04" },
  { status: "published", label: "Published", color: "#00AA66" },
];

export function CampaignAnalytics({ counts, total }: CampaignAnalyticsProps) {
  if (total === 0) return null;

  const reviewed =
    (counts.validated || 0) +
    (counts.rejected || 0) +
    (counts.in_progress || 0) +
    (counts.published || 0);

  const funnelData = [
    { label: "Generated", count: total, color: "#888" },
    { label: "Reviewed", count: reviewed, color: "#555" },
    {
      label: "Validated",
      count:
        (counts.validated || 0) +
        (counts.in_progress || 0) +
        (counts.published || 0),
      color: "#0066CC",
    },
    {
      label: "Writing",
      count: (counts.in_progress || 0) + (counts.published || 0),
      color: "#E85D04",
    },
    { label: "Published", count: counts.published || 0, color: "#00AA66" },
  ];

  return (
    <Card
      variant="flat"
      style={{ marginTop: "var(--bru-space-4)", padding: "var(--bru-space-4)" }}
    >
      <div
        style={{
          fontSize: "var(--bru-text-xs)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--bru-grey)",
          letterSpacing: "0.05em",
          marginBottom: "var(--bru-space-3)",
        }}
      >
        Idea Funnel
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--bru-space-2)",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {funnelData.map((step, i) => {
          const pct = total > 0 ? Math.round((step.count / total) * 100) : 0;
          const barHeight = Math.max(4, Math.round((step.count / total) * 80));
          return (
            <div
              key={step.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                flex: 1,
                minWidth: 48,
              }}
            >
              {i > 0 && (
                <div
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    alignSelf: "flex-start",
                    marginBottom: 2,
                  }}
                >
                  →
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: barHeight,
                  background: step.color,
                  opacity: step.count === 0 ? 0.2 : 1,
                  borderRadius: 2,
                  minHeight: 4,
                }}
              />
              <div
                style={{
                  fontSize: "var(--bru-text-xs)",
                  fontWeight: 700,
                  color: step.count > 0 ? step.color : "var(--bru-grey)",
                }}
              >
                {step.count}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--bru-grey)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--bru-grey)",
                }}
              >
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
      {counts.rejected > 0 && (
        <div
          style={{
            marginTop: "var(--bru-space-3)",
            fontSize: "var(--bru-text-xs)",
            color: "#990000",
          }}
        >
          {counts.rejected} idea{counts.rejected !== 1 ? "s" : ""} rejected
        </div>
      )}
    </Card>
  );
}
