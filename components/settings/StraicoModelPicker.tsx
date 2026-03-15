"use client";
import type React from "react";
import { useState, useMemo } from "react";
import { Button, Input, Loader, Select } from "@doctorproject/react";
import type { AiModel, StraicoUserInfo } from "@/lib/types";

type SortOption = "quality" | "price-asc" | "price-desc" | "newest";

interface StraicoModelPickerProps {
  models: AiModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  loading?: boolean;
  userInfo?: StraicoUserInfo | null;
  allowAllTypes?: boolean;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function QualityBadge({ level }: { level: number }) {
  if (level < 0) return null;
  const stars = Math.min(level, 3);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color: "#d97706",
      }}
      title={`Editor's choice: ${level}/3`}
    >
      {Array.from({ length: stars }, (_, i) => (
        <span key={i}>★</span>
      ))}
    </span>
  );
}

const featureIconMap: Record<string, string> = {
  "Image input": "🖼",
  "Web search": "🌐",
};

function FeatureBadge({ label }: { label: string }) {
  const iconChar = featureIconMap[label] ?? "⚡";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        background: "var(--drp-purple-20)",
        color: "var(--drp-purple)",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <span>{iconChar}</span>
      {label}
    </span>
  );
}

const sortOptions = [
  { value: "quality", label: "Sort: Quality Rating" },
  { value: "price-asc", label: "Sort: Price (low to high)" },
  { value: "price-desc", label: "Sort: Price (high to low)" },
  { value: "newest", label: "Sort: Newest First" },
];

export function StraicoModelPicker({
  models,
  selectedModelId,
  onSelectModel,
  loading,
  userInfo,
  allowAllTypes,
}: StraicoModelPickerProps) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("quality");
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [models]);

  const filteredModels = useMemo(() => {
    let result = allowAllTypes
      ? [...models]
      : models.filter((m) => !m.modelType || m.modelType === "chat");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider?.toLowerCase().includes(q),
      );
    }

    if (providerFilter) {
      result = result.filter((m) => m.provider === providerFilter);
    }

    const getPrice = (m: AiModel) =>
      m.pricing?.coins ?? m.creditsPerInputToken ?? 0;

    result.sort((a, b) => {
      switch (sort) {
        case "quality":
          return (b.editorsChoiceLevel ?? -1) - (a.editorsChoiceLevel ?? -1);
        case "price-asc":
          return getPrice(a) - getPrice(b);
        case "price-desc":
          return getPrice(b) - getPrice(a);
        case "newest":
          return (b.modelDate ?? "").localeCompare(a.modelDate ?? "");
        default:
          return 0;
      }
    });

    return result;
  }, [models, search, providerFilter, sort, allowAllTypes]);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--drp-space-3)",
      }}
    >
      {/* Account Bar */}
      {userInfo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-3)",
            padding: "var(--drp-space-2)",
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.25)",
          }}
        >
          <span style={{ color: "#d97706" }}>🪙</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>
            {formatNumber(userInfo.coins)} coins
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              background: "rgba(217, 119, 6, 0.15)",
              color: "#92400e",
            }}
          >
            {userInfo.plan}
          </span>
        </div>
      )}

      {/* Search + Filters */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--drp-space-2)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            style={{ width: "100%", fontSize: 12 }}
          />
        </div>

        {/* Provider chips */}
        {providers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Button
              type="button"
              size="sm"
              variant={!providerFilter ? "primary" : "ghost-bordered"}
              onClick={() => setProviderFilter(null)}
            >
              All
            </Button>
            {providers.map((p) => (
              <Button
                type="button"
                size="sm"
                key={p}
                variant={providerFilter === p ? "primary" : "ghost-bordered"}
                onClick={() =>
                  setProviderFilter(providerFilter === p ? null : p)
                }
              >
                {p}
              </Button>
            ))}
          </div>
        )}

        {/* Sort */}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{ width: "100%", fontSize: 12 }}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--drp-space-4) 0",
            gap: "var(--drp-space-2)",
            fontSize: 12,
            color: "var(--drp-grey)",
          }}
        >
          <Loader size="sm" />
          Loading models...
        </div>
      )}

      {/* Model Cards */}
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingRight: 4,
        }}
      >
        {filteredModels.map((model) => {
          const isSelected = model.id === selectedModelId;
          const isExpanded = model.id === expandedModelId;

          return (
            <div key={model.id}>
              <Button
                type="button"
                variant={isSelected ? "ghost-bordered" : "ghost-bordered"}
                onClick={() => onSelectModel(model.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 10,
                  borderColor: isSelected
                    ? "var(--drp-purple)"
                    : "rgba(0,0,0,0.12)",
                  borderWidth: isSelected ? 2 : 1,
                  background: isSelected
                    ? "rgba(99, 29, 237, 0.05)"
                    : "var(--drp-white)",
                  height: "auto",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  {model.icon && (
                    <img
                      src={model.icon}
                      alt=""
                      style={{
                        width: 24,
                        height: 24,
                        marginTop: 2,
                        objectFit: "contain",
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {model.label}
                      </span>
                      <QualityBadge level={model.editorsChoiceLevel ?? -1} />
                      {model.provider && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "2px 4px",
                            background: "rgba(0,0,0,0.05)",
                          }}
                        >
                          {model.provider}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 4,
                        fontSize: 10,
                        color: "var(--drp-grey)",
                      }}
                    >
                      {model.pricing && (
                        <span title="Cost per 100 words">
                          🪙 {model.pricing.coins}/{model.pricing.words}w
                        </span>
                      )}
                      {!model.pricing && model.creditsPerInputToken != null && (
                        <span title="Credits per token (in/out)">
                          🪙 {model.creditsPerInputToken}↑ /{" "}
                          {model.creditsPerOutputToken ?? 0}↓
                        </span>
                      )}
                      {model.maxTokens && (
                        <span title="Max output tokens">
                          max: {model.maxTokens.max.toLocaleString()}
                        </span>
                      )}
                      {model.wordLimit != null && model.wordLimit > 0 && (
                        <span title="Context window (words)">
                          ctx: {(model.wordLimit / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                    {model.description && !model.applications?.length && (
                      <p
                        style={{
                          fontSize: 10,
                          color: "var(--drp-grey)",
                          marginTop: 4,
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={model.description}
                      >
                        {model.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {model.applications?.slice(0, 4).map((app) => (
                        <span
                          key={app}
                          style={{
                            padding: "2px 4px",
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "rgba(37, 99, 235, 0.08)",
                            color: "#2563eb",
                          }}
                        >
                          {app}
                        </span>
                      ))}
                      {model.features?.map((feat) => (
                        <FeatureBadge key={feat} label={feat} />
                      ))}
                    </div>
                  </div>
                </div>
              </Button>

              {isSelected && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedModelId(isExpanded ? null : model.id);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "4px 0",
                    fontSize: 10,
                    color: "var(--drp-purple)",
                    fontWeight: 700,
                    borderLeft: "2px solid var(--drp-purple)",
                    borderRight: "2px solid var(--drp-purple)",
                    borderBottom: "2px solid var(--drp-purple)",
                    background: "rgba(99, 29, 237, 0.05)",
                    height: "auto",
                  }}
                >
                  {isExpanded ? <>Hide details ▲</> : <>Show details ▼</>}
                </Button>
              )}

              {isSelected && isExpanded && (
                <div
                  style={{
                    borderLeft: "2px solid var(--drp-purple)",
                    borderRight: "2px solid var(--drp-purple)",
                    borderBottom: "2px solid var(--drp-purple)",
                    background: "rgba(99, 29, 237, 0.05)",
                    padding: "0 12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {model.description && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--drp-grey)",
                        lineHeight: 1.4,
                      }}
                    >
                      {model.description}
                    </p>
                  )}
                  {model.pricing && (
                    <p style={{ fontSize: 11, color: "var(--drp-grey)" }}>
                      <span style={{ color: "#d97706", marginRight: 4 }}>
                        🪙
                      </span>
                      ~{model.pricing.coins} coins per {model.pricing.words}{" "}
                      words
                    </p>
                  )}
                  {!model.pricing && model.creditsPerInputToken != null && (
                    <p style={{ fontSize: 11, color: "var(--drp-grey)" }}>
                      <span style={{ color: "#d97706", marginRight: 4 }}>
                        🪙
                      </span>
                      {model.creditsPerInputToken} credits/input token &middot;{" "}
                      {model.creditsPerOutputToken ?? 0} credits/output token
                    </p>
                  )}
                  {model.maxTokens && (
                    <p style={{ fontSize: 11, color: "var(--drp-grey)" }}>
                      This model supports up to{" "}
                      <strong>{model.maxTokens.max.toLocaleString()}</strong>{" "}
                      output tokens
                    </p>
                  )}

                  {model.pros && model.pros.length > 0 && (
                    <div>
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--drp-success-dark)",
                          marginBottom: 4,
                        }}
                      >
                        ✓ Strengths
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {model.pros.map((pro, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: 11,
                              color: "var(--drp-grey)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--drp-success-dark)",
                              }}
                            >
                              &bull;
                            </span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {model.cons && model.cons.length > 0 && (
                    <div>
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--drp-error-dark)",
                          marginBottom: 4,
                        }}
                      >
                        ✕ Weaknesses
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {model.cons.map((con, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: 11,
                              color: "var(--drp-grey)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--drp-error-dark)",
                              }}
                            >
                              &bull;
                            </span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && filteredModels.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "var(--drp-grey)",
              textAlign: "center",
              padding: "var(--drp-space-4) 0",
            }}
          >
            No models match your filters
          </p>
        )}
      </div>

      {/* Selected model summary */}
      {selectedModel && (
        <div
          style={{
            paddingTop: "var(--drp-space-2)",
            borderTop: "var(--drp-border)",
          }}
        >
          <p style={{ fontSize: 10, color: "var(--drp-grey)" }}>
            Selected:{" "}
            <span style={{ fontWeight: 700, color: "var(--drp-black)" }}>
              {selectedModel.label}
            </span>
            {selectedModel.pricing && (
              <span style={{ marginLeft: 8 }}>
                ({selectedModel.pricing.coins} coins /{" "}
                {selectedModel.pricing.words}w)
              </span>
            )}
            {!selectedModel.pricing &&
              selectedModel.creditsPerInputToken != null && (
                <span style={{ marginLeft: 8 }}>
                  ({selectedModel.creditsPerInputToken}↑ /{" "}
                  {selectedModel.creditsPerOutputToken ?? 0}↓ credits/tok)
                </span>
              )}
          </p>
        </div>
      )}
    </div>
  );
}
