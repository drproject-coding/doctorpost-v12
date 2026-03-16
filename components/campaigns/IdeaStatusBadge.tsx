"use client";
import React from "react";
import type { CampaignPostStatus } from "@/lib/knowledge/types";

const STATUS_CONFIG: Record<
  CampaignPostStatus,
  { label: string; bg: string; color: string }
> = {
  waiting_review: { label: "Waiting review", bg: "#e0e0e0", color: "#444" },
  validated: { label: "Validated", bg: "#0066CC", color: "#fff" },
  rejected: { label: "Rejected", bg: "#FFCCCC", color: "#990000" },
  in_progress: { label: "In progress", bg: "#E85D04", color: "#fff" },
  published: { label: "Published", bg: "#00AA66", color: "#fff" },
};

interface IdeaStatusBadgeProps {
  status: CampaignPostStatus;
  size?: "sm" | "md";
}

export function IdeaStatusBadge({ status, size = "sm" }: IdeaStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.waiting_review;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "1px 6px" : "3px 10px",
        fontSize: size === "sm" ? "var(--drp-text-xs)" : "var(--drp-text-sm)",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 2,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
