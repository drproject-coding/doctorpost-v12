"use client";
import React from "react";
import { Card } from "@doctorproject/react";
import type { TopicProposal } from "@/lib/knowledge/types";
import type { StrategistOutput } from "@/lib/agents/strategist";

interface TopicProposalsProps {
  output: StrategistOutput;
  onSelect: (topic: TopicProposal) => void;
  selectedTopic?: TopicProposal;
}

export function TopicProposals({
  output,
  onSelect,
  selectedTopic,
}: TopicProposalsProps) {
  return (
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--drp-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--drp-space-2)",
        }}
      >
        Topic Proposals
      </h3>
      {output.pillarAssessment && (
        <p
          style={{
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-grey)",
            marginBottom: "var(--drp-space-4)",
          }}
        >
          {output.pillarAssessment}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: "var(--drp-space-3)",
        }}
      >
        {output.proposals.map((topic, idx) => {
          const isSelected =
            selectedTopic === topic ||
            selectedTopic?.headline === topic.headline;
          return (
            <Card
              key={`${idx}-${topic.headline}`}
              variant={isSelected ? "raised" : "flat"}
              style={{
                cursor: "pointer",
                border: isSelected
                  ? "2px solid var(--drp-purple)"
                  : "var(--drp-border)",
              }}
              onClick={() => onSelect(topic)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: "var(--drp-text-md)",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {topic.headline}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--drp-space-2)",
                      marginTop: "var(--drp-space-1)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--drp-text-xs)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "1px 6px",
                        background: "var(--drp-purple)",
                        color: "white",
                      }}
                    >
                      {topic.pillar}
                    </span>
                    {topic.templateRecommendation && (
                      <span
                        style={{
                          fontSize: "var(--drp-text-xs)",
                          color: "var(--drp-grey)",
                        }}
                      >
                        Template: {topic.templateRecommendation}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "var(--drp-text-sm)",
                      color: "var(--drp-grey)",
                      margin: "var(--drp-space-2) 0 0",
                    }}
                  >
                    {topic.angle}
                  </p>
                  {topic.reasoning && (
                    <p
                      style={{
                        fontSize: "var(--drp-text-xs)",
                        color: "var(--drp-grey)",
                        margin: "var(--drp-space-1) 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      {topic.reasoning}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <span style={{ color: "var(--drp-purple)", flexShrink: 0 }}>
                    ✓
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
