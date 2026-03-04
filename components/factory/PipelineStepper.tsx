"use client";
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";
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

export interface PipelineMetadata {
  postType?: string;
  hookPattern?: string;
  contentPillar?: string;
  tone?: string;
  /** Track success/failure status for each completed phase */
  phaseStatus?: Record<PipelinePhase, "success" | "failed">;
  /** Brand context from user profile */
  brandContext?: {
    industry: string;
    audience: string[];
    tones: string[];
    contentStrategy: string;
    lastUpdated?: string;
  };
}

interface PipelineStepperProps {
  currentPhase: PipelinePhase;
  percent: number;
  errorAtPhase?: PipelinePhase;
  metadata?: PipelineMetadata;
  /** Phase the user is viewing (may differ from currentPhase) */
  viewPhase?: PipelinePhase;
  /** Called when user clicks a completed phase to review it */
  onPhaseClick?: (phase: PipelinePhase) => void;
  /** Called when user clicks retry button on a completed phase */
  onRetryPhase?: (phase: PipelinePhase) => void;
}

export function PipelineStepper({
  currentPhase,
  percent,
  errorAtPhase,
  metadata,
  viewPhase,
  onPhaseClick,
  onRetryPhase,
}: PipelineStepperProps) {
  const isErrorState = currentPhase === "error";
  const effectiveIdx =
    isErrorState && errorAtPhase
      ? phaseIndex(errorAtPhase)
      : phaseIndex(currentPhase);

  const viewIdx = viewPhase ? phaseIndex(viewPhase) : -1;
  const isViewingPast = viewIdx >= 0 && viewIdx < effectiveIdx;

  const hasMetadata =
    metadata &&
    (metadata.postType ||
      metadata.hookPattern ||
      metadata.contentPillar ||
      metadata.tone ||
      metadata.brandContext);

  // Navigation helpers
  const canGoPrev = isViewingPast ? viewIdx > 0 : effectiveIdx > 0;
  const canGoNext = isViewingPast ? viewIdx < effectiveIdx : false;

  const handlePrev = () => {
    if (!onPhaseClick) return;
    const target = isViewingPast ? viewIdx - 1 : effectiveIdx - 1;
    if (target >= 0) onPhaseClick(PHASE_ORDER[target]);
  };

  const handleNext = () => {
    if (!onPhaseClick) return;
    if (isViewingPast) {
      const target = viewIdx + 1;
      if (target >= effectiveIdx) {
        // Return to current phase
        onPhaseClick(currentPhase);
      } else {
        onPhaseClick(PHASE_ORDER[target]);
      }
    }
  };

  return (
    <div style={{ marginBottom: "var(--bru-space-6)" }}>
      {/* Phase bar */}
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
          const isViewing = viewPhase === step.phase && isViewingPast;
          const canClick = isComplete && onPhaseClick;
          const canRetry = isComplete && onRetryPhase;

          return (
            <div
              key={step.phase}
              onClick={canClick ? () => onPhaseClick(step.phase) : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--bru-space-1)",
                cursor: canClick ? "pointer" : "default",
                position: "relative",
              }}
            >
              {/* Progress bar segment */}
              <div
                style={{
                  width: "100%",
                  height: isViewing ? 6 : 4,
                  background: isViewing
                    ? "rgba(124, 58, 237, 0.2)"
                    : "var(--bru-border-color, #e0e0e0)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "height 0.2s ease",
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
              {/* Label + Status indicator + Retry button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--bru-space-1)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    fontWeight: isCurrent || isViewing ? 700 : 400,
                    color: isViewing
                      ? "var(--bru-purple)"
                      : isComplete || isCurrent
                        ? "var(--bru-black)"
                        : "var(--bru-grey)",
                    whiteSpace: "nowrap",
                    textDecoration: canClick ? "underline" : "none",
                  }}
                >
                  {step.label}
                </span>
                {/* Phase status indicator */}
                {metadata?.phaseStatus?.[step.phase] === "success" && (
                  <CheckCircle
                    size={14}
                    style={{ color: "var(--bru-success-dark, #2d7a3a)" }}
                  />
                )}
                {metadata?.phaseStatus?.[step.phase] === "failed" && (
                  <XCircle
                    size={14}
                    style={{ color: "var(--bru-error-dark, #c0392b)" }}
                  />
                )}
                {canRetry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryPhase(step.phase);
                    }}
                    title={`Reload ${step.label}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--bru-purple)",
                      padding: "2px 4px",
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity =
                        "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity =
                        "0.7";
                    }}
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows + viewing indicator */}
      {onPhaseClick && effectiveIdx > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--bru-space-2)",
          }}
        >
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: canGoPrev ? "pointer" : "default",
              fontSize: "var(--bru-text-xs)",
              color: canGoPrev
                ? "var(--bru-purple)"
                : "var(--bru-border-color, #e0e0e0)",
              padding: "2px 0",
            }}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          {isViewingPast && (
            <span
              style={{
                fontSize: "var(--bru-text-xs)",
                color: "var(--bru-purple)",
                fontWeight: 600,
              }}
            >
              Viewing: {STEPS[viewIdx]?.label}{" "}
              <button
                onClick={() => onPhaseClick(currentPhase)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--bru-grey)",
                  fontSize: "var(--bru-text-xs)",
                  textDecoration: "underline",
                }}
              >
                Return to current
              </button>
            </span>
          )}

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: canGoNext ? "pointer" : "default",
              fontSize: "var(--bru-text-xs)",
              color: canGoNext
                ? "var(--bru-purple)"
                : "var(--bru-border-color, #e0e0e0)",
              padding: "2px 0",
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

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
          {metadata.brandContext && (
            <>
              {metadata.brandContext.industry && (
                <MetadataTag
                  label="Industry"
                  value={metadata.brandContext.industry}
                />
              )}
              {metadata.brandContext.audience &&
                metadata.brandContext.audience.length > 0 && (
                  <MetadataTag
                    label="Audience"
                    value={metadata.brandContext.audience.join(", ")}
                  />
                )}
              {metadata.brandContext.tones &&
                metadata.brandContext.tones.length > 0 && (
                  <MetadataTag
                    label="Brand Tone"
                    value={metadata.brandContext.tones.join(", ")}
                  />
                )}
              {metadata.brandContext.lastUpdated && (
                <MetadataTag
                  label="Updated"
                  value={new Date(
                    metadata.brandContext.lastUpdated,
                  ).toLocaleDateString()}
                />
              )}
            </>
          )}
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
