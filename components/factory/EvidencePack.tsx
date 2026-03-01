"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { EvidencePack as EvidencePackType } from "@/lib/knowledge/types";

interface EvidencePackProps {
  evidence: EvidencePackType;
}

export function EvidencePack({ evidence }: EvidencePackProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "claims",
  );

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="bru-card bru-card--raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Evidence Pack
      </h3>

      {/* Claims */}
      <Section
        title={`Claims & Data (${evidence.claims.length})`}
        isOpen={expandedSection === "claims"}
        onToggle={() => toggle("claims")}
      >
        {evidence.claims.map((c, i) => (
          <div
            key={`claim-${i}`}
            style={{
              padding: "var(--bru-space-2)",
              border: "var(--bru-border)",
              marginBottom: "var(--bru-space-2)",
              fontSize: "var(--bru-text-sm)",
            }}
          >
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
    </div>
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
