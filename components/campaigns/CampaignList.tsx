"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@doctorproject/react";
import type { Campaign } from "@/lib/knowledge/types";

interface CampaignListProps {
  onSelect: (campaign: Campaign) => void;
  onNewCampaign: () => void;
}

export function CampaignList({ onSelect, onNewCampaign }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/read/campaigns", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.rows || data?.data || [];
        setCampaigns(
          rows
            .map((r: Record<string, string>) => ({
              id: r.id,
              userId: r.user_id,
              name: r.name,
              durationWeeks: Number(r.duration_weeks),
              postsPerWeek: Number(r.posts_per_week),
              goals: r.goals,
              pillarWeights: (() => {
                try {
                  return JSON.parse(r.pillar_weights);
                } catch {
                  return {};
                }
              })(),
              status: r.status,
              createdAt: r.created_at,
            }))
            .sort((a: Campaign, b: Campaign) => Number(b.id) - Number(a.id)),
        );
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--drp-space-6)",
          color: "var(--drp-grey)",
        }}
      >
        Loading campaigns...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card
        variant="raised"
        style={{ textAlign: "center", padding: "var(--drp-space-8)" }}
      >
        <p
          style={{
            fontSize: "var(--drp-text-md)",
            color: "var(--drp-grey)",
            marginBottom: "var(--drp-space-4)",
          }}
        >
          No campaigns yet. Create your first one to start brainstorming content
          ideas.
        </p>
        <button
          onClick={onNewCampaign}
          style={{
            padding: "var(--drp-space-2) var(--drp-space-4)",
            background: "var(--drp-black, #000)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: "var(--drp-text-sm)",
            cursor: "pointer",
          }}
        >
          NEW CAMPAIGN
        </button>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--drp-space-3)" }}>
      {campaigns.map((c) => (
        <Card
          key={c.id}
          variant="flat"
          style={{ padding: "var(--drp-space-3)", cursor: "pointer" }}
          onClick={() => onSelect(c)}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "var(--drp-text-md)" }}>
                {c.name}
              </div>
              <div
                style={{
                  fontSize: "var(--drp-text-xs)",
                  color: "var(--drp-grey)",
                  marginTop: 2,
                }}
              >
                {c.durationWeeks}w &middot; {c.postsPerWeek}/week &middot;{" "}
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
              </div>
            </div>
            <span
              style={{
                fontSize: "var(--drp-text-xs)",
                fontWeight: 600,
                padding: "2px 8px",
                background: c.status === "planning" ? "#E85D04" : "#00AA66",
                color: "#fff",
                borderRadius: 2,
              }}
            >
              {c.status}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
