"use client";
import React from "react";
import { Card } from "@doctorproject/react";
import type { ScoreResult } from "@/lib/knowledge/types";
import { RewriteInstructions } from "./RewriteInstructions";

interface ScorecardProps {
  score: ScoreResult;
  onApplyFix?: (instructions: string) => void;
  isApplying?: boolean;
  rewriteCount?: number;
}

function scoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "var(--drp-success-dark, #2d7a3a)";
  if (pct >= 60) return "var(--drp-warning-dark, #b8860b)";
  return "var(--drp-error-dark, #c0392b)";
}

function verdictColor(verdict: ScoreResult["verdict"]): string {
  switch (verdict) {
    case "publish":
      return "rgba(0, 170, 0, 0.15)";
    case "minor-tweaks":
      return "rgba(233, 215, 152, 0.3)";
    default:
      return "rgba(255, 68, 68, 0.12)";
  }
}

export function Scorecard({
  score,
  onApplyFix,
  isApplying,
  rewriteCount,
}: ScorecardProps) {
  const criteria = score?.criteriaScores;

  return (
    <Card variant="raised" style={{ minWidth: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--drp-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--drp-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Scorecard
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--drp-text-h4)",
              fontWeight: 700,
              color: scoreColor(score.totalScore, 100),
            }}
          >
            {score.totalScore}
          </span>
          <span
            style={{ fontSize: "var(--drp-text-sm)", color: "var(--drp-grey)" }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Verdict badge */}
      <div
        style={{
          display: "inline-block",
          padding: "var(--drp-space-1) var(--drp-space-3)",
          background: verdictColor(score.verdict),
          fontWeight: 700,
          fontSize: "var(--drp-text-sm)",
          textTransform: "uppercase",
          marginBottom: "var(--drp-space-4)",
        }}
      >
        {score.verdict}
      </div>

      {/* Criteria breakdown */}
      {criteria && (
        <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
          <CriteriaRow
            label="Hook"
            score={criteria.hook?.score ?? 0}
            max={criteria.hook?.max ?? 20}
            feedback={criteria.hook?.feedback ?? ""}
          />
          <CriteriaRow
            label="Strategic Relevance"
            score={criteria.strategicRelevance?.score ?? 0}
            max={criteria.strategicRelevance?.max ?? 20}
            feedback={criteria.strategicRelevance?.feedback ?? ""}
          />
          <CriteriaRow
            label="Structure & Rhythm"
            score={criteria.structureRhythm?.score ?? 0}
            max={criteria.structureRhythm?.max ?? 15}
            feedback={criteria.structureRhythm?.feedback ?? ""}
          />
          <CriteriaRow
            label="Tone & Style"
            score={criteria.toneStyle?.score ?? 0}
            max={criteria.toneStyle?.max ?? 15}
            feedback={criteria.toneStyle?.feedback ?? ""}
          />
          <CriteriaRow
            label="Content Value"
            score={criteria.contentValue?.score ?? 0}
            max={criteria.contentValue?.max ?? 15}
            feedback={criteria.contentValue?.feedback ?? ""}
          />
          <CriteriaRow
            label="Conclusion & CTA"
            score={criteria.conclusionCTA?.score ?? 0}
            max={criteria.conclusionCTA?.max ?? 10}
            feedback={criteria.conclusionCTA?.feedback ?? ""}
          />
        </div>
      )}

      {/* Bonus/Penalty */}
      {criteria?.bonusPenalty?.score !== 0 &&
        criteria?.bonusPenalty?.score !== undefined && (
          <div
            style={{
              marginTop: "var(--drp-space-3)",
              padding: "var(--drp-space-2)",
              border: "var(--drp-border)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <strong>
              Bonus/Penalty:{" "}
              {(criteria.bonusPenalty?.score ?? 0) > 0 ? "+" : ""}
              {criteria.bonusPenalty?.score ?? 0}
            </strong>
            {criteria.bonusPenalty?.details &&
              criteria.bonusPenalty.details.length > 0 && (
                <ul
                  style={{
                    margin: "var(--drp-space-1) 0 0",
                    paddingLeft: "var(--drp-space-4)",
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                  }}
                >
                  {criteria.bonusPenalty.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
          </div>
        )}

      {/* Checklist score */}
      {score?.checklistScore !== undefined && (
        <div
          style={{
            marginTop: "var(--drp-space-3)",
            padding: "var(--drp-space-2)",
            border: "var(--drp-border)",
            fontSize: "var(--drp-text-sm)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Checklist Score</span>
          <strong>{score.checklistScore}/40</strong>
        </div>
      )}

      {/* Rewrite instructions */}
      {score.rewriteInstructions && (
        <RewriteInstructions
          instructions={score.rewriteInstructions}
          totalScore={score.totalScore}
          verdict={score.verdict}
          onApplyFix={onApplyFix ?? (() => {})}
          isApplying={isApplying}
          rewriteCount={rewriteCount}
        />
      )}
    </Card>
  );
}

function CriteriaRow({
  label,
  score,
  max,
  feedback,
}: {
  label: string;
  score: number;
  max: number;
  feedback: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--drp-space-2)",
        fontSize: "var(--drp-text-sm)",
        minWidth: 0,
      }}
    >
      {/* Label column */}
      <span
        style={{
          minWidth: 100,
          maxWidth: 140,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Progress bar column */}
      <div
        style={{
          flex: 1,
          minWidth: 60,
          height: 6,
          background: "var(--drp-border-color, #e0e0e0)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min((score / max) * 100, 100)}%`,
            maxWidth: "100%",
            height: "100%",
            background: scoreColor(score, max),
          }}
        />
      </div>

      {/* Score column - right aligned */}
      <span
        style={{
          minWidth: 45,
          maxWidth: 50,
          textAlign: "right",
          fontWeight: 700,
          color: scoreColor(score, max),
          fontSize: "var(--drp-text-xs)",
        }}
      >
        {score}/{max}
      </span>

      {/* Feedback column */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "var(--drp-text-xs)",
          color: "var(--drp-grey)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={feedback}
      >
        {feedback}
      </span>
    </div>
  );
}
