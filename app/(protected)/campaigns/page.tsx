"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  CampaignSetup,
  type CampaignConfig,
} from "@/components/campaigns/CampaignSetup";
import { CampaignCalendar } from "@/components/campaigns/CampaignCalendar";
import { BatchProgress } from "@/components/campaigns/BatchProgress";
import type { CampaignSlot } from "@/lib/agents/campaignPlanner";

type CampaignPhase =
  | "idle"
  | "creating"
  | "planning"
  | "saving"
  | "complete"
  | "error";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<CampaignPhase>("idle");
  const [slots, setSlots] = useState<CampaignSlot[]>([]);
  const [totalSlots, setTotalSlots] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [pillarDistribution, setPillarDistribution] = useState<
    Record<string, number> | undefined
  >();
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort SSE stream on unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
                break;
              case "slot":
                setSlots((prev) => [...prev, parsed as CampaignSlot]);
                break;
              case "complete":
                setPhase("complete");
                if (parsed.pillarDistribution)
                  setPillarDistribution(parsed.pillarDistribution);
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

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-6)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--bru-text-h3)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Campaigns
        </h1>
        {phase !== "idle" && (
          <button
            className="bru-btn"
            onClick={() => {
              setPhase("idle");
              setSlots([]);
              setConfig(null);
              setError(undefined);
            }}
          >
            New Campaign
          </button>
        )}
      </div>

      {/* Setup form */}
      {phase === "idle" && <CampaignSetup onSubmit={handleSubmit} />}

      {/* Progress */}
      {phase !== "idle" && (
        <div style={{ marginBottom: "var(--bru-space-4)" }}>
          <BatchProgress
            phase={phase}
            slotsPlanned={slots.length}
            totalSlots={totalSlots}
            error={error}
            pillarDistribution={pillarDistribution}
          />
        </div>
      )}

      {/* Calendar */}
      {slots.length > 0 && config && (
        <CampaignCalendar
          slots={slots}
          durationWeeks={config.durationWeeks}
          postsPerWeek={config.postsPerWeek}
        />
      )}
    </div>
  );
}
