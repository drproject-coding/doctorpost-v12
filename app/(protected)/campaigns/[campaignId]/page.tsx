"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CampaignCalendar,
  type CalendarSlot,
} from "@/components/campaigns/CampaignCalendar";
import type { Campaign } from "@/lib/knowledge/types";

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default function CampaignDetailPage({ params }: Props) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState<string>("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ campaignId: id }) => {
      setCampaignId(id);
      Promise.all([
        fetch(`/api/data/read/campaigns/${id}`, {
          credentials: "include",
        }).then((r) => r.json()),
        fetch(
          `/api/data/read/campaign_posts?campaign_id=${id}&_sort=slot_order&_order=asc`,
          { credentials: "include" },
        ).then((r) => r.json()),
      ])
        .then(([campaignData, postsData]) => {
          const c = campaignData?.data || campaignData;
          if (c?.id) {
            const postsPerWeek = Number(c.posts_per_week) || 3;
            setCampaign({
              id: c.id,
              userId: c.user_id,
              name: c.name,
              durationWeeks: Number(c.duration_weeks),
              postsPerWeek,
              goals: c.goals,
              pillarWeights: (() => {
                try {
                  return JSON.parse(c.pillar_weights);
                } catch {
                  return {};
                }
              })(),
              status: c.status,
              createdAt: c.created_at,
            });

            const rows = postsData?.rows || postsData?.data || [];
            setSlots(
              rows.map((r: Record<string, string>) => ({
                id: r.id,
                weekNumber: Math.ceil(Number(r.slot_order) / postsPerWeek),
                slotOrder: Number(r.slot_order),
                slotDate: r.slot_date,
                generationStatus: r.generation_status || "waiting_review",
                topicCard: (() => {
                  try {
                    return JSON.parse(r.topic_card);
                  } catch {
                    return { headline: "Untitled", pillar: "General" };
                  }
                })(),
              })),
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--bru-space-8)",
          color: "var(--bru-grey)",
        }}
      >
        Loading campaign...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--bru-space-8)",
          color: "var(--bru-grey)",
        }}
      >
        Campaign not found.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bru-space-3)",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <button
          onClick={() => router.push("/campaigns")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--bru-text-md)",
            color: "var(--bru-grey)",
            padding: 0,
          }}
        >
          &larr;
        </button>
        <h1
          style={{ fontSize: "var(--bru-text-h3)", fontWeight: 700, margin: 0 }}
        >
          {campaign.name}
        </h1>
      </div>

      {slots.length > 0 ? (
        <CampaignCalendar
          slots={slots}
          durationWeeks={campaign.durationWeeks}
          postsPerWeek={campaign.postsPerWeek}
          campaignId={campaignId}
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "var(--bru-space-8)",
            color: "var(--bru-grey)",
          }}
        >
          No ideas found for this campaign.
        </div>
      )}
    </div>
  );
}
