"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@bruddle/react";
import type { CampaignPostStatus } from "@/lib/knowledge/types";
import { IdeaStatusBadge } from "./IdeaStatusBadge";
import { CampaignSummaryRow } from "./CampaignSummaryRow";
import { CampaignFilters } from "./CampaignFilters";
import { CampaignAnalytics } from "./CampaignAnalytics";

export interface CalendarSlot {
  id?: string;
  weekNumber: number;
  slotOrder: number;
  slotDate: string;
  generationStatus?: CampaignPostStatus;
  topicCard: {
    headline: string;
    pillar: string;
    templateRecommendation?: string;
    [key: string]: unknown;
  };
}

interface CampaignCalendarProps {
  slots: CalendarSlot[];
  durationWeeks: number;
  postsPerWeek: number;
  campaignId?: string;
}

const PILLAR_COLORS: Record<string, { bg: string; text: string }> = {};
const COLOR_PALETTE = [
  { bg: "#6B4FFF", text: "#fff" },
  { bg: "#0066CC", text: "#fff" },
  { bg: "#00AA66", text: "#fff" },
  { bg: "#E85D04", text: "#fff" },
  { bg: "#CC0044", text: "#fff" },
  { bg: "#008899", text: "#fff" },
  { bg: "#7700BB", text: "#fff" },
  { bg: "#AA5500", text: "#fff" },
];
let colorIndex = 0;

function getPillarColor(pillar: string) {
  if (!PILLAR_COLORS[pillar]) {
    PILLAR_COLORS[pillar] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
    colorIndex++;
  }
  return PILLAR_COLORS[pillar];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function CampaignCalendar({
  slots,
  durationWeeks,
  postsPerWeek,
  campaignId,
}: CampaignCalendarProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<CampaignPostStatus | null>(
    null,
  );
  const [pillarFilter, setPillarFilter] = useState<string | null>(null);

  // Compute counts and pillars
  const statusCounts = useMemo(() => {
    const counts: Record<CampaignPostStatus, number> = {
      waiting_review: 0,
      validated: 0,
      rejected: 0,
      in_progress: 0,
      published: 0,
    };
    for (const s of slots) {
      const st = s.generationStatus || "waiting_review";
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [slots]);

  const pillars = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) set.add(s.topicCard.pillar);
    return Array.from(set);
  }, [slots]);

  // Filter slots
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (
        statusFilter &&
        (s.generationStatus || "waiting_review") !== statusFilter
      )
        return false;
      if (pillarFilter && s.topicCard.pillar !== pillarFilter) return false;
      return true;
    });
  }, [slots, statusFilter, pillarFilter]);

  const filteredSet = useMemo(() => new Set(filteredSlots), [filteredSlots]);

  // Group by week
  const weeks: CalendarSlot[][] = [];
  for (let w = 1; w <= durationWeeks; w++) {
    weeks.push(slots.filter((s) => s.weekNumber === w));
  }

  const handleCardClick = (slot: CalendarSlot) => {
    if (campaignId && slot.slotOrder) {
      router.push(`/campaigns/${campaignId}/idea/${slot.slotOrder}`);
    }
  };

  return (
    <Card variant="raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-3)",
        }}
      >
        Campaign Calendar
      </h3>

      <CampaignSummaryRow
        counts={statusCounts}
        total={slots.length}
        activeFilter={statusFilter}
        onFilterClick={setStatusFilter}
      />

      <CampaignFilters
        pillars={pillars}
        activePillar={pillarFilter}
        onPillarClick={setPillarFilter}
      />

      <CampaignAnalytics counts={statusCounts} total={slots.length} />

      <div
        style={{
          display: "grid",
          gap: "var(--bru-space-3)",
          marginTop: "var(--bru-space-4)",
        }}
      >
        {weeks.map((weekSlots, wi) => {
          const visibleSlots = weekSlots.filter((s) => filteredSet.has(s));
          if (visibleSlots.length === 0 && (statusFilter || pillarFilter))
            return null;

          return (
            <div key={`week-${wi}`}>
              <h4
                style={{
                  fontSize: "var(--bru-text-md)",
                  fontWeight: 700,
                  marginBottom: "var(--bru-space-2)",
                }}
              >
                Week {wi + 1}
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${postsPerWeek}, minmax(0, 1fr))`,
                  gap: "var(--bru-space-2)",
                }}
              >
                {weekSlots.map((slot, si) => {
                  const isVisible = filteredSet.has(slot);
                  const status = slot.generationStatus || "waiting_review";
                  const color = getPillarColor(slot.topicCard.pillar);
                  const isRejected = status === "rejected";

                  return (
                    <Card
                      key={`slot-${wi}-${si}`}
                      variant="flat"
                      style={{
                        padding: "var(--bru-space-2)",
                        cursor: "pointer",
                        overflow: "hidden",
                        opacity: !isVisible ? 0.15 : isRejected ? 0.5 : 1,
                        transition: "opacity 0.2s, box-shadow 0.15s",
                      }}
                      onClick={() => isVisible && handleCardClick(slot)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--bru-space-1)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--bru-text-xs)",
                            color: "var(--bru-grey)",
                          }}
                        >
                          {formatDate(slot.slotDate)}
                        </span>
                        <IdeaStatusBadge status={status} />
                      </div>
                      <div
                        style={{
                          fontSize: "var(--bru-text-sm)",
                          fontWeight: 700,
                          marginBottom: "var(--bru-space-1)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {slot.topicCard.headline}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--bru-space-1)",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--bru-text-xs)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "1px 6px",
                            background: color.bg,
                            color: color.text,
                            letterSpacing: "0.03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {slot.topicCard.pillar}
                        </span>
                        {slot.topicCard.templateRecommendation && (
                          <span
                            style={{
                              fontSize: "var(--bru-text-xs)",
                              color: "var(--bru-grey)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {slot.topicCard.templateRecommendation}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
