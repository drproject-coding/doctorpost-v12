"use client";
import React, { useState } from "react";
import { Button, Input } from "@doctorproject/react";
import { enhancedContentPillars } from "@/lib/dropdownData";
import { BrandProfile, CustomPillar } from "@/lib/types";
import { useConfirm } from "@/components/ConfirmDialog";

interface PillarsSectionProps {
  profile: BrandProfile;
  editing: boolean;
  onChange: (updates: Partial<BrandProfile>) => void;
  onAutoSave?: (updates: Partial<BrandProfile>) => void;
}

const MINT = "#98E9AB";
const CREAM = "var(--drp-cream)";

const PillarsSection: React.FC<PillarsSectionProps> = ({
  profile,
  editing,
  onChange,
  onAutoSave,
}) => {
  const [newPillarLabel, setNewPillarLabel] = useState("");
  const [newPillarDesc, setNewPillarDesc] = useState("");
  const confirm = useConfirm();

  // Only use explicitly saved pillars — no auto-select-all
  const selectedIds = profile.pillars ?? [];

  const applyUpdate = (updates: Partial<BrandProfile>) => {
    onChange(updates);
    onAutoSave?.(updates);
  };

  // Build custom pillar display objects from profile.customPillars
  const predefinedIds = new Set(enhancedContentPillars.map((p) => p.id));

  const togglePillar = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    applyUpdate({ pillars: next, customPillars: profile.customPillars ?? [] });
  };

  const deletePillar = async (id: string, label: string) => {
    const isCustom = !predefinedIds.has(id);
    const ok = await confirm({
      title: isCustom ? "Delete pillar" : "Remove pillar",
      message: isCustom
        ? `Permanently delete "${label}"? This cannot be undone.`
        : `Remove "${label}" from your active pillars?`,
      confirmLabel: isCustom ? "Delete" : "Remove",
      danger: isCustom,
    });
    if (!ok) return;
    const newPillars = selectedIds.filter((x) => x !== id);
    const newCustom = (profile.customPillars ?? []).filter(
      (cp) => cp.id !== id,
    );
    applyUpdate({ pillars: newPillars, customPillars: newCustom });
  };
  const customPillars = (profile.customPillars ?? []).map(
    (cp: CustomPillar) => ({
      id: cp.id,
      value: cp.id,
      label: cp.label,
      category: "Custom",
      description: cp.description,
      exampleSnippet: "",
      useCases: [] as string[],
      performanceIndicator: "medium" as const,
      isTrending: false,
    }),
  );

  // Also include any IDs in pillars[] that aren't covered above (legacy plain strings)
  const coveredIds = new Set([
    ...enhancedContentPillars.map((p) => p.id),
    ...(profile.customPillars ?? []).map((cp) => cp.id),
  ]);
  const legacyCustom = selectedIds
    .filter((id) => !coveredIds.has(id))
    .map((id) => ({
      id,
      value: id,
      label: id,
      category: "Custom",
      description: "",
      exampleSnippet: "",
      useCases: [] as string[],
      performanceIndicator: "medium" as const,
      isTrending: false,
    }));

  const allPillars = [
    ...enhancedContentPillars,
    ...customPillars,
    ...legacyCustom,
  ];

  const visiblePillars = editing
    ? allPillars
    : allPillars.filter((p) => selectedIds.includes(p.id));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--drp-space-3)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "var(--drp-space-3)",
        }}
      >
        {visiblePillars.map((pillar) => {
          const isHighPerformance = pillar.performanceIndicator === "high";
          const isSelected = selectedIds.includes(pillar.id);
          const backgroundColor = isSelected
            ? isHighPerformance
              ? `${MINT}33`
              : CREAM
            : "rgba(0,0,0,0.03)";

          return (
            <div
              key={pillar.id}
              onClick={editing ? () => togglePillar(pillar.id) : undefined}
              style={{
                backgroundColor,
                border: isSelected
                  ? isHighPerformance
                    ? `1px solid ${MINT}`
                    : "1px solid rgba(0,0,0,0.10)"
                  : "1px dashed rgba(0,0,0,0.20)",
                borderRadius: 0,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                cursor: editing ? "pointer" : "default",
                opacity: isSelected ? 1 : 0.5,
                position: "relative",
              }}
            >
              {/* Trash button — only in edit mode */}
              {editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deletePillar(pillar.id, pillar.label);
                  }}
                  title="Remove pillar"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    padding: 2,
                    color: "var(--drp-text-muted)",
                  }}
                  aria-label="Remove pillar"
                >
                  ×
                </Button>
              )}

              {/* Label row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--drp-font-primary)",
                    fontWeight: "var(--drp-weight-heavy)",
                    fontSize: "var(--drp-text-sm)",
                    color: "var(--drp-black)",
                    lineHeight: 1.3,
                  }}
                >
                  {pillar.label}
                </span>
                {pillar.isTrending && (
                  <span
                    style={{ fontSize: "13px", lineHeight: 1 }}
                    title="Trending"
                    aria-label="Trending"
                  >
                    🔥
                  </span>
                )}
              </div>

              {/* Category badge */}
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(0,0,0,0.07)",
                  color: "var(--drp-black)",
                  padding: "1px 7px",
                  fontSize: "var(--drp-text-xs)",
                  fontFamily: "var(--drp-font-primary)",
                  fontWeight: "500",
                  letterSpacing: "var(--drp-tracking-caps)",
                  textTransform: "uppercase" as const,
                  alignSelf: "flex-start",
                }}
              >
                {pillar.category}
              </span>

              {/* Description */}
              {pillar.description && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--drp-font-primary)",
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {pillar.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom pillar — full-width row below grid */}
      {editing && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--drp-space-2)",
          }}
        >
          <div style={{ display: "flex", gap: "var(--drp-space-2)" }}>
            <Input
              value={newPillarLabel}
              onChange={(e) => setNewPillarLabel(e.target.value)}
              placeholder="Pillar name..."
              style={{ flex: 1 }}
            />
            <Input
              value={newPillarDesc}
              onChange={(e) => setNewPillarDesc(e.target.value)}
              placeholder="Description..."
              style={{ flex: 2 }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={!newPillarLabel.trim()}
              onClick={() => {
                const label = newPillarLabel.trim();
                if (!label) return;
                const newCustom: CustomPillar = {
                  id: label,
                  label,
                  description: newPillarDesc.trim(),
                };
                const updatedCustomPillars = [
                  ...(profile.customPillars ?? []),
                  newCustom,
                ];
                applyUpdate({
                  pillars: [...selectedIds, label],
                  customPillars: updatedCustomPillars,
                });
                setNewPillarLabel("");
                setNewPillarDesc("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PillarsSection;
