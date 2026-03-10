"use client";
import React, { useState } from "react";
import { Card } from "@doctorproject/react";
import { ChevronDown, ChevronUp, Brain, TrendingUp, Zap } from "lucide-react";
import type { LearnerOutput, LearnerSignal } from "@/lib/agents/learner";

interface LearningPhaseResultProps {
  output: LearnerOutput;
}

function signalIcon(type: LearnerSignal["signalType"]) {
  switch (type) {
    case "approval":
      return "\u2705";
    case "rejection":
      return "\u274C";
    case "edit":
      return "\u270F\uFE0F";
    case "hook-rewrite":
      return "\uD83C\uDFA3";
    case "tone-feedback":
      return "\uD83C\uDFA4";
    case "score-override":
      return "\uD83C\uDFAF";
    default:
      return "\uD83D\uDCCA";
  }
}

function signalColor(type: LearnerSignal["signalType"]): string {
  switch (type) {
    case "approval":
      return "var(--drp-success-dark, #2d7a3a)";
    case "rejection":
      return "var(--drp-error-dark, #c0392b)";
    case "edit":
    case "hook-rewrite":
      return "var(--drp-warning-dark, #b8860b)";
    default:
      return "var(--drp-grey)";
  }
}

export function LearningPhaseResult({ output }: LearningPhaseResultProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card variant="raised">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: expanded ? "var(--drp-space-4)" : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <Brain size={18} style={{ color: "var(--drp-purple)" }} />
          <h3
            style={{
              fontSize: "var(--drp-text-h5)",
              fontWeight: 700,
              margin: 0,
              color: "var(--drp-success-dark, #2d7a3a)",
            }}
          >
            Learning Phase Complete
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
            }}
          >
            {output.signals.length} signal
            {output.signals.length !== 1 ? "s" : ""} captured
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div>
          {/* Pattern detected */}
          {output.patternDetected && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-2)",
                padding: "var(--drp-space-2) var(--drp-space-3)",
                background: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                marginBottom: "var(--drp-space-3)",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              <TrendingUp
                size={14}
                style={{ color: "var(--drp-purple)", flexShrink: 0 }}
              />
              <div>
                <strong style={{ color: "var(--drp-purple)" }}>
                  Pattern Detected:
                </strong>{" "}
                {output.patternDetected}
              </div>
            </div>
          )}

          {/* Rule promotion indicator */}
          {output.rulePromotionReady && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--drp-space-2)",
                padding: "var(--drp-space-2) var(--drp-space-3)",
                background: "rgba(0, 170, 0, 0.08)",
                border: "1px solid rgba(0, 170, 0, 0.2)",
                marginBottom: "var(--drp-space-3)",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              <Zap
                size={14}
                style={{
                  color: "var(--drp-success-dark, #2d7a3a)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "var(--drp-success-dark, #2d7a3a)",
                  fontWeight: 600,
                }}
              >
                Ready for rule promotion — this pattern has been validated
                enough to become a writing rule.
              </span>
            </div>
          )}

          {/* Captured Signals */}
          <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
            <h4
              style={{
                fontSize: "var(--drp-text-sm)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Captured Signals
            </h4>
            {output.signals.map((signal, i) => (
              <div
                key={i}
                style={{
                  padding: "var(--drp-space-2) var(--drp-space-3)",
                  border: "var(--drp-border)",
                  fontSize: "var(--drp-text-sm)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--drp-space-2)",
                    marginBottom: "var(--drp-space-1)",
                  }}
                >
                  <span>{signalIcon(signal.signalType)}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: signalColor(signal.signalType),
                      textTransform: "capitalize",
                    }}
                  >
                    {signal.signalType.replaceAll("-", " ")}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--drp-text-xs)",
                      color: "var(--drp-grey)",
                      padding: "0 4px",
                      background: "var(--drp-cream, #faf8f5)",
                    }}
                  >
                    {signal.category}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--drp-text-sm)",
                    color: "var(--drp-grey)",
                    lineHeight: 1.5,
                  }}
                >
                  {signal.observation}
                </p>
              </div>
            ))}
          </div>

          {output.signals.length === 0 && (
            <div
              style={{
                padding: "var(--drp-space-3)",
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-grey)",
              }}
            >
              <p style={{ margin: 0, marginBottom: "var(--drp-space-2)" }}>
                <strong>No signals captured</strong>
              </p>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Signals are learning data points captured from your actions
                during the pipeline, such as approvals, rejections, edits, or
                feedback you provide.
              </p>
              <p style={{ margin: "var(--drp-space-2) 0 0", lineHeight: 1.5 }}>
                This session had no interactive feedback signals, which is
                normal for auto-completed sessions. Signals are captured when
                you manually:
              </p>
              <ul
                style={{
                  margin: "var(--drp-space-1) 0 0",
                  paddingLeft: "var(--drp-space-4)",
                  fontSize: "var(--drp-text-xs)",
                }}
              >
                <li>Approve or reject content</li>
                <li>Edit the draft</li>
                <li>Provide tone or style feedback</li>
                <li>Override automatic scores</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
