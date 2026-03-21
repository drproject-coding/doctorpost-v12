"use client";
import React, { useState } from "react";
import { Button } from "@doctorproject/react";
import { Wand2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface ParsedInstruction {
  text: string;
  type: "required" | "optional";
}

function parseInstructions(raw: string): {
  required: string[];
  optional: string[];
} {
  const required: string[] = [];
  const optional: string[] = [];

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let currentSection: "required" | "optional" | "unknown" = "unknown";

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section headers
    if (
      lower.includes("required") ||
      lower.includes("must") ||
      lower.includes("critical") ||
      lower.includes("fix")
    ) {
      currentSection = "required";
      // If it's just a header, skip
      if (lower.match(/^(required|must|critical|fixes?|changes?)[\s:]*$/i))
        continue;
    }
    if (
      lower.includes("optional") ||
      lower.includes("suggestion") ||
      lower.includes("improvement") ||
      lower.includes("consider")
    ) {
      currentSection = "optional";
      if (
        lower.match(/^(optional|suggestions?|improvements?|consider)[\s:]*$/i)
      )
        continue;
    }

    // Parse numbered or bulleted items
    const cleaned = line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-*]\s*/, "");
    if (!cleaned) continue;

    if (currentSection === "optional") {
      optional.push(cleaned);
    } else {
      // Default to required
      required.push(cleaned);
    }
  }

  // If no sections detected, treat all as required
  if (required.length === 0 && optional.length === 0) {
    return { required: [raw], optional: [] };
  }

  return { required, optional };
}

interface RewriteInstructionsProps {
  instructions: string;
  totalScore: number;
  verdict: string;
  onApplyFix: (instructions: string) => void;
  isApplying?: boolean;
  maxRewrites?: number;
  rewriteCount?: number;
}

export function RewriteInstructions({
  instructions,
  totalScore,
  verdict,
  onApplyFix,
  isApplying = false,
  maxRewrites = 2,
  rewriteCount = 0,
}: RewriteInstructionsProps) {
  const [expanded, setExpanded] = useState(true);
  const parsed = parseInstructions(instructions);
  const threshold = 75;
  const passes = totalScore >= threshold;

  return (
    <div
      style={{
        marginTop: "var(--drp-space-3)",
        border: "var(--drp-border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--drp-space-2) var(--drp-space-3)",
          background: passes
            ? "rgba(0, 170, 0, 0.08)"
            : "rgba(233, 215, 152, 0.3)",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--drp-text-sm)",
          fontWeight: 700,
        }}
      >
        <span>
          SCORE: {totalScore}/100{" "}
          {passes ? (
            <span style={{ color: "var(--drp-success-dark, #2d7a3a)" }}>
              PASSES (&gt;{threshold})
            </span>
          ) : (
            <span style={{ color: "var(--drp-warning-dark, #b8860b)" }}>
              NEEDS WORK (&lt;{threshold})
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: "var(--drp-space-3)" }}>
          {/* Required changes */}
          {parsed.required.length > 0 && (
            <div style={{ marginBottom: "var(--drp-space-3)" }}>
              <h5
                style={{
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: 700,
                  marginBottom: "var(--drp-space-1)",
                  color: "var(--drp-error-dark, #c0392b)",
                }}
              >
                REQUIRED CHANGES:
              </h5>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: "var(--drp-space-4)",
                  fontSize: "var(--drp-text-sm)",
                  lineHeight: 1.6,
                }}
              >
                {parsed.required.map((item, i) => (
                  <li key={i} style={{ marginBottom: "var(--drp-space-1)" }}>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Optional improvements */}
          {parsed.optional.length > 0 && (
            <div style={{ marginBottom: "var(--drp-space-3)" }}>
              <h5
                style={{
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: 700,
                  marginBottom: "var(--drp-space-1)",
                  color: "var(--drp-grey)",
                }}
              >
                OPTIONAL IMPROVEMENTS:
              </h5>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "var(--drp-space-4)",
                  fontSize: "var(--drp-text-sm)",
                  lineHeight: 1.6,
                  color: "var(--drp-grey)",
                }}
              >
                {parsed.optional.map((item, i) => (
                  <li key={i} style={{ marginBottom: "var(--drp-space-1)" }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply fixes button */}
          {!passes && (
            <div
              style={{
                display: "flex",
                gap: "var(--drp-space-2)",
                alignItems: "center",
              }}
            >
              {rewriteCount < maxRewrites ? (
                <Button
                  variant="primary"
                  onClick={() => onApplyFix(instructions)}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <RotateCcw size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  {isApplying ? "Applying fixes..." : "Apply Fixes with AI"}
                </Button>
              ) : (
                <span
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  Max rewrites reached ({maxRewrites}). Edit manually in Review
                  phase.
                </span>
              )}
              {rewriteCount > 0 && rewriteCount < maxRewrites && (
                <span
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  Attempt {rewriteCount}/{maxRewrites}
                </span>
              )}
            </div>
          )}

          {passes && (
            <div
              style={{
                padding: "var(--drp-space-2)",
                background: "rgba(0, 170, 0, 0.08)",
                fontSize: "var(--drp-text-sm)",
                fontWeight: 500,
                color: "var(--drp-success-dark, #2d7a3a)",
              }}
            >
              Score passes threshold. Ready to format!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
