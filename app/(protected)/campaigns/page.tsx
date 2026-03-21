"use client";
import React, { useState, useRef } from "react";
import { Button } from "@doctorproject/react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  CampaignSetup,
  type CampaignConfig,
} from "@/components/campaigns/CampaignSetup";
import {
  CampaignCalendar,
  type CalendarSlot,
} from "@/components/campaigns/CampaignCalendar";
import { BatchProgress } from "@/components/campaigns/BatchProgress";
import { CampaignList } from "@/components/campaigns/CampaignList";
import type { Campaign } from "@/lib/knowledge/types";

type PageView = "list" | "new" | "detail";

type CampaignPhase =
  | "idle"
  | "creating"
  | "planning"
  | "saving"
  | "complete"
  | "error";

export default function CampaignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<PageView>("list");
  const [phase, setPhase] = useState<CampaignPhase>("idle");
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [totalSlots, setTotalSlots] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [pillarDistribution, setPillarDistribution] = useState<
    Record<string, number> | undefined
  >();
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const campaignIdRef = useRef<string | undefined>();

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleNewCampaign = () => {
    setView("new");
    setPhase("idle");
    setSlots([]);
    setConfig(null);
    setCampaignId(undefined);
    setError(undefined);
    setPillarDistribution(undefined);
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setView("detail");
    setCampaignId(String(campaign.id));
    // Load campaign posts from DB
    fetch(`/api/data/read/campaign_posts?campaign_id=${campaign.id}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        const rows = data?.rows || data?.data || [];
        const mapped: CalendarSlot[] = rows.map(
          (r: Record<string, string>) => ({
            id: r.id,
            weekNumber: Math.ceil(
              Number(r.slot_order) / (campaign.postsPerWeek || 3),
            ),
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
          }),
        );
        mapped.sort((a, b) => a.slotOrder - b.slotOrder);
        setSlots(mapped);
        setConfig({
          name: campaign.name,
          durationWeeks: campaign.durationWeeks,
          postsPerWeek: campaign.postsPerWeek,
          goals: campaign.goals,
          pillarWeights: campaign.pillarWeights,
        } as CampaignConfig);
        setPhase("complete");
      })
      .catch(() => {
        setSlots([]);
        setPhase("complete");
      });
  };

  const handleBackToList = () => {
    setView("list");
    setPhase("idle");
    setSlots([]);
    setConfig(null);
    setCampaignId(undefined);
    setSelectedCampaign(null);
    setError(undefined);
    setPillarDistribution(undefined);
  };

  const handleSubmit = async (cfg: CampaignConfig) => {
    setConfig(cfg);
    setPhase("creating");
    setSlots([]);
    setError(undefined);
    setTotalSlots(cfg.durationWeeks * cfg.postsPerWeek);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cfg,
          keys: { claude: "__server_resolved__" },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let errorMsg = `Campaign creation failed (${res.status})`;
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          // not JSON
        }
        setPhase("error");
        setError(errorMsg);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            if (line.startsWith("data: "))
              data += (data ? "\n" : "") + line.slice(6);
          }

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            switch (eventType) {
              case "status":
                if (parsed.phase) setPhase(parsed.phase as CampaignPhase);
                if (parsed.slotsCount) setTotalSlots(parsed.slotsCount);
                if (parsed.campaignId) {
                  const cid = String(parsed.campaignId);
                  setCampaignId(cid);
                  campaignIdRef.current = cid;
                }
                break;
              case "slot":
                setSlots((prev) => [
                  ...prev,
                  {
                    id: parsed.id,
                    weekNumber: parsed.weekNumber,
                    slotOrder: parsed.slotOrder,
                    slotDate: parsed.slotDate,
                    generationStatus:
                      parsed.generationStatus || "waiting_review",
                    topicCard: parsed.topicCard,
                  } as CalendarSlot,
                ]);
                break;
              case "complete":
                setPhase("complete");
                if (parsed.pillarDistribution)
                  setPillarDistribution(parsed.pillarDistribution);
                // Redirect to persistent campaign URL so DB is source of truth
                if (campaignIdRef.current) {
                  router.push(`/campaigns/${campaignIdRef.current}`);
                }
                break;
              case "error":
                setPhase("error");
                setError(parsed.message);
                break;
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setPhase("error");
        setError(String(err));
      }
    }
  };

  // List view — show existing campaigns
  if (view === "list") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--drp-space-6)",
          }}
        >
          <h1
            style={{
              fontSize: "var(--drp-text-h3)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Campaigns
          </h1>
          <Button onClick={handleNewCampaign}>New Campaign</Button>
        </div>
        <CampaignList
          onSelect={handleSelectCampaign}
          onNewCampaign={handleNewCampaign}
        />
      </div>
    );
  }

  // Detail view — viewing an existing campaign
  if (view === "detail" && selectedCampaign) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--drp-space-6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--drp-space-3)",
            }}
          >
            <button
              onClick={handleBackToList}
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
            <h1
              style={{
                fontSize: "var(--drp-text-h3)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {selectedCampaign.name}
            </h1>
          </div>
        </div>
        {slots.length > 0 && config && (
          <CampaignCalendar
            slots={slots}
            durationWeeks={config.durationWeeks}
            postsPerWeek={config.postsPerWeek}
            campaignId={campaignId}
          />
        )}
        {slots.length === 0 && phase === "complete" && (
          <div
            style={{
              textAlign: "center",
              padding: "var(--drp-space-8)",
              color: "var(--drp-grey)",
            }}
          >
            No ideas found for this campaign.
          </div>
        )}
      </div>
    );
  }

  // New campaign view — setup + progress + calendar
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--drp-space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-3)",
          }}
        >
          <button
            onClick={handleBackToList}
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
          <h1
            style={{
              fontSize: "var(--drp-text-h3)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            New Campaign
          </h1>
        </div>
      </div>

      {phase === "idle" && <CampaignSetup onSubmit={handleSubmit} />}

      {phase !== "idle" && (
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <BatchProgress
            phase={phase}
            slotsPlanned={slots.length}
            totalSlots={totalSlots}
            error={error}
            pillarDistribution={pillarDistribution}
          />
        </div>
      )}

      {slots.length > 0 && config && (
        <CampaignCalendar
          slots={slots}
          durationWeeks={config.durationWeeks}
          postsPerWeek={config.postsPerWeek}
          campaignId={campaignId}
        />
      )}
    </div>
  );
}
