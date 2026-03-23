"use client";
import React from "react";
import type { CampaignPostStatus } from "@/lib/knowledge/types";

const STATUS_CONFIG: Record<
  CampaignPostStatus,
  { label: string; bg: string; color: string }
> = {
  waiting_review: {
    label: "Waiting review",
    bg: "var(--drp-surface)",
    color: "var(--drp-text-primary)",
  },
  validated: {
    label: "Validated",
    bg: "var(--drp-purple)",
    color: "var(--drp-white)",
  },
  rejected: {
    label: "Rejected",
    bg: "rgba(255, 68, 68, 0.15)",
    color: "var(--drp-error)",
  },
  in_progress: {
    label: "In progress",
    bg: "var(--drp-orange)",
    color: "var(--drp-white)",
  },
  published: {
    label: "Published",
    bg: "var(--drp-success)",
    color: "var(--drp-white)",
  },
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
