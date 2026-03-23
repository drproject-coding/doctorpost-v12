"use client";
import type React from "react";
import { useState, useMemo } from "react";
import { Select, Icon, Loader } from "@doctorproject/react";
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
        color: "var(--drp-orange)",
      }}
      title={`Editor's choice: ${level}/3`}
    >
      {Array.from({ length: stars }, (_, i) => (
        <span key={i} style={{ fontSize: "var(--drp-text-sm)" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        background: "var(--drp-purple-20)",
        color: "var(--drp-purple)",
        fontSize: "var(--drp-text-xs)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );
}

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

  const chipBase: React.CSSProperties = {
    padding: "2px 8px",
    fontSize: "var(--drp-text-xs)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(0,0,0,0.15)",
    cursor: "pointer",
    background: "var(--drp-white)",
    color: "var(--drp-black)",
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    borderColor: "var(--drp-purple)",
    background: "var(--drp-purple)",
    color: "var(--drp-white)",
  };

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
          <span
            style={{
              fontSize: "var(--drp-text-sm)",
              fontWeight: 700,
              color: "var(--drp-text-secondary)",
            }}
          >
            {formatNumber(userInfo.coins)} coins
          </span>
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              background: "rgba(217, 119, 6, 0.15)",
              color: "var(--drp-text-secondary)",
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
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--drp-text-muted)",
              display: "flex",
            }}
          >
            <Icon name="search" size="sm" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="drp-input"
            style={{ width: "100%", paddingLeft: 32, fontSize: "var(--drp-text-sm)" }}
          />
        </div>

        {/* Provider chips */}
        {providers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <button
              type="button"
              onClick={() => setProviderFilter(null)}
              style={!providerFilter ? chipActive : chipBase}
            >
              All
            </button>
            {providers.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() =>
                  setProviderFilter(providerFilter === p ? null : p)
                }
                style={providerFilter === p ? chipActive : chipBase}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{ width: "100%", fontSize: "var(--drp-text-sm)" }}
        >
          <option value="quality">Sort: Quality Rating</option>
          <option value="price-asc">Sort: Price (low to high)</option>
          <option value="price-desc">Sort: Price (high to low)</option>
          <option value="newest">Sort: Newest First</option>
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
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-text-muted)",
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
              <button
                type="button"
                onClick={() => onSelectModel(model.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 10,
                  border: isSelected
                    ? "2px solid var(--drp-purple)"
                    : "var(--drp-border)",
                  background: isSelected
                    ? "rgba(99, 29, 237, 0.05)"
                    : "var(--drp-white)",
                  cursor: "pointer",
                  fontFamily: "var(--drp-font-primary)",
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
                          fontSize: "var(--drp-text-sm)",
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
                            fontSize: "var(--drp-text-xs)",
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
                        fontSize: "var(--drp-text-xs)",
                        color: "var(--drp-text-muted)",
                      }}
                    >
                      {model.pricing && (
                        <span title="Cost per 100 words">
                          {model.pricing.coins}/{model.pricing.words}w
                        </span>
                      )}
                      {!model.pricing && model.creditsPerInputToken != null && (
                        <span title="Credits per token (in/out)">
                          {model.creditsPerInputToken}↑ /{" "}
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
                          fontSize: "var(--drp-text-xs)",
                          color: "var(--drp-text-muted)",
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
                            fontSize: "var(--drp-text-xs)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "rgba(37, 99, 235, 0.08)",
                            color: "var(--drp-info)",
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
              </button>

              {isSelected && (
                <button
                  type="button"
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
                    fontSize: "var(--drp-text-xs)",
                    color: "var(--drp-purple)",
                    fontWeight: 700,
                    borderLeft: "2px solid var(--drp-purple)",
                    borderRight: "2px solid var(--drp-purple)",
                    borderBottom: "2px solid var(--drp-purple)",
                    background: "rgba(99, 29, 237, 0.05)",
                    cursor: "pointer",
                    fontFamily: "var(--drp-font-primary)",
                  }}
                >
                  {isExpanded ? (
                    <>
                      Hide details <Icon name="arrow-up" size="sm" />
                    </>
                  ) : (
                    <>
                      Show details <Icon name="arrow-down" size="sm" />
                    </>
                  )}
                </button>
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
                        fontSize: "var(--drp-text-xs)",
                        color: "var(--drp-text-muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {model.description}
                    </p>
                  )}
                  {model.pricing && (
                    <p style={{ fontSize: "var(--drp-text-xs)", color: "var(--drp-text-muted)" }}>
                      ~{model.pricing.coins} coins per {model.pricing.words}{" "}
                      words
                    </p>
                  )}
                  {!model.pricing && model.creditsPerInputToken != null && (
                    <p style={{ fontSize: "var(--drp-text-xs)", color: "var(--drp-text-muted)" }}>
                      {model.creditsPerInputToken} credits/input token &middot;{" "}
                      {model.creditsPerOutputToken ?? 0} credits/output token
                    </p>
                  )}
                  {model.maxTokens && (
                    <p style={{ fontSize: "var(--drp-text-xs)", color: "var(--drp-text-muted)" }}>
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
                          fontSize: "var(--drp-text-xs)",
                          fontWeight: 700,
                          color: "var(--drp-mint)",
                          marginBottom: 4,
                        }}
                      >
                        Strengths
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
                              fontSize: "var(--drp-text-xs)",
                              color: "var(--drp-text-muted)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--drp-mint)",
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
                          fontSize: "var(--drp-text-xs)",
                          fontWeight: 700,
                          color: "var(--drp-pink)",
                          marginBottom: 4,
                        }}
                      >
                        Weaknesses
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
                              fontSize: "var(--drp-text-xs)",
                              color: "var(--drp-text-muted)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--drp-pink)",
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
              fontSize: "var(--drp-text-sm)",
              color: "var(--drp-text-muted)",
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
          <p style={{ fontSize: "var(--drp-text-xs)", color: "var(--drp-text-muted)" }}>
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
