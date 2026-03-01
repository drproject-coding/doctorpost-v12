"use client";
import React from "react";
import { Loader, Check, AlertCircle } from "lucide-react";

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
    <div className="bru-card bru-card--raised">
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
        <div
          className="bru-alert bru-alert--error"
          style={{ marginBottom: "var(--bru-space-3)" }}
        >
          <span className="bru-alert__icon">!</span>
          <div className="bru-alert__content">
            <div className="bru-alert__text">{error}</div>
          </div>
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
            {Object.entries(pillarDistribution).map(([pillar, count]) => (
              <div
                key={pillar}
                style={{
                  padding: "var(--bru-space-1) var(--bru-space-2)",
                  border: "var(--bru-border)",
                  fontSize: "var(--bru-text-xs)",
                }}
              >
                <strong>{pillar}</strong>: {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
