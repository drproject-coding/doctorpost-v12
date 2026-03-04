"use client";
import React from "react";
import { Card } from "@bruddle/react";
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
  if (pct >= 80) return "var(--bru-success-dark, #2d7a3a)";
  if (pct >= 60) return "var(--bru-warning-dark, #b8860b)";
  return "var(--bru-error-dark, #c0392b)";
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
  const criteria = score.criteriaScores;

  return (
    <Card variant="raised" style={{ minWidth: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--bru-text-h5)",
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
            gap: "var(--bru-space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--bru-text-h4)",
              fontWeight: 700,
              color: scoreColor(score.totalScore, 100),
            }}
          >
            {score.totalScore}
          </span>
          <span
            style={{ fontSize: "var(--bru-text-sm)", color: "var(--bru-grey)" }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Verdict badge */}
      <div
        style={{
          display: "inline-block",
          padding: "var(--bru-space-1) var(--bru-space-3)",
          background: verdictColor(score.verdict),
          fontWeight: 700,
          fontSize: "var(--bru-text-sm)",
          textTransform: "uppercase",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        {score.verdict}
      </div>

      {/* Criteria breakdown */}
      <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
        <CriteriaRow
          label="Hook"
          score={criteria.hook.score}
          max={criteria.hook.max}
          feedback={criteria.hook.feedback}
        />
        <CriteriaRow
          label="Strategic Relevance"
          score={criteria.strategicRelevance.score}
          max={criteria.strategicRelevance.max}
          feedback={criteria.strategicRelevance.feedback}
        />
        <CriteriaRow
          label="Structure & Rhythm"
          score={criteria.structureRhythm.score}
          max={criteria.structureRhythm.max}
          feedback={criteria.structureRhythm.feedback}
        />
        <CriteriaRow
          label="Tone & Style"
          score={criteria.toneStyle.score}
          max={criteria.toneStyle.max}
          feedback={criteria.toneStyle.feedback}
        />
        <CriteriaRow
          label="Content Value"
          score={criteria.contentValue.score}
          max={criteria.contentValue.max}
          feedback={criteria.contentValue.feedback}
        />
        <CriteriaRow
          label="Conclusion & CTA"
          score={criteria.conclusionCTA.score}
          max={criteria.conclusionCTA.max}
          feedback={criteria.conclusionCTA.feedback}
        />
      </div>

      {/* Bonus/Penalty */}
      {criteria.bonusPenalty.score !== 0 && (
        <div
          style={{
            marginTop: "var(--bru-space-3)",
            padding: "var(--bru-space-2)",
            border: "var(--bru-border)",
            fontSize: "var(--bru-text-sm)",
          }}
        >
          <strong>
            Bonus/Penalty: {criteria.bonusPenalty.score > 0 ? "+" : ""}
            {criteria.bonusPenalty.score}
          </strong>
          <ul
            style={{
              margin: "var(--bru-space-1) 0 0",
              paddingLeft: "var(--bru-space-4)",
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
            }}
          >
            {criteria.bonusPenalty.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist score */}
      <div
        style={{
          marginTop: "var(--bru-space-3)",
          padding: "var(--bru-space-2)",
          border: "var(--bru-border)",
          fontSize: "var(--bru-text-sm)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Checklist Score</span>
        <strong>{score.checklistScore}/40</strong>
      </div>

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
        display: "grid",
        gridTemplateColumns: "140px 1fr 50px 150px",
        gap: "var(--bru-space-2)",
        alignItems: "center",
        fontSize: "var(--bru-text-sm)",
      }}
    >
      {/* Label column */}
      <span
        style={{
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
          height: 6,
          background: "var(--bru-border-color, #e0e0e0)",
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
          textAlign: "right",
          fontWeight: 700,
          color: scoreColor(score, max),
          fontSize: "var(--bru-text-xs)",
        }}
      >
        {score}/{max}
      </span>

      {/* Feedback column */}
      <span
        style={{
          fontSize: "var(--bru-text-xs)",
          color: "var(--bru-grey)",
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
