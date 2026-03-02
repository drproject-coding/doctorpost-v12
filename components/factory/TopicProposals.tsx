"use client";
import React from "react";
import { Card } from "@bruddle/react";
import { Check } from "lucide-react";
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
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-2)",
        }}
      >
        Topic Proposals
      </h3>
      {output.pillarAssessment && (
        <p
          style={{
            fontSize: "var(--bru-text-sm)",
            color: "var(--bru-grey)",
            marginBottom: "var(--bru-space-4)",
          }}
        >
          {output.pillarAssessment}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: "var(--bru-space-3)",
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
                  ? "2px solid var(--bru-purple)"
                  : "var(--bru-border)",
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
                      fontSize: "var(--bru-text-md)",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {topic.headline}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--bru-space-2)",
                      marginTop: "var(--bru-space-1)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--bru-text-xs)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "1px 6px",
                        background: "var(--bru-purple)",
                        color: "white",
                      }}
                    >
                      {topic.pillar}
                    </span>
                    {topic.templateRecommendation && (
                      <span
                        style={{
                          fontSize: "var(--bru-text-xs)",
                          color: "var(--bru-grey)",
                        }}
                      >
                        Template: {topic.templateRecommendation}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "var(--bru-text-sm)",
                      color: "var(--bru-grey)",
                      margin: "var(--bru-space-2) 0 0",
                    }}
                  >
                    {topic.angle}
                  </p>
                  {topic.reasoning && (
                    <p
                      style={{
                        fontSize: "var(--bru-text-xs)",
                        color: "var(--bru-grey)",
                        margin: "var(--bru-space-1) 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      {topic.reasoning}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check
                    size={20}
                    style={{ color: "var(--bru-purple)", flexShrink: 0 }}
                  />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
