"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Button,
  Container,
  EmptyState,
  Heading,
  Loader,
  Tabs,
} from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";
import { SignalCounts } from "@/components/learning/SignalCounts";
import { PatternList } from "@/components/learning/PatternList";
import { RuleProposalCard } from "@/components/learning/RuleProposal";
import { FeedbackHistory } from "@/components/learning/FeedbackHistory";
import type {
  Signal,
  NcbSignalRow,
  RuleProposal,
  NcbRuleProposalRow,
  ProposalStatus,
} from "@/lib/knowledge/types";
import {
  mapSignalFromNcb,
  mapRuleProposalFromNcb,
} from "@/lib/knowledge/types";

type Tab = "overview" | "proposals" | "history";

export default function LearningPage() {
  useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [proposals, setProposals] = useState<RuleProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sigRes, propRes] = await Promise.all([
        fetch("/api/knowledge/read/signals", { credentials: "include" }),
        fetch("/api/knowledge/read/rule_proposals", { credentials: "include" }),
      ]);

      if (sigRes.ok) {
        const data = await sigRes.json();
        const rows: NcbSignalRow[] = Array.isArray(data)
          ? data
          : data.data || data.rows || [];
        setSignals(rows.map(mapSignalFromNcb));
      } else if (sigRes.status !== 404) {
        setError(`Failed to load signals (${sigRes.status})`);
      }

      if (propRes.ok) {
        const data = await propRes.json();
        const rows: NcbRuleProposalRow[] = Array.isArray(data)
          ? data
          : data.data || data.rows || [];
        setProposals(rows.map(mapRuleProposalFromNcb));
      } else if (propRes.status !== 404) {
        setError((prev) =>
          prev
            ? `${prev} Failed to load proposals (${propRes.status})`
            : `Failed to load proposals (${propRes.status})`,
        );
      }
    } catch {
      setError("Failed to load learning data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProposalStatus = async (
    id: string,
    status: ProposalStatus,
  ) => {
    const res = await fetch(`/api/knowledge/update/rule_proposals/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error("Failed to update proposal status");
    }

    const data = await res.json();
    const updated = mapRuleProposalFromNcb(data as NcbRuleProposalRow);
    setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const resolvedProposals = proposals.filter((p) => p.status !== "pending");

  return (
    <Container>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <Heading level={1}>Learning</Heading>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          {loading ? <Loader size="sm" label="Loading..." /> : "Refresh"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: "var(--drp-space-4)" }}>
        <Tabs
          items={[
            { key: "overview", label: "Overview" },
            {
              key: "proposals",
              label:
                pendingProposals.length > 0
                  ? `Rule Proposals (${pendingProposals.length})`
                  : "Rule Proposals",
            },
            { key: "history", label: "Feedback History" },
          ]}
          activeKey={tab}
          onChange={(key) => setTab(key as Tab)}
        />
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
          <SignalCounts signals={signals} />
          <PatternList signals={signals} />
        </div>
      )}

      {tab === "proposals" && (
        <div style={{ display: "grid", gap: "var(--drp-space-4)" }}>
          {pendingProposals.length > 0 && (
            <div>
              <Heading level={3}>Pending ({pendingProposals.length})</Heading>
              <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
                {pendingProposals.map((p) => (
                  <RuleProposalCard
                    key={p.id}
                    proposal={p}
                    onUpdateStatus={handleUpdateProposalStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {resolvedProposals.length > 0 && (
            <div>
              <Heading level={3}>Resolved ({resolvedProposals.length})</Heading>
              <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
                {resolvedProposals.map((p) => (
                  <RuleProposalCard
                    key={p.id}
                    proposal={p}
                    onUpdateStatus={handleUpdateProposalStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {proposals.length === 0 && (
            <EmptyState
              icon="💡"
              title="No rule proposals yet"
              description="Proposals are created when the learning agent detects patterns that have reached the 10-signal threshold."
            />
          )}
        </div>
      )}

      {tab === "history" && <FeedbackHistory signals={signals} />}
    </Container>
  );
}
