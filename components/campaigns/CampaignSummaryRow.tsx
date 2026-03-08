"use client";
import React from "react";
import type { CampaignPostStatus } from "@/lib/knowledge/types";
import { STATUS_CONFIG } from "./IdeaStatusBadge";

interface CampaignSummaryRowProps {
  counts: Record<CampaignPostStatus, number>;
  total: number;
  activeFilter?: CampaignPostStatus | null;
  onFilterClick: (status: CampaignPostStatus | null) => void;
}

export function CampaignSummaryRow({
  counts,
  total,
  activeFilter,
  onFilterClick,
}: CampaignSummaryRowProps) {
  const statuses: CampaignPostStatus[] = [
    "waiting_review",
    "validated",
    "rejected",
    "in_progress",
    "published",
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--bru-space-3)",
        flexWrap: "wrap",
        marginBottom: "var(--bru-space-4)",
      }}
    >
      <button
        onClick={() => onFilterClick(null)}
        style={{
          padding: "4px 12px",
          fontSize: "var(--bru-text-sm)",
          fontWeight:
            activeFilter === null || activeFilter === undefined ? 700 : 500,
          background:
            activeFilter === null || activeFilter === undefined
              ? "var(--bru-black, #000)"
              : "transparent",
          color:
            activeFilter === null || activeFilter === undefined
              ? "#fff"
              : "var(--bru-grey)",
          border: "var(--bru-border)",
          cursor: "pointer",
        }}
      >
        All {total}
      </button>
      {statuses.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const count = counts[s] || 0;
        if (count === 0) return null;
        const isActive = activeFilter === s;
        return (
          <button
            key={s}
            onClick={() => onFilterClick(isActive ? null : s)}
            style={{
              padding: "4px 12px",
              fontSize: "var(--bru-text-sm)",
              fontWeight: isActive ? 700 : 500,
              background: isActive ? cfg.bg : "transparent",
              color: isActive
                ? cfg.color
                : cfg.bg === "#e0e0e0"
                  ? "#444"
                  : cfg.bg,
              border: `1px solid ${cfg.bg === "#e0e0e0" ? "#ccc" : cfg.bg}`,
              cursor: "pointer",
            }}
          >
            {cfg.label} {count}
          </button>
        );
      })}
    </div>
  );
}
