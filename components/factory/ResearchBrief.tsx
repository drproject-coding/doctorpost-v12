"use client";
import React from "react";
import type { DiscoveryBrief, TopicProposal } from "@/lib/knowledge/types";

interface ResearchBriefProps {
  brief: DiscoveryBrief;
  refinedTopic?: TopicProposal;
}

export function ResearchBrief({ brief, refinedTopic }: ResearchBriefProps) {
  return (
    <div className="bru-card bru-card--raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Research Brief
      </h3>

      {refinedTopic && (
        <div
          style={{
            padding: "var(--bru-space-3)",
            background: "var(--bru-cream)",
            border: "var(--bru-border)",
            marginBottom: "var(--bru-space-4)",
          }}
        >
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              margin: "0 0 var(--bru-space-1)",
            }}
          >
            Refined Topic
          </h4>
          <p
            style={{
              fontSize: "var(--bru-text-sm)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {refinedTopic.headline}
          </p>
          <p
            style={{
              fontSize: "var(--bru-text-sm)",
              color: "var(--bru-grey)",
              margin: "var(--bru-space-1) 0 0",
            }}
          >
            {refinedTopic.angle}
          </p>
        </div>
      )}

      {/* Subtopic Angles */}
      {brief.subtopicAngles.length > 0 && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Subtopic Angles
          </h4>
          <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
            {brief.subtopicAngles.map((a, i) => (
              <div
                key={`angle-${i}`}
                style={{
                  padding: "var(--bru-space-2)",
                  border: "var(--bru-border)",
                  fontSize: "var(--bru-text-sm)",
                }}
              >
                <strong>{a.angle}</strong>
                <span
                  style={{
                    marginLeft: "var(--bru-space-2)",
                    color: "var(--bru-grey)",
                    fontSize: "var(--bru-text-xs)",
                  }}
                >
                  {a.source} — {a.relevance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pain Points */}
      {brief.painPoints.length > 0 && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Pain Points
          </h4>
          {brief.painPoints.map((p, i) => (
            <div
              key={`pain-${i}`}
              style={{
                padding: "var(--bru-space-2)",
                border: "var(--bru-border)",
                fontSize: "var(--bru-text-sm)",
                marginBottom: "var(--bru-space-2)",
              }}
            >
              <em>&ldquo;{p.quote}&rdquo;</em>
              <div
                style={{
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-grey)",
                  marginTop: "var(--bru-space-1)",
                }}
              >
                {p.source} — {p.context}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Debates */}
      {brief.currentDebates.length > 0 && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Current Debates
          </h4>
          <ul
            style={{
              paddingLeft: "var(--bru-space-4)",
              fontSize: "var(--bru-text-sm)",
              margin: 0,
            }}
          >
            {brief.currentDebates.map((d, i) => (
              <li key={`debate-${i}`}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions Asked */}
      {brief.questionsAsked.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: "var(--bru-text-md)",
              fontWeight: 700,
              marginBottom: "var(--bru-space-2)",
            }}
          >
            Questions People Are Asking
          </h4>
          <ul
            style={{
              paddingLeft: "var(--bru-space-4)",
              fontSize: "var(--bru-text-sm)",
              margin: 0,
            }}
          >
            {brief.questionsAsked.map((q, i) => (
              <li key={`question-${i}`}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
