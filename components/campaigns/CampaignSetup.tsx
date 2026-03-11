"use client";
import React, { useState } from "react";
import { Button, Card, Input, Textarea } from "@doctorproject/react";
import { Plus, Minus } from "lucide-react";

interface CampaignSetupProps {
  onSubmit: (config: CampaignConfig) => void;
  disabled?: boolean;
}

export interface CampaignConfig {
  name: string;
  durationWeeks: number;
  postsPerWeek: number;
  goals: string;
  pillarWeights: Record<string, number>;
  startDate: string;
}

const DEFAULT_PILLARS = [
  "Authority",
  "Engagement",
  "Trust",
  "Education",
  "Personal",
];

export function CampaignSetup({ onSubmit, disabled }: CampaignSetupProps) {
  const [name, setName] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [goals, setGoals] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [pillars, setPillars] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    DEFAULT_PILLARS.forEach((p) => (initial[p] = 20));
    return initial;
  });
  const [newPillar, setNewPillar] = useState("");

  const totalWeight = Object.values(pillars).reduce((s, v) => s + v, 0);

  const handlePillarWeight = (pillar: string, value: number) => {
    setPillars((prev) => ({
      ...prev,
      [pillar]: Math.max(0, Math.min(100, value)),
    }));
  };

  const addPillar = () => {
    if (!newPillar.trim() || pillars[newPillar]) return;
    setPillars((prev) => ({ ...prev, [newPillar.trim()]: 10 }));
    setNewPillar("");
  };

  const removePillar = (pillar: string) => {
    setPillars((prev) => {
      const next = { ...prev };
      delete next[pillar];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      durationWeeks,
      postsPerWeek,
      goals,
      pillarWeights: pillars,
      startDate,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="raised">
        <h3
          style={{
            fontSize: "var(--drp-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--drp-space-4)",
          }}
        >
          New Campaign
        </h3>

        <div className="drp-form-stack">
          <Input
            label="Campaign Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q2 2026 Authority Building"
            required
          />

          <div className="drp-form-row">
            <Input
              label="Duration (weeks)"
              type="number"
              min={1}
              max={52}
              step={1}
              value={String(durationWeeks)}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
            />
            <Input
              label="Posts per week"
              type="number"
              min={1}
              max={7}
              step={1}
              value={String(postsPerWeek)}
              onChange={(e) => setPostsPerWeek(Number(e.target.value))}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What do you want to achieve with this campaign?"
            style={{ minHeight: 80 }}
          />

          {/* Pillar Weights */}
          <div className="drp-field">
            <label className="drp-field__label">
              Pillar Weights (total: {totalWeight}%)
            </label>
            {totalWeight !== 100 && (
              <div
                style={{
                  fontSize: "var(--drp-text-xs)",
                  color: "var(--drp-error-dark)",
                  marginBottom: "var(--drp-space-2)",
                }}
              >
                Weights should sum to 100%
              </div>
            )}
            <div style={{ display: "grid", gap: "var(--drp-space-2)" }}>
              {Object.entries(pillars).map(([pillar, weight]) => (
                <div
                  key={pillar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--drp-space-2)",
                  }}
                >
                  <span
                    style={{
                      width: 120,
                      fontSize: "var(--drp-text-sm)",
                      fontWeight: 500,
                    }}
                  >
                    {pillar}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={String(weight)}
                    onChange={(e) =>
                      handlePillarWeight(pillar, Number(e.target.value))
                    }
                    style={{ width: 70 }}
                  />
                  <span
                    style={{
                      fontSize: "var(--drp-text-xs)",
                      color: "var(--drp-grey)",
                    }}
                  >
                    %
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removePillar(pillar)}
                    style={{ padding: 2 }}
                  >
                    <Minus size={12} />
                  </Button>
                </div>
              ))}
              {/* Add pillar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--drp-space-2)",
                }}
              >
                <Input
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  placeholder="New pillar..."
                  style={{ width: 120 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPillar();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addPillar}
                  style={{ padding: 2 }}
                >
                  <Plus size={12} />
                </Button>
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "var(--drp-text-sm)",
              color: "var(--drp-grey)",
              padding: "var(--drp-space-2)",
              background: "var(--drp-cream)",
              border: "var(--drp-border)",
            }}
          >
            Total posts: {durationWeeks * postsPerWeek}
          </div>
        </div>

        <div
          className="drp-form-actions"
          style={{ marginTop: "var(--drp-space-4)" }}
        >
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || !name.trim() || totalWeight !== 100}
          >
            Create Campaign
          </Button>
        </div>
      </Card>
    </form>
  );
}
