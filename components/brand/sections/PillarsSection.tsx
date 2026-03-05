"use client";
import React from "react";
import { enhancedContentPillars } from "@/lib/dropdownData";

interface PillarsSectionProps {
  editing: boolean;
}

const MINT = "#98E9AB";
const CREAM = "#F2F2F2";

const PillarsSection: React.FC<PillarsSectionProps> = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px",
      }}
    >
      {enhancedContentPillars.map((pillar) => {
        const isHighPerformance = pillar.performanceIndicator === "high";
        const backgroundColor = isHighPerformance ? `${MINT}33` : CREAM;

        return (
          <div
            key={pillar.id}
            style={{
              backgroundColor,
              border: isHighPerformance
                ? `1px solid ${MINT}`
                : "1px solid rgba(0,0,0,0.10)",
              borderRadius: 0,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {/* Label row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--bru-font-primary)",
                  fontWeight: "var(--bru-weight-heavy)",
                  fontSize: "var(--bru-text-sm)",
                  color: "var(--bru-black)",
                  lineHeight: 1.3,
                }}
              >
                {pillar.label}
              </span>
              {pillar.isTrending && (
                <span
                  style={{ fontSize: "13px", lineHeight: 1 }}
                  title="Trending"
                  aria-label="Trending"
                >
                  🔥
                </span>
              )}
            </div>

            {/* Category badge */}
            <span
              style={{
                display: "inline-block",
                backgroundColor: "rgba(0,0,0,0.07)",
                color: "var(--bru-black)",
                padding: "1px 7px",
                fontSize: "var(--bru-text-xs)",
                fontFamily: "var(--bru-font-primary)",
                fontWeight: "500",
                letterSpacing: "var(--bru-tracking-caps)",
                textTransform: "uppercase" as const,
                alignSelf: "flex-start",
              }}
            >
              {pillar.category}
            </span>

            {/* Description */}
            {pillar.description && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--bru-font-primary)",
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-muted, #666)",
                  lineHeight: 1.5,
                }}
              >
                {pillar.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PillarsSection;
