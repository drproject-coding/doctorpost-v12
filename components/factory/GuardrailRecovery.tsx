"use client";
import React, { useState } from "react";
import { Button } from "@doctorproject/react";
import { Edit3, Wand2, RotateCcw } from "lucide-react";
import type { GuardrailResult } from "@/lib/knowledge/types";

interface GuardrailRecoveryProps {
  guardrailResults: GuardrailResult[];
  draftContent: string;
  onManualEdit: (editedContent: string) => void;
  onAiFix: (failedRules: GuardrailResult[]) => void;
  isFixing?: boolean;
  retryCount?: number;
}

export function GuardrailRecovery({
  guardrailResults,
  draftContent,
  onManualEdit,
  onAiFix,
  isFixing = false,
  retryCount = 0,
}: GuardrailRecoveryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(draftContent);
  const failedRules = guardrailResults.filter((r) => !r.passed);
  const passedRules = guardrailResults.filter((r) => r.passed);
  const allPassed = failedRules.length === 0;
  const maxRetries = 3;

  if (allPassed) {
    return (
      <div
        style={{
          padding: "var(--drp-space-3)",
          background: "rgba(0, 170, 0, 0.08)",
          border: "2px solid rgba(0, 170, 0, 0.3)",
          fontSize: "var(--drp-text-sm)",
        }}
      >
        <strong style={{ color: "var(--drp-success-dark, #2d7a3a)" }}>
          All guardrails passed!
        </strong>{" "}
        Proceeding to scoring.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "var(--drp-space-3)" }}>
      <h4
        style={{
          fontSize: "var(--drp-text-md)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-2)",
        }}
      >
        Guardrail Checks
      </h4>

      {/* Results list */}
      <div style={{ display: "grid", gap: "var(--drp-space-1)" }}>
        {guardrailResults.map((r) => (
          <div
            key={r.rule}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              padding: "var(--drp-space-1) var(--drp-space-2)",
              background: r.passed
                ? "rgba(0, 170, 0, 0.08)"
                : "rgba(255, 68, 68, 0.08)",
            }}
          >
            <span>{r.passed ? "\u2713" : "\u2717"}</span>
            <span style={{ fontWeight: 500 }}>{r.rule}</span>
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
              }}
            >
              {r.source}
            </span>
            {r.detail && (
              <span
                style={{
                  fontSize: "var(--drp-text-xs)",
                  color: "var(--drp-grey)",
                  marginLeft: "auto",
                }}
              >
                {r.detail}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Failure summary + actions */}
      <div
        style={{
          marginTop: "var(--drp-space-3)",
          padding: "var(--drp-space-3)",
          background: "rgba(255, 68, 68, 0.08)",
          border: "2px solid rgba(255, 68, 68, 0.2)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-error-dark, #c0392b)",
            marginBottom: "var(--drp-space-2)",
          }}
        >
          {failedRules.length} rule{failedRules.length !== 1 ? "s" : ""} failed
          {retryCount > 0 && (
            <span
              style={{
                fontWeight: 400,
                marginLeft: "var(--drp-space-2)",
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
              }}
            >
              (Attempt {retryCount}/{maxRetries})
            </span>
          )}
        </div>

        {/* Failed rules detail */}
        <ul
          style={{
            margin: "0 0 var(--drp-space-3) 0",
            paddingLeft: "var(--drp-space-4)",
            fontSize: "var(--drp-text-sm)",
          }}
        >
          {failedRules.map((r) => (
            <li key={r.rule}>
              <strong>{r.rule}</strong>
              {r.detail && <span> — {r.detail}</span>}
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              border: isEditing ? "2px solid var(--drp-purple)" : undefined,
            }}
          >
            <Edit3 size={14} />
            Manual Edit
          </Button>

          {retryCount < maxRetries && (
            <Button
              variant="primary"
              onClick={() => onAiFix(failedRules)}
              disabled={isFixing}
            >
              {isFixing ? (
                <RotateCcw size={14} className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              {isFixing ? "Fixing..." : "Fix with AI"}
            </Button>
          )}

          {retryCount >= maxRetries && (
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
                alignSelf: "center",
              }}
            >
              Max AI retries reached. Please edit manually.
            </span>
          )}
        </div>
      </div>

      {/* Manual edit area */}
      {isEditing && (
        <div style={{ marginTop: "var(--drp-space-3)" }}>
          <textarea
            className="drp-input"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: 300,
              fontFamily: "monospace",
              fontSize: "var(--drp-text-sm)",
              lineHeight: 1.6,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--drp-space-2)",
            }}
          >
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
              }}
            >
              {editedContent.split(/\s+/).length} words | {editedContent.length}{" "}
              chars
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onManualEdit(editedContent);
                setIsEditing(false);
              }}
            >
              Save & Re-check
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
