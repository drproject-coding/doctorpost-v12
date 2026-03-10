"use client";
import React from "react";

interface CampaignFiltersProps {
  pillars: string[];
  activePillar: string | null;
  onPillarClick: (pillar: string | null) => void;
}

export function CampaignFilters({
  pillars,
  activePillar,
  onPillarClick,
}: CampaignFiltersProps) {
  if (pillars.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--drp-space-2)",
        flexWrap: "wrap",
        marginBottom: "var(--drp-space-3)",
      }}
    >
      <span
        style={{
          fontSize: "var(--drp-text-xs)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--drp-grey)",
        }}
      >
        Pillar:
      </span>
      <button
        onClick={() => onPillarClick(null)}
        style={{
          padding: "2px 8px",
          fontSize: "var(--drp-text-xs)",
          fontWeight: activePillar === null ? 700 : 400,
          background:
            activePillar === null ? "var(--drp-black, #000)" : "transparent",
          color: activePillar === null ? "#fff" : "var(--drp-grey)",
          border: "var(--drp-border)",
          cursor: "pointer",
        }}
      >
        All
      </button>
      {pillars.map((p) => {
        const isActive = activePillar === p;
        return (
          <button
            key={p}
            onClick={() => onPillarClick(isActive ? null : p)}
            style={{
              padding: "2px 8px",
              fontSize: "var(--drp-text-xs)",
              fontWeight: isActive ? 700 : 400,
              background: isActive ? "var(--drp-black, #000)" : "transparent",
              color: isActive ? "#fff" : "var(--drp-grey)",
              border: "var(--drp-border)",
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
