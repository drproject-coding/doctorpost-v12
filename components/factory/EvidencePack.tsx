"use client";
import React, { useState } from "react";
import { Button, Card } from "@bruddle/react";
import { ChevronDown, ChevronRight, ExternalLink, Filter } from "lucide-react";
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
          Evidence Pack
        </h3>
        <span
          style={{
            fontSize: "var(--bru-text-xs)",
            color: "var(--bru-grey)",
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
            gap: "var(--bru-space-2)",
            marginBottom: "var(--bru-space-3)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Filter size={12} style={{ color: "var(--bru-grey)" }} />
          {(["all", "verified", "estimate", "anecdotal"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setVerificationFilter(f)}
              style={{
                padding: "2px 8px",
                fontSize: "var(--bru-text-xs)",
                fontWeight: verificationFilter === f ? 700 : 400,
                background:
                  verificationFilter === f
                    ? "var(--bru-purple)"
                    : "transparent",
                color: verificationFilter === f ? "white" : "var(--bru-grey)",
                border: "1px solid var(--bru-border-color, #e0e0e0)",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
          <span style={{ marginLeft: "auto" }} />
          <button
            onClick={selectAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-purple)",
              textDecoration: "underline",
            }}
          >
            Select all
          </button>
          <button
            onClick={selectNone}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-grey)",
              textDecoration: "underline",
            }}
          >
            Clear
          </button>
          <button
            onClick={selectVerifiedOnly}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "var(--bru-text-xs)",
              color: "var(--bru-success-dark, #2d7a3a)",
              textDecoration: "underline",
            }}
          >
            Verified only
          </button>
        </div>

        {filteredClaims.map(({ claim: c, originalIndex: i }) => (
          <div
            key={`claim-${i}`}
            style={{
              padding: "var(--bru-space-2)",
              border: selectedClaims.has(i)
                ? "2px solid var(--bru-purple)"
                : "var(--bru-border)",
              marginBottom: "var(--bru-space-2)",
              fontSize: "var(--bru-text-sm)",
              opacity: selectedClaims.has(i) ? 1 : 0.5,
              cursor: "pointer",
            }}
            onClick={() => toggleClaim(i)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--bru-space-2)",
              }}
            >
              <input
                type="checkbox"
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
                    gap: "var(--bru-space-2)",
                    marginTop: "var(--bru-space-1)",
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
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
                        color: "var(--bru-purple)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                      Link
                    </a>
                  )}
                </div>
                {c.usageNote && (
                  <p
                    style={{
                      margin: "var(--bru-space-1) 0 0",
                      fontSize: "var(--bru-text-xs)",
                      fontStyle: "italic",
                      color: "var(--bru-grey)",
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
              padding: "var(--bru-space-2)",
              border: "var(--bru-border)",
              marginBottom: "var(--bru-space-2)",
              fontSize: "var(--bru-text-sm)",
            }}
          >
            <em>&ldquo;{v.quote}&rdquo;</em>
            <div
              style={{
                fontSize: "var(--bru-text-xs)",
                color: "var(--bru-grey)",
                marginTop: "var(--bru-space-1)",
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
              paddingLeft: "var(--bru-space-4)",
              fontSize: "var(--bru-text-sm)",
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
              paddingLeft: "var(--bru-space-4)",
              fontSize: "var(--bru-text-sm)",
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
    <div style={{ marginBottom: "var(--bru-space-3)" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bru-space-1)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "var(--bru-text-md)",
          padding: "var(--bru-space-1) 0",
          width: "100%",
          textAlign: "left",
          color: "inherit",
        }}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {isOpen && (
        <div style={{ marginTop: "var(--bru-space-2)" }}>{children}</div>
      )}
    </div>
  );
}
