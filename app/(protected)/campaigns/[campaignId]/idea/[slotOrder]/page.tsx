"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Alert } from "@doctorproject/react";
import { IdeaStatusBadge } from "@/components/campaigns/IdeaStatusBadge";
import type { CampaignPostStatus } from "@/lib/knowledge/types";

interface TopicCard {
  headline: string;
  pillar: string;
  templateRecommendation?: string;
  angle?: string;
  decisionMistake?: string;
  reasoning?: string;
  hookCategoryRecommendation?: string;
  [key: string]: unknown;
}

interface IdeaPost {
  id: string;
  campaignId: string;
  slotOrder: number;
  slotDate: string;
  generationStatus: CampaignPostStatus;
  topicCard: TopicCard;
  postUuid?: string;
}

interface Props {
  params: Promise<{ campaignId: string; slotOrder: string }>;
}

const STATUS_ACTIONS: Record<
  CampaignPostStatus,
  {
    label: string;
    next: CampaignPostStatus;
    variant: "primary" | "danger" | "secondary";
  }[]
> = {
  waiting_review: [
    { label: "Validate", next: "validated", variant: "primary" },
    { label: "Reject", next: "rejected", variant: "danger" },
  ],
  validated: [
    { label: "Mark as Rejected", next: "rejected", variant: "danger" },
  ],
  rejected: [{ label: "Re-validate", next: "validated", variant: "primary" }],
  in_progress: [
    { label: "Mark as Published", next: "published", variant: "primary" },
  ],
  published: [],
};

export default function IdeaDetailPage({ params }: Props) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState("");
  const [idea, setIdea] = useState<IdeaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((cid: string, order: string) => {
    fetch(
      `/api/data/read/campaign_posts?campaign_id=${cid}&slot_order=${order}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.rows || data?.data || [];
        const row = rows[0];
        if (!row) {
          setError("Idea not found.");
          return;
        }
        setIdea({
          id: String(row.id),
          campaignId: String(row.campaign_id),
          slotOrder: Number(row.slot_order),
          slotDate: row.slot_date,
          generationStatus:
            (row.generation_status as CampaignPostStatus) || "waiting_review",
          topicCard: (() => {
            try {
              return JSON.parse(row.topic_card) as TopicCard;
            } catch {
              return { headline: "Untitled", pillar: "General" };
            }
          })(),
          postUuid: row.post_uuid || undefined,
        });
      })
      .catch(() => setError("Failed to load idea."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    params.then(({ campaignId: cid, slotOrder }) => {
      setCampaignId(cid);
      load(cid, slotOrder);
    });
  }, [params, load]);

  const handleStatusChange = async (newStatus: CampaignPostStatus) => {
    if (!idea) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/data/update/campaign_posts/${idea.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generation_status: newStatus }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      setIdea((prev) =>
        prev ? { ...prev, generationStatus: newStatus } : prev,
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleWritePost = () => {
    if (!idea) return;
    const params = new URLSearchParams({
      topicCard: JSON.stringify(idea.topicCard),
      campaignPostId: idea.id,
    });
    router.push(`/create?${params.toString()}`);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--drp-space-8)",
          color: "var(--drp-grey)",
        }}
      >
        Loading idea...
      </div>
    );
  }

  if (error && !idea) {
    return (
      <div style={{ padding: "var(--drp-space-6)" }}>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!idea) return null;

  const actions = STATUS_ACTIONS[idea.generationStatus] || [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--drp-space-3)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <button
          onClick={() => router.push(`/campaigns/${campaignId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--drp-text-md)",
            color: "var(--drp-grey)",
            padding: 0,
          }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "var(--drp-text-xs)",
              color: "var(--drp-grey)",
              marginBottom: 2,
            }}
          >
            {formatDate(idea.slotDate)} &middot; Slot {idea.slotOrder}
          </div>
          <h1
            style={{
              fontSize: "var(--drp-text-h3)",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {idea.topicCard.headline}
          </h1>
        </div>
        <IdeaStatusBadge status={idea.generationStatus} size="md" />
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: "var(--drp-space-3)" }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Topic card details */}
      <Card variant="raised" style={{ marginBottom: "var(--drp-space-4)" }}>
        <div style={{ display: "grid", gap: "var(--drp-space-3)" }}>
          <Field label="Pillar" value={idea.topicCard.pillar} />
          {idea.topicCard.angle && (
            <Field label="Angle" value={String(idea.topicCard.angle)} />
          )}
          {idea.topicCard.templateRecommendation && (
            <Field
              label="Template"
              value={idea.topicCard.templateRecommendation}
            />
          )}
          {idea.topicCard.hookCategoryRecommendation && (
            <Field
              label="Hook type"
              value={String(idea.topicCard.hookCategoryRecommendation)}
            />
          )}
          {idea.topicCard.decisionMistake && (
            <Field
              label="Decision / Mistake"
              value={String(idea.topicCard.decisionMistake)}
            />
          )}
          {idea.topicCard.reasoning && (
            <Field label="Reasoning" value={String(idea.topicCard.reasoning)} />
          )}
        </div>
      </Card>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "var(--drp-space-2)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Write this post — only for validated */}
        {idea.generationStatus === "validated" && (
          <button
            onClick={handleWritePost}
            disabled={saving}
            style={{
              padding: "var(--drp-space-2) var(--drp-space-4)",
              background: "var(--drp-black, #000)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "var(--drp-text-sm)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            Write this post →
          </button>
        )}

        {/* Status change buttons */}
        {actions.map((action) => (
          <button
            key={action.next}
            onClick={() => handleStatusChange(action.next)}
            disabled={saving}
            style={{
              padding: "var(--drp-space-2) var(--drp-space-4)",
              background:
                action.variant === "danger"
                  ? "#FFCCCC"
                  : action.variant === "primary"
                    ? "#0066CC"
                    : "transparent",
              color:
                action.variant === "danger"
                  ? "#990000"
                  : action.variant === "primary"
                    ? "#fff"
                    : "var(--drp-grey)",
              border:
                action.variant === "secondary" ? "var(--drp-border)" : "none",
              fontWeight: 600,
              fontSize: "var(--drp-text-sm)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--drp-text-xs)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--drp-grey)",
          letterSpacing: "0.05em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "var(--drp-text-sm)" }}>{value}</div>
    </div>
  );
}
