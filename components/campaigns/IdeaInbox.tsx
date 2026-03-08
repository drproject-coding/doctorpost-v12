"use client";
import React, { useEffect, useState } from "react";
import { Card } from "@bruddle/react";
import { IdeaStatusBadge } from "./IdeaStatusBadge";
import type { CampaignPostStatus } from "@/lib/knowledge/types";

interface InboxIdea {
  id: string;
  campaignId: string;
  slotOrder: number;
  slotDate: string;
  generationStatus: CampaignPostStatus;
  topicCard: {
    headline: string;
    pillar: string;
    templateRecommendation?: string;
    angle?: string;
    hookCategoryRecommendation?: string;
    reasoning?: string;
    [key: string]: unknown;
  };
}

interface IdeaInboxProps {
  onSelect: (idea: InboxIdea) => void;
}

export function IdeaInbox({ onSelect }: IdeaInboxProps) {
  const [ideas, setIdeas] = useState<InboxIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/data/read/campaign_posts?generation_status=validated`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.rows || data?.data || [];
        setIdeas(
          rows
            .map((r: Record<string, string>) => ({
              id: String(r.id),
              campaignId: String(r.campaign_id),
              slotOrder: Number(r.slot_order),
              slotDate: r.slot_date,
              generationStatus:
                (r.generation_status as CampaignPostStatus) || "validated",
              topicCard: (() => {
                try {
                  return JSON.parse(r.topic_card);
                } catch {
                  return { headline: "Untitled", pillar: "General" };
                }
              })(),
            }))
            .sort(
              (a: InboxIdea, b: InboxIdea) =>
                (a.slotDate || "").localeCompare(b.slotDate || "") ||
                a.slotOrder - b.slotOrder,
            ),
        );
      })
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (ideas.length === 0) return null;

  return (
    <Card
      variant="flat"
      style={{ marginBottom: "var(--bru-space-4)", overflow: "hidden" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "var(--bru-space-3)",
          fontFamily: "var(--bru-font-primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-2)",
          }}
        >
          <span style={{ fontSize: "var(--bru-text-sm)", fontWeight: 700 }}>
            Campaign Ideas Ready to Write
          </span>
          <span
            style={{
              fontSize: "var(--bru-text-xs)",
              fontWeight: 700,
              background: "#0066CC",
              color: "#fff",
              padding: "1px 7px",
              borderRadius: 2,
            }}
          >
            {ideas.length}
          </span>
        </div>
        <span
          style={{ fontSize: "var(--bru-text-xs)", color: "var(--bru-grey)" }}
        >
          {open ? "▲ Hide" : "▼ Show"}
        </span>
      </button>

      {open && (
        <div
          style={{
            borderTop: "var(--bru-border)",
            display: "grid",
            gap: 1,
            background: "var(--bru-border-color, #e0e0e0)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {ideas.map((idea) => (
            <button
              key={idea.id}
              onClick={() => {
                onSelect(idea);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--bru-space-3)",
                padding: "var(--bru-space-3)",
                background: "var(--bru-bg, #fff)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--bru-font-primary)",
                width: "100%",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--bru-text-sm)",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 2,
                  }}
                >
                  {idea.topicCard.headline}
                </div>
                <div
                  style={{
                    fontSize: "var(--bru-text-xs)",
                    color: "var(--bru-grey)",
                    display: "flex",
                    gap: "var(--bru-space-2)",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    {idea.topicCard.pillar}
                  </span>
                  {idea.topicCard.templateRecommendation && (
                    <span>{idea.topicCard.templateRecommendation}</span>
                  )}
                  {idea.slotDate && (
                    <span>
                      {new Date(idea.slotDate + "T00:00:00").toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              </div>
              <IdeaStatusBadge status={idea.generationStatus} size="sm" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export type { InboxIdea };
