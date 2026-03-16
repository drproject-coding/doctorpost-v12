"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Loader } from "@doctorproject/react";
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
        fetch(`/api/data/read/campaign_posts?campaign_id=${id}`, {
          credentials: "include",
        }).then((r) => r.json()),
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
              rows
                .map((r: Record<string, string>) => ({
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
                }))
                .sort(
                  (a: { slotOrder: number }, b: { slotOrder: number }) =>
                    a.slotOrder - b.slotOrder,
                ),
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
          display: "flex",
          justifyContent: "center",
          padding: "var(--drp-space-8)",
        }}
      >
        <Loader label="Loading campaign..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ padding: "var(--drp-space-8)" }}>
        <EmptyState
          title="Campaign not found"
          description="This campaign could not be found."
        />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--drp-space-3)",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <Button variant="ghost" onClick={() => router.push("/campaigns")}>
          &larr;
        </Button>
        <h1
          style={{ fontSize: "var(--drp-text-h3)", fontWeight: 700, margin: 0 }}
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
        <EmptyState
          title="No ideas found"
          description="No content ideas were found for this campaign."
        />
      )}
    </div>
  );
}
