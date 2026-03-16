"use client";
import React, { useState } from "react";
import { Button, Card, Checkbox } from "@doctorproject/react";
import type { EvidencePack as EvidencePackType } from "@/lib/knowledge/types";

type VerificationFilter = "all" | "verified" | "estimate" | "anecdotal";

interface EvidencePackProps {
  evidence: EvidencePackType;
  onSelectionChange?: (selectedIndices: number[]) => void;
}

export function EvidencePack({
  evidence,
  onSelectionChange,
}: EvidencePackProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "claims",
  );
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(
    () => new Set(evidence.claims.map((_, i) => i)),
  );
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  const filteredClaims = evidence.claims
    .map((c, i) => ({ claim: c, originalIndex: i }))
    .filter(
      ({ claim }) =>
        verificationFilter === "all" ||
        claim.verification === verificationFilter,
    );

  const toggleClaim = (index: number) => {
    setSelectedClaims((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(evidence.claims.map((_, i) => i));
    setSelectedClaims(all);
    onSelectionChange?.(Array.from(all));
  };

  const selectNone = () => {
    setSelectedClaims(new Set());
    onSelectionChange?.([]);
  };

  const selectVerifiedOnly = () => {
    const verified = new Set(
      evidence.claims
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.verification === "verified")
        .map(({ i }) => i),
    );
    setSelectedClaims(verified);
    onSelectionChange?.(Array.from(verified));
  };

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
          Evidence Pack
        </h3>
        <span
          style={{
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
          }}
        >
          Using {selectedClaims.size} of {evidence.claims.length} claims
        </span>
      </div>

      {/* Claims */}
      <Section
        title={`Claims & Data (${evidence.claims.length})`}
        isOpen={expandedSection === "claims"}
        onToggle={() => toggle("claims")}
      >
        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            marginBottom: "var(--drp-space-3)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--drp-grey)", fontSize: 12 }}>⊟</span>
          {(["all", "verified", "estimate", "anecdotal"] as const).map((f) => (
            <Button
              key={f}
              variant={verificationFilter === f ? "primary" : "ghost-bordered"}
              size="sm"
              onClick={() => setVerificationFilter(f)}
              style={{ textTransform: "capitalize" }}
            >
              {f}
            </Button>
          ))}
          <span style={{ marginLeft: "auto" }} />
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={selectVerifiedOnly}>
            Verified only
          </Button>
        </div>

        {filteredClaims.map(({ claim: c, originalIndex: i }) => (
          <div
            key={`claim-${i}`}
            style={{
              padding: "var(--drp-space-2)",
              border: selectedClaims.has(i)
                ? "2px solid var(--drp-purple)"
                : "var(--drp-border)",
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
              opacity: selectedClaims.has(i) ? 1 : 0.5,
              cursor: "pointer",
            }}
            onClick={() => toggleClaim(i)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--drp-space-2)",
              }}
            >
              <Checkbox
                label=""
                checked={selectedClaims.has(i)}
                onChange={() => toggleClaim(i)}
                onClick={(e) => e.stopPropagation()}
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{c.fact}</p>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--drp-space-2)",
                    marginTop: "var(--drp-space-1)",
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-grey)",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0 4px",
                      background:
                        c.verification === "verified"
                          ? "rgba(0, 170, 0, 0.15)"
                          : c.verification === "estimate"
                            ? "rgba(233, 215, 152, 0.3)"
                            : "rgba(255, 68, 68, 0.12)",
                    }}
                  >
                    {c.verification}
                  </span>
                  <span>{c.source}</span>
                  {c.sourceUrl && (
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        color: "var(--drp-purple)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↗ Link
                    </a>
                  )}
                </div>
                {c.usageNote && (
                  <p
                    style={{
                      margin: "var(--drp-space-1) 0 0",
                      fontSize: "var(--drp-text-xs)",
                      fontStyle: "italic",
                      color: "var(--drp-grey)",
                    }}
                  >
                    {c.usageNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Human Voices */}
      <Section
        title={`Human Voices (${evidence.humanVoices.length})`}
        isOpen={expandedSection === "voices"}
        onToggle={() => toggle("voices")}
      >
        {evidence.humanVoices.map((v, i) => (
          <div
            key={`voice-${i}`}
            style={{
              padding: "var(--drp-space-2)",
              border: "var(--drp-border)",
              marginBottom: "var(--drp-space-2)",
              fontSize: "var(--drp-text-sm)",
            }}
          >
            <em>&ldquo;{v.quote}&rdquo;</em>
            <div
              style={{
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
                marginTop: "var(--drp-space-1)",
              }}
            >
              {v.context} — Sentiment: {v.sentiment}
            </div>
          </div>
        ))}
      </Section>

      {/* Counter Arguments */}
      {evidence.counterArguments.length > 0 && (
        <Section
          title={`Counter Arguments (${evidence.counterArguments.length})`}
          isOpen={expandedSection === "counter"}
          onToggle={() => toggle("counter")}
        >
          <ul
            style={{
              paddingLeft: "var(--drp-space-4)",
              fontSize: "var(--drp-text-sm)",
              margin: 0,
            }}
          >
            {evidence.counterArguments.map((a, i) => (
              <li key={`counter-${i}`}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Fresh Angles */}
      {evidence.freshAngles.length > 0 && (
        <Section
          title={`Fresh Angles (${evidence.freshAngles.length})`}
          isOpen={expandedSection === "angles"}
          onToggle={() => toggle("angles")}
        >
          <ul
            style={{
              paddingLeft: "var(--drp-space-4)",
              fontSize: "var(--drp-text-sm)",
              margin: 0,
            }}
          >
            {evidence.freshAngles.map((a, i) => (
              <li key={`angle-${i}`}>{a}</li>
            ))}
          </ul>
        </Section>
      )}
    </Card>
  );
}

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "var(--drp-space-3)" }}>
      <Button
        variant="ghost"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--drp-space-1)",
          fontWeight: 700,
          fontSize: "var(--drp-text-md)",
          padding: "var(--drp-space-1) 0",
          width: "100%",
          textAlign: "left",
          color: "inherit",
        }}
      >
        {isOpen ? "▼" : "›"}
        {title}
      </Button>
      {isOpen && (
        <div style={{ marginTop: "var(--drp-space-2)" }}>{children}</div>
      )}
    </div>
  );
}
