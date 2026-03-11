"use client";
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Compass,
  Search,
  BookOpen,
  PenTool,
  Target,
  Wand2,
  Eye,
  Lightbulb,
} from "lucide-react";
import { Button } from "@doctorproject/react";
import type { PipelinePhase } from "@/lib/agents/orchestrator";

const STEPS: { phase: PipelinePhase; label: string; icon: React.ReactNode }[] =
  [
    { phase: "direction", label: "Direction", icon: <Compass size={20} /> },
    { phase: "discovery", label: "Discovery", icon: <Search size={20} /> },
    { phase: "evidence", label: "Evidence", icon: <BookOpen size={20} /> },
    { phase: "writing", label: "Writing", icon: <PenTool size={20} /> },
    { phase: "scoring", label: "Scoring", icon: <Target size={20} /> },
    { phase: "formatting", label: "Formatting", icon: <Wand2 size={20} /> },
    { phase: "review", label: "Review", icon: <Eye size={20} /> },
    { phase: "learning", label: "Learning", icon: <Lightbulb size={20} /> },
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
    <div style={{ marginBottom: "var(--drp-space-6)" }}>
      {/* Phase bar */}
      <div
        style={{
          display: "flex",
          gap: "var(--drp-space-1)",
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
                gap: "var(--drp-space-1)",
                cursor: canClick ? "pointer" : "default",
                position: "relative",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  color: isViewing
                    ? "var(--drp-purple)"
                    : isComplete || isCurrent
                      ? "var(--drp-black)"
                      : "var(--drp-grey)",
                  opacity: isComplete || isCurrent || isViewing ? 1 : 0.5,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {step.icon}
              </div>
              {/* Progress bar segment */}
              <div
                style={{
                  width: "100%",
                  height: isViewing ? 6 : 4,
                  background: isViewing
                    ? "rgba(124, 58, 237, 0.2)"
                    : "var(--drp-border-color, #e0e0e0)",
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
                      ? "var(--drp-error, #FF4444)"
                      : "var(--drp-purple)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              {/* Label + Status indicator + Retry button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-1)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    fontWeight: isCurrent || isViewing ? 700 : 400,
                    color: isViewing
                      ? "var(--drp-purple)"
                      : isComplete || isCurrent
                        ? "var(--drp-black)"
                        : "var(--drp-grey)",
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
                    style={{ color: "var(--drp-success-dark, #2d7a3a)" }}
                  />
                )}
                {metadata?.phaseStatus?.[step.phase] === "failed" && (
                  <XCircle
                    size={14}
                    style={{ color: "var(--drp-error-dark, #c0392b)" }}
                  />
                )}
                {canRetry && (
                  <Button
                    variant="ghost"
                    icon
                    aria-label={`Reload ${step.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryPhase(step.phase);
                    }}
                    style={{
                      color: "var(--drp-purple)",
                      padding: "2px 4px",
                      opacity: 0.7,
                    }}
                  >
                    <RotateCcw size={12} />
                  </Button>
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
            marginTop: "var(--drp-space-2)",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={!canGoPrev}
            iconLeft={<ChevronLeft size={14} />}
            style={{
              color: canGoPrev
                ? "var(--drp-purple)"
                : "var(--drp-border-color, #e0e0e0)",
            }}
          >
            Previous
          </Button>

          {isViewingPast && (
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-purple)",
                fontWeight: 600,
              }}
            >
              Viewing: {STEPS[viewIdx]?.label}{" "}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPhaseClick(currentPhase)}
                style={{
                  color: "var(--drp-grey)",
                  fontSize: "var(--drp-text-xs)",
                  textDecoration: "underline",
                }}
              >
                Return to current
              </Button>
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
            iconRight={<ChevronRight size={14} />}
            style={{
              color: canGoNext
                ? "var(--drp-purple)"
                : "var(--drp-border-color, #e0e0e0)",
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Metadata display */}
      {hasMetadata && (
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-3)",
            flexWrap: "wrap",
            marginTop: "var(--drp-space-3)",
            padding: "var(--drp-space-2) var(--drp-space-3)",
            background: "var(--drp-cream, #faf8f5)",
            border: "var(--drp-border)",
            fontSize: "var(--drp-text-xs)",
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
    <span style={{ color: "var(--drp-grey)" }}>
      <strong style={{ color: "var(--drp-black)" }}>{label}:</strong> {value}
    </span>
  );
}
