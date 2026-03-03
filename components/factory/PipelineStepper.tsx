"use client";
import React from "react";
import type { PipelinePhase } from "@/lib/agents/orchestrator";

const STEPS: { phase: PipelinePhase; label: string }[] = [
  { phase: "direction", label: "Direction" },
  { phase: "discovery", label: "Discovery" },
  { phase: "evidence", label: "Evidence" },
  { phase: "writing", label: "Writing" },
  { phase: "scoring", label: "Scoring" },
  { phase: "formatting", label: "Formatting" },
  { phase: "review", label: "Review" },
  { phase: "learning", label: "Learning" },
];

const PHASE_ORDER: PipelinePhase[] = STEPS.map((s) => s.phase);

function phaseIndex(phase: PipelinePhase): number {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx === -1 ? -1 : idx;
}

interface PipelineMetadata {
  postType?: string;
  hookPattern?: string;
  contentPillar?: string;
  tone?: string;
}

interface PipelineStepperProps {
  currentPhase: PipelinePhase;
  percent: number;
  /** When phase is "error", which phase failed */
  errorAtPhase?: PipelinePhase;
  /** Metadata from selected topic / pipeline state */
  metadata?: PipelineMetadata;
}

export function PipelineStepper({
  currentPhase,
  percent,
  errorAtPhase,
  metadata,
}: PipelineStepperProps) {
  const isErrorState = currentPhase === "error";
  const effectiveIdx =
    isErrorState && errorAtPhase
      ? phaseIndex(errorAtPhase)
      : phaseIndex(currentPhase);

  const hasMetadata =
    metadata &&
    (metadata.postType ||
      metadata.hookPattern ||
      metadata.contentPillar ||
      metadata.tone);

  return (
    <div style={{ marginBottom: "var(--bru-space-6)" }}>
      <div
        style={{
          display: "flex",
          gap: "var(--bru-space-1)",
          alignItems: "center",
        }}
      >
        {STEPS.map((step, i) => {
          const isComplete = i < effectiveIdx;
          const isCurrent = i === effectiveIdx;
          const isError = isCurrent && isErrorState;

          return (
            <div
              key={step.phase}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--bru-space-1)",
              }}
            >
              {/* Progress bar segment */}
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "var(--bru-border-color, #e0e0e0)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: isComplete
                      ? "100%"
                      : isCurrent
                        ? `${percent}%`
                        : "0%",
                    height: "100%",
                    background: isError
                      ? "var(--bru-error, #FF4444)"
                      : "var(--bru-purple)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              {/* Label */}
              <span
                style={{
                  fontSize: "var(--bru-text-xs)",
                  fontWeight: isCurrent ? 700 : 400,
                  color:
                    isComplete || isCurrent
                      ? "var(--bru-black)"
                      : "var(--bru-grey)",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Metadata display */}
      {hasMetadata && (
        <div
          style={{
            display: "flex",
            gap: "var(--bru-space-3)",
            flexWrap: "wrap",
            marginTop: "var(--bru-space-3)",
            padding: "var(--bru-space-2) var(--bru-space-3)",
            background: "var(--bru-cream, #faf8f5)",
            border: "var(--bru-border)",
            fontSize: "var(--bru-text-xs)",
          }}
        >
          {metadata.postType && (
            <MetadataTag label="Post Type" value={metadata.postType} />
          )}
          {metadata.hookPattern && (
            <MetadataTag label="Hook" value={metadata.hookPattern} />
          )}
          {metadata.contentPillar && (
            <MetadataTag label="Pillar" value={metadata.contentPillar} />
          )}
          {metadata.tone && <MetadataTag label="Tone" value={metadata.tone} />}
        </div>
      )}
    </div>
  );
}

function MetadataTag({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ color: "var(--bru-grey)" }}>
      <strong style={{ color: "var(--bru-black)" }}>{label}:</strong> {value}
    </span>
  );
}
