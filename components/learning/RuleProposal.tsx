"use client";
import React, { useState } from "react";
import { Check, X } from "lucide-react";
import type { RuleProposal, ProposalStatus } from "@/lib/knowledge/types";

interface RuleProposalCardProps {
  proposal: RuleProposal;
  onUpdateStatus: (id: string, status: ProposalStatus) => Promise<void>;
}

export function RuleProposalCard({
  proposal,
  onUpdateStatus,
}: RuleProposalCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (status: ProposalStatus) => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdateStatus(proposal.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const isPending = proposal.status === "pending";

  return (
    <div
      className="bru-card bru-card--flat"
      style={{ padding: "var(--bru-space-3)" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--bru-text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0 4px",
              background:
                proposal.status === "approved"
                  ? "var(--bru-success, #2ecc71)"
                  : proposal.status === "rejected"
                    ? "var(--bru-error, #e74c3c)"
                    : "var(--bru-purple)",
              color: "white",
            }}
          >
            {proposal.status}
          </span>
          <span style={{ fontSize: "var(--bru-text-sm)", fontWeight: 700 }}>
            {proposal.proposalType}
          </span>
          <span
            style={{
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
            }}
          >
            Target: {proposal.targetDocument}
          </span>
        </div>
        <span
          style={{
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-grey)",
          }}
        >
          Confidence: {Math.round(proposal.confidence * 100)}%
        </span>
      </div>

      {/* Reasoning */}
      <div
        style={{
          fontSize: "var(--bru-text-sm)",
          marginBottom: "var(--bru-space-2)",
        }}
      >
        {proposal.reasoning}
      </div>

      {/* Evidence */}
      <div
        style={{
          fontSize: "var(--bru-text-xs)",
          color: "var(--bru-grey)",
          marginBottom: "var(--bru-space-2)",
        }}
      >
        Based on {proposal.evidenceSignals.length} signal
        {proposal.evidenceSignals.length !== 1 ? "s" : ""}
      </div>

      {/* Diff toggle */}
      <button
        type="button"
        className="bru-btn bru-btn--ghost"
        onClick={() => setShowDiff(!showDiff)}
        style={{
          fontSize: "var(--bru-text-xs)",
          marginBottom: showDiff ? "var(--bru-space-2)" : 0,
        }}
      >
        {showDiff ? "Hide diff" : "Show diff"}
      </button>

      {showDiff && (
        <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
          <div>
            <div
              style={{
                fontSize: "var(--bru-text-xs)",
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--bru-error, #e74c3c)",
              }}
            >
              Current
            </div>
            <pre
              style={{
                fontSize: "var(--bru-text-xs)",
                background: "rgba(233, 152, 152, 0.1)",
                padding: "var(--bru-space-2)",
                border: "var(--bru-border)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {proposal.currentContent || "(empty)"}
            </pre>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--bru-text-xs)",
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--bru-success, #2ecc71)",
              }}
            >
              Proposed
            </div>
            <pre
              style={{
                fontSize: "var(--bru-text-xs)",
                background: "rgba(46, 204, 113, 0.1)",
                padding: "var(--bru-space-2)",
                border: "var(--bru-border)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {proposal.proposedContent}
            </pre>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "var(--bru-space-2)",
            background: "rgba(233, 152, 152, 0.2)",
            border: "var(--bru-border)",
            color: "var(--bru-error-dark)",
            fontSize: "var(--bru-text-xs)",
            marginTop: "var(--bru-space-2)",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions (only for pending) */}
      {isPending && (
        <div
          style={{
            display: "flex",
            gap: "var(--bru-space-2)",
            marginTop: "var(--bru-space-3)",
          }}
        >
          <button
            type="button"
            className="bru-btn bru-btn--primary"
            disabled={updating}
            onClick={() => handleAction("approved")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--bru-text-sm)",
            }}
          >
            <Check size={14} /> Approve
          </button>
          <button
            type="button"
            className="bru-btn"
            disabled={updating}
            onClick={() => handleAction("rejected")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--bru-text-sm)",
            }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
