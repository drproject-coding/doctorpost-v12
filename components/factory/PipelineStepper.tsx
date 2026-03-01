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

interface PipelineStepperProps {
  currentPhase: PipelinePhase;
  percent: number;
  /** When phase is "error", which phase failed */
  errorAtPhase?: PipelinePhase;
}

export function PipelineStepper({
  currentPhase,
  percent,
  errorAtPhase,
}: PipelineStepperProps) {
  const isErrorState = currentPhase === "error";
  const effectiveIdx =
    isErrorState && errorAtPhase
      ? phaseIndex(errorAtPhase)
      : phaseIndex(currentPhase);

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--bru-space-1)",
        alignItems: "center",
        marginBottom: "var(--bru-space-6)",
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
                  width: isComplete ? "100%" : isCurrent ? `${percent}%` : "0%",
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
  );
}
