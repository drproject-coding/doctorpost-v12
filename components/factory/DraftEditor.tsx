"use client";
import React, { useState, useMemo } from "react";
import { Card } from "@doctorproject/react";
import { Icon } from "@doctorproject/react";
import type { GuardrailResult } from "@/lib/knowledge/types";
import type { WriterOutput } from "@/lib/agents/writer";
import { GuardrailRecovery } from "./GuardrailRecovery";

interface DraftEditorProps {
  writerOutput: WriterOutput;
  guardrailResults?: GuardrailResult[];
  rewriteCount: number;
  onManualEdit?: (editedContent: string) => void;
  onAiFix?: (failedRules: GuardrailResult[]) => void;
  isFixing?: boolean;
  guardrailRetryCount?: number;
}

interface StructureSection {
  label: string;
  text: string;
  wordCount: number;
  color: string;
  bg: string;
}

const SECTION_STYLES: Record<string, { color: string; bg: string }> = {
  Hook: { color: "#7c3aed", bg: "rgba(124, 58, 237, 0.08)" },
  Problem: { color: "#dc2626", bg: "rgba(220, 38, 38, 0.06)" },
  Solution: { color: "#059669", bg: "rgba(5, 150, 105, 0.06)" },
  Body: { color: "#0369a1", bg: "rgba(3, 105, 161, 0.06)" },
  CTA: { color: "#d97706", bg: "rgba(217, 119, 6, 0.08)" },
};

function parseStructure(content: string): StructureSection[] {
  const lines = content.split("\n");
  const sections: StructureSection[] = [];

  if (lines.length === 0) return sections;

  // Hook: First paragraph (up to first double newline or first 3 lines)
  let hookEnd = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "" && i > 0) {
      hookEnd = i;
      break;
    }
    if (i >= 2) {
      hookEnd = i + 1;
      break;
    }
  }
  if (hookEnd === 0) hookEnd = Math.min(1, lines.length);

  const hookText = lines.slice(0, hookEnd).join("\n").trim();
  if (hookText) {
    sections.push({
      label: "Hook",
      text: hookText,
      wordCount: hookText.split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.Hook,
    });
  }

  // Skip blank lines after hook
  let cursor = hookEnd;
  while (cursor < lines.length && lines[cursor].trim() === "") cursor++;

  // Remaining content: split into body paragraphs
  const remaining = lines.slice(cursor);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of remaining) {
    if (line.trim() === "") {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join("\n"));
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
    }
  }
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join("\n"));
  }

  if (paragraphs.length === 0) return sections;

  // Last paragraph is CTA (if there are 3+ paragraphs)
  // Middle paragraphs are Body
  // If 2 paragraphs: first is Body, second is CTA
  if (paragraphs.length >= 3) {
    // First body paragraph might be Problem
    const firstBody = paragraphs[0].trim();
    sections.push({
      label: "Problem",
      text: firstBody,
      wordCount: firstBody.split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.Problem,
    });

    // Middle paragraphs are Solution/Body
    const middleParagraphs = paragraphs.slice(1, -1);
    const middleText = middleParagraphs.join("\n\n").trim();
    if (middleText) {
      sections.push({
        label: "Solution",
        text: middleText,
        wordCount: middleText.split(/\s+/).filter(Boolean).length,
        ...SECTION_STYLES.Solution,
      });
    }

    // Last paragraph is CTA
    const ctaText = paragraphs[paragraphs.length - 1].trim();
    sections.push({
      label: "CTA",
      text: ctaText,
      wordCount: ctaText.split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.CTA,
    });
  } else if (paragraphs.length === 2) {
    sections.push({
      label: "Body",
      text: paragraphs[0].trim(),
      wordCount: paragraphs[0].trim().split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.Body,
    });
    sections.push({
      label: "CTA",
      text: paragraphs[1].trim(),
      wordCount: paragraphs[1].trim().split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.CTA,
    });
  } else {
    sections.push({
      label: "Body",
      text: paragraphs[0].trim(),
      wordCount: paragraphs[0].trim().split(/\s+/).filter(Boolean).length,
      ...SECTION_STYLES.Body,
    });
  }

  return sections;
}

export function DraftEditor({
  writerOutput,
  guardrailResults,
  rewriteCount,
  onManualEdit,
  onAiFix,
  isFixing,
  guardrailRetryCount,
}: DraftEditorProps) {
  const [showStructure, setShowStructure] = useState(false);
  const sections = useMemo(
    () => parseStructure(writerOutput.content),
    [writerOutput.content],
  );
  const totalWords = writerOutput.content.split(/\s+/).filter(Boolean).length;

  return (
    <Card variant="raised">
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
          Draft
        </h3>
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            alignItems: "center",
          }}
        >
          {/* Structure toggle */}
          <button
            onClick={() => setShowStructure(!showStructure)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              fontSize: "var(--drp-text-xs)",
              background: showStructure ? "var(--drp-purple)" : "transparent",
              color: showStructure ? "white" : "var(--drp-grey)",
              border: "1px solid var(--drp-border-color, #e0e0e0)",
              cursor: "pointer",
            }}
          >
            {showStructure ? (
              <Icon name="download" size="sm" />
            ) : (
              <Icon name="download" size="sm" />
            )}
            {showStructure ? "Structure" : "Plain"}
          </button>
          {rewriteCount > 0 && (
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
              }}
            >
              Rewrite #{rewriteCount}
            </span>
          )}
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
            }}
          >
            {totalWords} words | {writerOutput.content.length} chars
          </span>
        </div>
      </div>

      {/* Template info */}
      {writerOutput.template && (
        <div
          style={{
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
            marginBottom: "var(--drp-space-2)",
          }}
        >
          Template: <strong>{writerOutput.template}</strong>
        </div>
      )}

      {showStructure ? (
        /* Structure-highlighted view */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px",
            gap: "var(--drp-space-3)",
          }}
        >
          {/* Content with structure markers */}
          <div
            style={{
              maxHeight: 500,
              overflow: "auto",
              border: "var(--drp-border)",
            }}
          >
            {sections.map((section, i) => (
              <div
                key={i}
                style={{
                  padding: "var(--drp-space-3)",
                  background: section.bg,
                  borderLeft: `3px solid ${section.color}`,
                  borderBottom:
                    i < sections.length - 1
                      ? "1px solid var(--drp-border-color, #e0e0e0)"
                      : "none",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--drp-text-xs)",
                    fontWeight: 700,
                    color: section.color,
                    marginBottom: "var(--drp-space-1)",
                    textTransform: "uppercase",
                  }}
                >
                  {section.label}
                </div>
                <pre
                  style={{
                    fontSize: "var(--drp-text-sm)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: "inherit",
                  }}
                >
                  {section.text}
                </pre>
              </div>
            ))}
          </div>

          {/* Side panel breakdown */}
          <div
            style={{
              border: "var(--drp-border)",
              padding: "var(--drp-space-2)",
              fontSize: "var(--drp-text-xs)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: "var(--drp-space-2)",
                fontSize: "var(--drp-text-sm)",
              }}
            >
              Structure
            </div>
            {sections.map((section, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--drp-space-1) 0",
                  borderBottom:
                    i < sections.length - 1
                      ? "1px solid var(--drp-border-color, #e0e0e0)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: section.color,
                  }}
                >
                  {section.label}
                </span>
                <span style={{ color: "var(--drp-grey)" }}>
                  {section.wordCount}w
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: "var(--drp-space-2)",
                paddingTop: "var(--drp-space-2)",
                borderTop: "2px solid var(--drp-border-color, #e0e0e0)",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{totalWords}w</span>
            </div>
          </div>
        </div>
      ) : (
        /* Plain text view */
        <pre
          style={{
            fontSize: "var(--drp-text-sm)",
            background: "var(--drp-cream)",
            padding: "var(--drp-space-4)",
            border: "var(--drp-border)",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            lineHeight: 1.6,
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          {writerOutput.content}
        </pre>
      )}

      {/* Guardrail Results with Recovery Actions */}
      {guardrailResults && guardrailResults.length > 0 && (
        <GuardrailRecovery
          guardrailResults={guardrailResults}
          draftContent={writerOutput.content}
          onManualEdit={onManualEdit ?? (() => {})}
          onAiFix={onAiFix ?? (() => {})}
          isFixing={isFixing}
          retryCount={guardrailRetryCount}
        />
      )}
    </Card>
  );
}
