"use client";
import React from "react";
import { Button } from "@doctorproject/react";
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
        gap: "var(--drp-space-3)",
        flexWrap: "wrap",
        marginBottom: "var(--drp-space-4)",
      }}
    >
      <Button
        variant={
          activeFilter === null || activeFilter === undefined
            ? "dark"
            : "ghost-bordered"
        }
        onClick={() => onFilterClick(null)}
      >
        All {total}
      </Button>
      {statuses.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const count = counts[s] || 0;
        if (count === 0) return null;
        const isActive = activeFilter === s;
        return (
          <Button
            key={s}
            variant="ghost-bordered"
            onClick={() => onFilterClick(isActive ? null : s)}
            style={{
              background: isActive ? cfg.bg : "transparent",
              color: isActive
                ? cfg.color
                : cfg.bg === "#e0e0e0"
                  ? "#444"
                  : cfg.bg,
              borderColor: cfg.bg === "#e0e0e0" ? "#ccc" : cfg.bg,
            }}
          >
            {cfg.label} {count}
          </Button>
        );
      })}
    </div>
  );
}
