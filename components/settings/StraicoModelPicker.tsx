"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Star,
  Coins,
  ChevronDown,
  ChevronUp,
  Zap,
  Image as ImageIcon,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Loader,
} from "lucide-react";
import type { AiModel, StraicoUserInfo } from "@/lib/types";

type SortOption = "quality" | "price-asc" | "price-desc" | "newest";

interface StraicoModelPickerProps {
  models: AiModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  loading?: boolean;
  userInfo?: StraicoUserInfo | null;
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
        <Star key={i} size={10} fill="currentColor" />
      ))}
    </span>
  );
}

function FeatureBadge({ label }: { label: string }) {
  const iconMap: Record<string, typeof Zap> = {
    "Image input": ImageIcon,
    "Web search": Globe,
  };
  const Icon = iconMap[label] || Zap;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        background: "rgba(174, 122, 255, 0.1)",
        color: "var(--bru-purple)",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <Icon size={10} />
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
    let result = models.filter((m) => !m.modelType || m.modelType === "chat");

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
  }, [models, search, providerFilter, sort]);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const chipBase: React.CSSProperties = {
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(0,0,0,0.15)",
    cursor: "pointer",
    background: "var(--bru-white)",
    color: "var(--bru-black)",
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    borderColor: "var(--bru-purple)",
    background: "var(--bru-purple)",
    color: "var(--bru-white)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--bru-space-3)",
      }}
    >
      {/* Account Bar */}
      {userInfo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--bru-space-3)",
            padding: "var(--bru-space-2)",
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.25)",
          }}
        >
          <Coins size={14} style={{ color: "#d97706" }} />
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
          gap: "var(--bru-space-2)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--bru-grey)",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="bru-input"
            style={{ width: "100%", paddingLeft: 32, fontSize: 12 }}
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bru-select"
          style={{ width: "100%", fontSize: 12 }}
        >
          <option value="quality">Sort: Quality Rating</option>
          <option value="price-asc">Sort: Price (low to high)</option>
          <option value="price-desc">Sort: Price (high to low)</option>
          <option value="newest">Sort: Newest First</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--bru-space-4) 0",
            gap: "var(--bru-space-2)",
            fontSize: 12,
            color: "var(--bru-grey)",
          }}
        >
          <Loader size={14} className="animate-spin" />
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
                    ? "2px solid var(--bru-purple)"
                    : "var(--bru-border)",
                  background: isSelected
                    ? "rgba(174, 122, 255, 0.05)"
                    : "var(--bru-white)",
                  cursor: "pointer",
                  fontFamily: "var(--bru-font-primary)",
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
                        color: "var(--bru-grey)",
                      }}
                    >
                      {model.pricing && (
                        <span title="Cost per 100 words">
                          <Coins
                            size={10}
                            style={{
                              display: "inline",
                              marginRight: 2,
                              verticalAlign: "-1px",
                            }}
                          />
                          {model.pricing.coins}/{model.pricing.words}w
                        </span>
                      )}
                      {!model.pricing && model.creditsPerInputToken != null && (
                        <span title="Credits per token (in/out)">
                          <Coins
                            size={10}
                            style={{
                              display: "inline",
                              marginRight: 2,
                              verticalAlign: "-1px",
                            }}
                          />
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
                          fontSize: 10,
                          color: "var(--bru-grey)",
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
                    fontSize: 10,
                    color: "var(--bru-purple)",
                    fontWeight: 700,
                    borderLeft: "2px solid var(--bru-purple)",
                    borderRight: "2px solid var(--bru-purple)",
                    borderBottom: "2px solid var(--bru-purple)",
                    background: "rgba(174, 122, 255, 0.05)",
                    cursor: "pointer",
                    fontFamily: "var(--bru-font-primary)",
                  }}
                >
                  {isExpanded ? (
                    <>
                      Hide details <ChevronUp size={10} />
                    </>
                  ) : (
                    <>
                      Show details <ChevronDown size={10} />
                    </>
                  )}
                </button>
              )}

              {isSelected && isExpanded && (
                <div
                  style={{
                    borderLeft: "2px solid var(--bru-purple)",
                    borderRight: "2px solid var(--bru-purple)",
                    borderBottom: "2px solid var(--bru-purple)",
                    background: "rgba(174, 122, 255, 0.05)",
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
                        color: "var(--bru-grey)",
                        lineHeight: 1.4,
                      }}
                    >
                      {model.description}
                    </p>
                  )}
                  {model.pricing && (
                    <p style={{ fontSize: 11, color: "var(--bru-grey)" }}>
                      <Coins
                        size={11}
                        style={{
                          display: "inline",
                          marginRight: 4,
                          verticalAlign: "-1px",
                          color: "#d97706",
                        }}
                      />
                      ~{model.pricing.coins} coins per {model.pricing.words}{" "}
                      words
                    </p>
                  )}
                  {!model.pricing && model.creditsPerInputToken != null && (
                    <p style={{ fontSize: 11, color: "var(--bru-grey)" }}>
                      <Coins
                        size={11}
                        style={{
                          display: "inline",
                          marginRight: 4,
                          verticalAlign: "-1px",
                          color: "#d97706",
                        }}
                      />
                      {model.creditsPerInputToken} credits/input token &middot;{" "}
                      {model.creditsPerOutputToken ?? 0} credits/output token
                    </p>
                  )}
                  {model.maxTokens && (
                    <p style={{ fontSize: 11, color: "var(--bru-grey)" }}>
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
                          color: "#16a34a",
                          marginBottom: 4,
                        }}
                      >
                        <ThumbsUp size={10} /> Strengths
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
                              color: "var(--bru-grey)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "#22c55e",
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
                          color: "#ef4444",
                          marginBottom: 4,
                        }}
                      >
                        <ThumbsDown size={10} /> Weaknesses
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
                              color: "var(--bru-grey)",
                              paddingLeft: 12,
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color: "#f87171",
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
              color: "var(--bru-grey)",
              textAlign: "center",
              padding: "var(--bru-space-4) 0",
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
            paddingTop: "var(--bru-space-2)",
            borderTop: "var(--bru-border)",
          }}
        >
          <p style={{ fontSize: 10, color: "var(--bru-grey)" }}>
            Selected:{" "}
            <span style={{ fontWeight: 700, color: "var(--bru-black)" }}>
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
