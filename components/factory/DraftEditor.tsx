"use client";
import React from "react";
import type { GuardrailResult } from "@/lib/knowledge/types";
import type { WriterOutput } from "@/lib/agents/writer";

interface DraftEditorProps {
  writerOutput: WriterOutput;
  guardrailResults?: GuardrailResult[];
  rewriteCount: number;
}

export function DraftEditor({
  writerOutput,
  guardrailResults,
  rewriteCount,
}: DraftEditorProps) {
  const failedRules = guardrailResults?.filter((r) => !r.passed) || [];

  return (
    <div className="bru-card bru-card--raised">
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

      {/* Guardrail Results */}
      {guardrailResults && guardrailResults.length > 0 && (
        <div style={{ marginTop: "var(--bru-space-3)" }}>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Guardrail Checks
          </h4>
          <div style={{ display: "grid", gap: "var(--bru-space-1)" }}>
            {guardrailResults.map((r) => (
              <div
                key={r.rule}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--bru-space-2)",
                  fontSize: "var(--bru-text-sm)",
                  padding: "var(--bru-space-1) var(--bru-space-2)",
                  background: r.passed
                    ? "rgba(0, 170, 0, 0.08)"
                    : "rgba(255, 68, 68, 0.08)",
                }}
              >
                <span>{r.passed ? "\u2713" : "\u2717"}</span>
                <span style={{ fontWeight: 500 }}>{r.rule}</span>
                <span
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                  }}
                >
                  {r.source}
                </span>
                {r.detail && (
                  <span
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      color: "var(--bru-grey)",
                      marginLeft: "auto",
                    }}
                  >
                    {r.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
          {failedRules.length > 0 && (
            <div
              style={{
                marginTop: "var(--bru-space-2)",
                padding: "var(--bru-space-2)",
                background: "rgba(255, 68, 68, 0.12)",
                fontSize: "var(--bru-text-xs)",
                fontWeight: 500,
                color: "var(--bru-error-dark)",
              }}
            >
              {failedRules.length} rule{failedRules.length !== 1 ? "s" : ""}{" "}
              failed
            </div>
          )}
        </div>
      )}
    </div>
  );
}
