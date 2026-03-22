"use client";
import React, { useState } from "react";
import { Alert, Button, Card, Icon } from "@doctorproject/react";
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
    <Card variant="flat" style={{ padding: "var(--drp-space-3)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--drp-space-2)",
        }}
      >
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
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0 4px",
              background:
                proposal.status === "approved"
                  ? "var(--drp-success, #00AA00)"
                  : proposal.status === "rejected"
                    ? "var(--drp-error, #FF4444)"
                    : "var(--drp-purple)",
              color: "white",
            }}
          >
            {proposal.status}
          </span>
          <span style={{ fontSize: "var(--drp-text-sm)", fontWeight: 700 }}>
            {proposal.proposalType}
          </span>
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
            }}
          >
            Target: {proposal.targetDocument}
          </span>
        </div>
        <span
          style={{
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
          }}
        >
          Confidence: {Math.round(proposal.confidence * 100)}%
        </span>
      </div>

      {/* Reasoning */}
      <div
        style={{
          fontSize: "var(--drp-text-sm)",
          marginBottom: "var(--drp-space-2)",
        }}
      >
        {proposal.reasoning}
      </div>

      {/* Evidence */}
      <div
        style={{
          fontSize: "var(--drp-text-xs)",
          color: "var(--drp-grey)",
          marginBottom: "var(--drp-space-2)",
        }}
      >
        Based on {proposal.evidenceSignals.length} signal
        {proposal.evidenceSignals.length !== 1 ? "s" : ""}
      </div>

      {/* Diff toggle */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowDiff(!showDiff)}
        style={{
          fontSize: "var(--drp-text-xs)",
          marginBottom: showDiff ? "var(--drp-space-2)" : 0,
        }}
      >
        {showDiff ? "Hide diff" : "Show diff"}
      </Button>

      {showDiff && (
        <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
          <div>
            <div
              style={{
                fontSize: "var(--drp-text-xs)",
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--drp-error, #FF4444)",
              }}
            >
              Current
            </div>
            <pre
              style={{
                fontSize: "var(--drp-text-xs)",
                background: "rgba(255, 68, 68, 0.08)",
                padding: "var(--drp-space-2)",
                border: "var(--drp-border)",
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
                fontSize: "var(--drp-text-xs)",
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--drp-success, #00AA00)",
              }}
            >
              Proposed
            </div>
            <pre
              style={{
                fontSize: "var(--drp-text-xs)",
                background: "rgba(0, 170, 0, 0.08)",
                padding: "var(--drp-space-2)",
                border: "var(--drp-border)",
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
        <div style={{ marginTop: "var(--drp-space-2)" }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Actions (only for pending) */}
      {isPending && (
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            marginTop: "var(--drp-space-3)",
          }}
        >
          <Button
            type="button"
            variant="primary"
            disabled={updating}
            onClick={() => handleAction("approved")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <Icon name="check" size="sm" /> Approve
          </Button>
          <Button
            type="button"
            disabled={updating}
            onClick={() => handleAction("rejected")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <Icon name="close" size="sm" /> Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
