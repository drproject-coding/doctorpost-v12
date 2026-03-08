"use client";
import React from "react";
import { Alert, Card } from "@bruddle/react";
import { Loader, Check, AlertCircle } from "lucide-react";

const PILLAR_COLORS = [
  { bg: "#6B4FFF", text: "#fff" },
  { bg: "#0066CC", text: "#fff" },
  { bg: "#00AA66", text: "#fff" },
  { bg: "#E85D04", text: "#fff" },
  { bg: "#CC0044", text: "#fff" },
  { bg: "#008899", text: "#fff" },
  { bg: "#7700BB", text: "#fff" },
  { bg: "#AA5500", text: "#fff" },
];

interface BatchProgressProps {
  phase: "idle" | "creating" | "planning" | "saving" | "complete" | "error";
  slotsPlanned: number;
  totalSlots: number;
  error?: string;
  pillarDistribution?: Record<string, number>;
}

export function BatchProgress({
  phase,
  slotsPlanned,
  totalSlots,
  error,
  pillarDistribution,
}: BatchProgressProps) {
  const progressPercent =
    totalSlots > 0 ? Math.round((slotsPlanned / totalSlots) * 100) : 0;

  return (
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Campaign Progress
      </h3>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 8,
          background: "var(--bru-border-color, #e0e0e0)",
          marginBottom: "var(--bru-space-3)",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background:
              phase === "error"
                ? "var(--bru-error, #FF4444)"
                : phase === "complete"
                  ? "var(--bru-success, #00AA00)"
                  : "var(--bru-purple)",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bru-space-2)",
          marginBottom: "var(--bru-space-3)",
        }}
      >
        {phase === "complete" ? (
          <Check size={16} style={{ color: "var(--bru-success, #00AA00)" }} />
        ) : phase === "error" ? (
          <AlertCircle
            size={16}
            style={{ color: "var(--bru-error, #FF4444)" }}
          />
        ) : phase !== "idle" ? (
          <Loader size={16} className="animate-spin" />
        ) : null}
        <span
          style={{
            fontSize: "var(--bru-text-md)",
            fontWeight: 500,
          }}
        >
          {phase === "idle" && "Ready to start"}
          {phase === "creating" && "Creating campaign..."}
          {phase === "planning" && "AI is planning topics..."}
          {phase === "saving" &&
            `Saving slots (${slotsPlanned}/${totalSlots})...`}
          {phase === "complete" && `Complete! ${slotsPlanned} posts planned.`}
          {phase === "error" && "An error occurred"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: "var(--bru-space-3)" }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Pillar distribution on complete */}
      {phase === "complete" && pillarDistribution && (
        <div>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Pillar Distribution
          </h4>
          <div
            style={{
              display: "flex",
              gap: "var(--bru-space-2)",
              flexWrap: "wrap",
            }}
          >
            {Object.entries(pillarDistribution).map(([pillar, count], i) => (
              <div
                key={pillar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "var(--bru-space-1) var(--bru-space-2)",
                  background: PILLAR_COLORS[i % PILLAR_COLORS.length].bg,
                  color: PILLAR_COLORS[i % PILLAR_COLORS.length].text,
                  fontSize: "var(--bru-text-xs)",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                <span
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {pillar}
                </span>
                <span
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
