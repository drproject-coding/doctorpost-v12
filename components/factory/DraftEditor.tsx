"use client";
import React from "react";
import { Card } from "@bruddle/react";
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

export function DraftEditor({
  writerOutput,
  guardrailResults,
  rewriteCount,
  onManualEdit,
  onAiFix,
  isFixing,
  guardrailRetryCount,
}: DraftEditorProps) {
  return (
    <Card variant="raised">
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
          Draft
        </h3>
        <div
          style={{
            display: "flex",
            gap: "var(--bru-space-2)",
            alignItems: "center",
          }}
        >
          {rewriteCount > 0 && (
            <span
              style={{
                fontSize: "var(--bru-text-xs)",
                color: "var(--bru-grey)",
              }}
            >
              Rewrite #{rewriteCount}
            </span>
          )}
          <span
            style={{
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
            }}
          >
            {writerOutput.content.length} chars
          </span>
        </div>
      </div>

      {/* Template info */}
      {writerOutput.template && (
        <div
          style={{
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-grey)",
            marginBottom: "var(--bru-space-2)",
          }}
        >
          Template: <strong>{writerOutput.template}</strong>
        </div>
      )}

      {/* Draft content */}
      <pre
        style={{
          fontSize: "var(--bru-text-sm)",
          background: "var(--bru-cream)",
          padding: "var(--bru-space-4)",
          border: "var(--bru-border)",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          lineHeight: 1.6,
          maxHeight: 500,
          overflow: "auto",
        }}
      >
        {writerOutput.content}
      </pre>

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
