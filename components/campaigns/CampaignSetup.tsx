"use client";
import React, { useState } from "react";
import { Button, Card } from "@bruddle/react";
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
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            marginBottom: "var(--bru-space-4)",
          }}
        >
          New Campaign
        </h3>

        <div className="bru-form-stack">
          <div className="bru-field">
            <label className="bru-field__label">Campaign Name</label>
            <input
              className="bru-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 2026 Authority Building"
              required
            />
          </div>

          <div className="bru-form-row">
            <div className="bru-field">
              <label className="bru-field__label">Duration (weeks)</label>
              <input
                className="bru-input"
                type="number"
                min={1}
                max={52}
                step={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
              />
            </div>
            <div className="bru-field">
              <label className="bru-field__label">Posts per week</label>
              <input
                className="bru-input"
                type="number"
                min={1}
                max={7}
                step={1}
                value={postsPerWeek}
                onChange={(e) => setPostsPerWeek(Number(e.target.value))}
              />
            </div>
            <div className="bru-field">
              <label className="bru-field__label">Start Date</label>
              <input
                className="bru-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="bru-field">
            <label className="bru-field__label">Goals</label>
            <textarea
              className="bru-input"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What do you want to achieve with this campaign?"
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Pillar Weights */}
          <div className="bru-field">
            <label className="bru-field__label">
              Pillar Weights (total: {totalWeight}%)
            </label>
            {totalWeight !== 100 && (
              <div
                style={{
                  fontSize: "var(--bru-text-xs)",
                  color: "var(--bru-error-dark)",
                  marginBottom: "var(--bru-space-2)",
                }}
              >
                Weights should sum to 100%
              </div>
            )}
            <div style={{ display: "grid", gap: "var(--bru-space-2)" }}>
              {Object.entries(pillars).map(([pillar, weight]) => (
                <div
                  key={pillar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--bru-space-2)",
                  }}
                >
                  <span
                    style={{
                      width: 120,
                      fontSize: "var(--bru-text-sm)",
                      fontWeight: 500,
                    }}
                  >
                    {pillar}
                  </span>
                  <input
                    className="bru-input"
                    type="number"
                    min={0}
                    max={100}
                    value={weight}
                    onChange={(e) =>
                      handlePillarWeight(pillar, Number(e.target.value))
                    }
                    style={{ width: 70 }}
                  />
                  <span
                    style={{
                      fontSize: "var(--bru-text-xs)",
                      color: "var(--bru-grey)",
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
                  gap: "var(--bru-space-2)",
                }}
              >
                <input
                  className="bru-input"
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
              fontSize: "var(--bru-text-sm)",
              color: "var(--bru-grey)",
              padding: "var(--bru-space-2)",
              background: "var(--bru-cream)",
              border: "var(--bru-border)",
            }}
          >
            Total posts: {durationWeeks * postsPerWeek}
          </div>
        </div>

        <div
          className="bru-form-actions"
          style={{ marginTop: "var(--bru-space-4)" }}
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
