"use client";
import React from "react";
import type { CampaignSlot } from "@/lib/agents/campaignPlanner";

interface CampaignCalendarProps {
  slots: CampaignSlot[];
  durationWeeks: number;
  postsPerWeek: number;
}

export function CampaignCalendar({
  slots,
  durationWeeks,
  postsPerWeek,
}: CampaignCalendarProps) {
  // Group slots by week
  const weeks: CampaignSlot[][] = [];
  for (let w = 1; w <= durationWeeks; w++) {
    weeks.push(slots.filter((s) => s.weekNumber === w));
  }

  return (
    <div className="bru-card bru-card--raised">
      <h3
        style={{
          fontSize: "var(--bru-text-h5)",
          fontWeight: 700,
          marginBottom: "var(--bru-space-4)",
        }}
      >
        Campaign Calendar
      </h3>

      <div style={{ display: "grid", gap: "var(--bru-space-3)" }}>
        {weeks.map((weekSlots, wi) => (
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
                gridTemplateColumns: `repeat(${postsPerWeek}, 1fr)`,
                gap: "var(--bru-space-2)",
              }}
            >
              {weekSlots.length > 0
                ? weekSlots.map((slot, si) => (
                    <div
                      key={`slot-${wi}-${si}`}
                      className="bru-card bru-card--flat"
                      style={{ padding: "var(--bru-space-2)" }}
                    >
                      <div
                        style={{
                          fontSize: "var(--bru-text-xs)",
                          color: "var(--bru-grey)",
                          marginBottom: "var(--bru-space-1)",
                        }}
                      >
                        {new Date(
                          slot.slotDate + "T00:00:00",
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
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
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--bru-text-xs)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "0 4px",
                            background: "var(--bru-purple)",
                            color: "white",
                          }}
                        >
                          {slot.topicCard.pillar}
                        </span>
                        {slot.topicCard.templateRecommendation && (
                          <span
                            style={{
                              fontSize: "var(--bru-text-xs)",
                              color: "var(--bru-grey)",
                            }}
                          >
                            {slot.topicCard.templateRecommendation}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                : Array.from({ length: postsPerWeek }).map((_, i) => (
                    <div
                      key={`empty-${wi}-${i}`}
                      style={{
                        padding: "var(--bru-space-2)",
                        border: "1px dashed var(--bru-grey)",
                        textAlign: "center",
                        color: "var(--bru-grey)",
                        fontSize: "var(--bru-text-xs)",
                      }}
                    >
                      Pending
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
