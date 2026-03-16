"use client";
import React from "react";
import { Button } from "@doctorproject/react";

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
      <Button
        variant={activePillar === null ? "dark" : "ghost-bordered"}
        size="sm"
        onClick={() => onPillarClick(null)}
      >
        All
      </Button>
      {pillars.map((p) => {
        const isActive = activePillar === p;
        return (
          <Button
            key={p}
            variant={isActive ? "dark" : "ghost-bordered"}
            size="sm"
            onClick={() => onPillarClick(isActive ? null : p)}
          >
            {p}
          </Button>
        );
      })}
    </div>
  );
}
