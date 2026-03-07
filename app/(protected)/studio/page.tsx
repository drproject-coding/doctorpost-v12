"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@bruddle/react";
import {
  Zap,
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Smartphone,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { parseSSEStream } from "@/lib/sse";

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostFormat = "simple" | "visual" | "carousel";
type PipelineStage =
  | "idle"
  | "strategist"
  | "writer"
  | "scorer"
  | "formatter"
  | "visual"
  | "complete"
  | "error";

interface StrategyOutput {
  angle: string;
  hook_type: string;
  hook_example: string;
  key_points: string[];
  pillar: string;
  pillar_name: string;
  icp_label: string;
  word_count_target: number;
  strategic_note: string;
}

interface ScoreBreakdownItem {
  criterion: string;
  score: number;
  max: number;
  percentage: number;
  feedback: string;
  status: "excellent" | "good" | "needs_improvement";
}

interface ScoreOutput {
  total: number;
  pass: boolean;
  breakdown: ScoreBreakdownItem[];
  suggestions: string[];
  strengths: string[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const STAGE_ORDER = ["strategist", "writer", "scorer", "formatter"] as const;
type StageName = (typeof STAGE_ORDER)[number];

const STAGE_META: Record<StageName, { label: string; description: string }> = {
  strategist: {
    label: "Strategist",
    description: "Analyzing topic & building strategic brief",
  },
  writer: {
    label: "Writer",
    description: "Writing your LinkedIn post draft",
  },
  scorer: {
    label: "Scorer",
    description: "Scoring the post against quality rubric",
  },
  formatter: {
    label: "Formatter",
    description: "Applying perfect LinkedIn formatting",
  },
};

function PipelineProgress({
  stage,
  completedStages,
}: {
  stage: PipelineStage;
  completedStages: Set<string>;
}) {
  const isComplete = stage === "complete";
  const activeIndex = STAGE_ORDER.indexOf(stage as StageName);
  const completedCount = completedStages.size;
  const stepNum = isComplete ? 4 : activeIndex >= 0 ? activeIndex + 1 : 1;
  const activeMeta =
    activeIndex >= 0 ? STAGE_META[STAGE_ORDER[activeIndex]] : null;
  const pct = isComplete ? 100 : Math.round((completedCount / 4) * 100);

  return (
    <Card variant="raised" style={{ marginBottom: 16 }}>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: "var(--bru-black)",
                whiteSpace: "nowrap",
              }}
            >
              {isComplete ? "Complete" : `Step ${stepNum} / 4`}
            </span>
            {activeMeta && !isComplete && (
              <>
                <span style={{ color: "#ccc", fontSize: 12 }}>·</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--bru-purple)",
                  }}
                >
                  {activeMeta.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--bru-grey)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeMeta.description}
                </span>
              </>
            )}
            {isComplete && (
              <span style={{ fontSize: 13, color: "#00A896", fontWeight: 700 }}>
                All stages complete
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: isComplete ? "#00A896" : "var(--bru-purple)",
              marginLeft: 12,
              whiteSpace: "nowrap",
            }}
          >
            {pct}%
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {STAGE_ORDER.map((s) => {
            const isDone = completedStages.has(s);
            const isActive = stage === s;
            return (
              <div key={s} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: isDone
                      ? "#00A896"
                      : isActive
                        ? "var(--bru-purple)"
                        : "#e8e8e8",
                    position: "relative",
                    overflow: "hidden",
                    transition: "background 0.4s ease",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "40%",
                        height: "100%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                        animation: "bru-shimmer 1.4s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: isDone || isActive ? 700 : 400,
                    color: isDone
                      ? "#00A896"
                      : isActive
                        ? "var(--bru-purple)"
                        : "#b0b0b0",
                    marginTop: 5,
                    textAlign: "center",
                    letterSpacing: 0.3,
                    transition: "color 0.3s",
                  }}
                >
                  {STAGE_META[s].label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function renderStageContent(
  name: StageName,
  raw: string,
  isActive: boolean,
): React.ReactNode {
  if (!raw) return null;

  const preStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
    color: "var(--bru-black)",
    maxHeight: 280,
    overflow: "auto",
    background: "#f9f7f3",
    padding: 12,
    border: "1px solid #e5e5e5",
  };

  // Writer: show streaming text as-is
  if (name === "writer") {
    return <pre style={preStyle}>{raw}</pre>;
  }

  // JSON stages: only render once content can be parsed (not while streaming)
  const clean = stripJsonFences(raw);

  if (name === "strategist") {
    try {
      const d = JSON.parse(clean) as {
        angle?: string;
        hook_example?: string;
        key_points?: string[];
        pillar_name?: string;
        icp_label?: string;
      };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {d.angle && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--bru-black)",
                lineHeight: 1.4,
              }}
            >
              {d.angle}
            </p>
          )}
          {d.hook_example && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#555",
                fontStyle: "italic",
                borderLeft: "3px solid var(--bru-purple)",
                paddingLeft: 10,
                lineHeight: 1.5,
              }}
            >
              "{d.hook_example}"
            </p>
          )}
          {d.key_points && d.key_points.length > 0 && (
            <ul
              style={{
                margin: 0,
                padding: "0 0 0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {d.key_points.slice(0, 4).map((pt, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--bru-black)",
                    lineHeight: 1.4,
                  }}
                >
                  {pt}
                </li>
              ))}
            </ul>
          )}
          {(d.pillar_name ?? d.icp_label) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {d.pillar_name && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "rgba(100,60,220,0.1)",
                    color: "var(--bru-purple)",
                    padding: "2px 7px",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {d.pillar_name}
                </span>
              )}
              {d.icp_label && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--bru-grey)",
                    padding: "2px 0",
                  }}
                >
                  {d.icp_label}
                </span>
              )}
            </div>
          )}
        </div>
      );
    } catch {
      return isActive ? null : <pre style={preStyle}>{raw}</pre>;
    }
  }

  if (name === "scorer") {
    try {
      const d = JSON.parse(clean) as {
        total?: number;
        pass?: boolean;
        breakdown?: {
          criterion: string;
          score: number;
          max: number;
          status: string;
          feedback: string;
        }[];
        strengths?: string[];
      };
      const color =
        (d.total ?? 0) >= 75
          ? "#00A896"
          : (d.total ?? 0) >= 60
            ? "#FF6C01"
            : "#E99898";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `3px solid ${color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}
              >
                {d.total}
              </span>
              <span style={{ fontSize: 9, color: "var(--bru-grey)" }}>
                /100
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color,
                  background: `${color}18`,
                  padding: "2px 8px",
                  letterSpacing: 0.5,
                  textTransform: "uppercase" as const,
                  display: "inline-block",
                  marginBottom: 4,
                }}
              >
                {d.pass ? "PASS" : "NEEDS WORK"}
              </span>
              {d.strengths?.[0] && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#555",
                    lineHeight: 1.4,
                  }}
                >
                  {d.strengths[0]}
                </p>
              )}
            </div>
          </div>
          {d.breakdown && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {d.breakdown.map((b) => {
                const pct = Math.round((b.score / b.max) * 100);
                const bc =
                  b.status === "excellent"
                    ? "#00A896"
                    : b.status === "good"
                      ? "#FF6C01"
                      : "#E99898";
                return (
                  <div
                    key={b.criterion}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--bru-grey)",
                        width: 110,
                        flexShrink: 0,
                        fontWeight: 600,
                      }}
                    >
                      {b.criterion}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: "#e8e8e8",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: bc,
                          borderRadius: 3,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: bc,
                        width: 30,
                        textAlign: "right",
                      }}
                    >
                      {b.score}/{b.max}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } catch {
      return isActive ? null : <pre style={preStyle}>{raw}</pre>;
    }
  }

  if (name === "formatter") {
    try {
      const d = JSON.parse(clean) as {
        post_text?: string;
        post?: string;
        character_count?: number;
        slides?: { number?: number; title?: string; body?: string }[];
      };
      const text = d.post_text ?? d.post ?? "";
      if (d.slides && d.slides.length > 0) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {text && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--bru-grey)",
                  fontStyle: "italic",
                  borderLeft: "3px solid #e5e5e5",
                  paddingLeft: 8,
                  lineHeight: 1.4,
                }}
              >
                {text.slice(0, 120)}
                {text.length > 120 ? "..." : ""}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {d.slides.slice(0, 6).map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--bru-purple)",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      paddingTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span
                      style={{ fontWeight: 700, color: "var(--bru-black)" }}
                    >
                      {s.title}
                    </span>
                    {s.body && (
                      <span style={{ color: "#555", marginLeft: 6 }}>
                        — {s.body.slice(0, 70)}
                        {s.body.length > 70 ? "..." : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {d.slides.length > 6 && (
                <span style={{ fontSize: 11, color: "var(--bru-grey)" }}>
                  +{d.slides.length - 6} more slides
                </span>
              )}
            </div>
          </div>
        );
      }
      return <pre style={{ ...preStyle, maxHeight: 200 }}>{text}</pre>;
    } catch {
      return isActive ? null : null;
    }
  }

  return null;
}

function StageCard({
  name,
  currentStage,
  content,
  isComplete,
}: {
  name: StageName;
  currentStage: PipelineStage;
  content: string;
  isComplete: boolean;
}) {
  const isActive = currentStage === name;
  const isPending = !isComplete && !isActive;
  const meta = STAGE_META[name];

  return (
    <Card
      variant="raised"
      style={{
        marginBottom: 12,
        borderLeft: isActive
          ? "4px solid var(--bru-purple)"
          : isComplete
            ? "4px solid #00A896"
            : "4px solid #e5e5e5",
        opacity: isPending ? 0.4 : 1,
        transition: "opacity 0.3s, border-left-color 0.3s",
      }}
    >
      {isActive && (
        <div
          style={{
            height: 3,
            background: "#e8e8e8",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "35%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, var(--bru-purple), transparent)",
              animation: "bru-shimmer 1.2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: content ? 12 : 0,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: isActive
                ? "var(--bru-purple)"
                : isComplete
                  ? "#00A896"
                  : "var(--bru-grey)",
            }}
          >
            {meta.label}
          </span>
          <span style={{ fontSize: 12, color: "var(--bru-grey)", flex: 1 }}>
            {isActive ? meta.description : isComplete ? "Done" : "Waiting..."}
          </span>
          {isActive && (
            <Loader
              size={15}
              color="var(--bru-purple)"
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
          )}
          {isComplete && (
            <CheckCircle size={15} color="#00A896" style={{ flexShrink: 0 }} />
          )}
        </div>

        {renderStageContent(name, content, isActive)}
      </div>
    </Card>
  );
}

function VisualStageCard({
  currentStage,
  imageUrl,
  promptUsed,
  isComplete,
  error,
}: {
  currentStage: PipelineStage;
  imageUrl: string | null;
  promptUsed: string | null;
  isComplete: boolean;
  error: string | null;
}) {
  const isActive = currentStage === "visual";
  const isPending = !isComplete && !isActive;

  return (
    <Card
      variant="raised"
      style={{
        marginBottom: 12,
        borderLeft: isActive
          ? "4px solid var(--bru-purple)"
          : isComplete
            ? "4px solid #00A896"
            : error
              ? "4px solid #E99898"
              : "4px solid #e5e5e5",
        opacity: isPending ? 0.4 : 1,
        transition: "opacity 0.3s, border-left-color 0.3s",
      }}
    >
      {isActive && (
        <div
          style={{
            height: 3,
            background: "#e8e8e8",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "35%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, var(--bru-purple), transparent)",
              animation: "bru-shimmer 1.2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: isComplete && imageUrl ? 14 : 0,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: isActive
                ? "var(--bru-purple)"
                : isComplete
                  ? "#00A896"
                  : error
                    ? "#E99898"
                    : "var(--bru-grey)",
            }}
          >
            Visual
          </span>
          <span
            style={{
              fontSize: 12,
              color: error ? "#E99898" : "var(--bru-grey)",
              flex: 1,
            }}
          >
            {isActive
              ? "Generating image..."
              : error
                ? error
                : isComplete
                  ? "Done"
                  : "Waiting..."}
          </span>
          {isActive && (
            <Loader
              size={15}
              color="var(--bru-purple)"
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
          )}
          {isComplete && (
            <CheckCircle size={15} color="#00A896" style={{ flexShrink: 0 }} />
          )}
        </div>

        {isComplete && imageUrl && (
          <div>
            {/* External AI image — next/image needs remotePatterns for dynamic CDN URLs */}
            <img
              src={imageUrl}
              alt="AI-generated visual"
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                display: "block",
                border: "1px solid #e5e5e5",
              }}
            />
            {promptUsed && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 11,
                  color: "var(--bru-grey)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                {promptUsed.slice(0, 140)}
                {promptUsed.length > 140 ? "…" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? "#00A896" : score >= 60 ? "#FF6C01" : "#E99898";
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        border: `6px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontSize: 10, color: "var(--bru-grey)" }}>/100</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StudioPage() {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<PostFormat>("simple");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [stageContent, setStageContent] = useState<Record<string, string>>({});
  const [completedStages, setCompletedStages] = useState<Set<string>>(
    new Set(),
  );
  const [strategy, setStrategy] = useState<StrategyOutput | null>(null);
  const [postText, setPostText] = useState("");
  const [score, setScore] = useState<ScoreOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [visualPrompt, setVisualPrompt] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"preview" | "score" | "details">(
    "preview",
  );
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "mobile",
  );
  const [showMore, setShowMore] = useState(false);

  const appendContent = useCallback((stageName: string, text: string) => {
    setStageContent((prev) => ({
      ...prev,
      [stageName]: (prev[stageName] ?? "") + text,
    }));
  }, []);

  const markComplete = useCallback((stageName: string) => {
    setCompletedStages((prev) => new Set([...prev, stageName]));
  }, []);

  const runPipeline = useCallback(async () => {
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 10) {
      setError("Please enter a topic of at least 10 characters.");
      return;
    }

    setError(null);
    setStageContent({});
    setCompletedStages(new Set());
    setStrategy(null);
    setPostText("");
    setScore(null);
    setSavedId(null);
    setImageUrl(null);
    setVisualPrompt(null);
    setVisualError(null);
    setResultTab("preview");
    setShowMore(false);

    // ── Stage 1: Strategist ──────────────────────────────────────────────────
    setStage("strategist");
    let strategistRaw = "";

    try {
      const res = await fetch("/api/studio/strategist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmedTopic, format }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string; message?: string };
        throw new Error(
          err.message ?? err.error ?? `Strategist error (${res.status})`,
        );
      }

      for await (const event of parseSSEStream(res)) {
        if (event.type === "token") {
          strategistRaw += event.content;
          appendContent("strategist", event.content);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      const parsedStrategy = JSON.parse(
        stripJsonFences(strategistRaw),
      ) as StrategyOutput;
      setStrategy(parsedStrategy);
      markComplete("strategist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Strategist stage failed");
      setStage("error");
      return;
    }

    // ── Stage 2: Writer ──────────────────────────────────────────────────────
    setStage("writer");
    let writerRaw = "";

    try {
      const strategyParsed = JSON.parse(
        stripJsonFences(strategistRaw),
      ) as StrategyOutput;
      const res = await fetch("/api/studio/writer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: strategyParsed, format }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string; message?: string };
        throw new Error(
          err.message ?? err.error ?? `Writer error (${res.status})`,
        );
      }

      for await (const event of parseSSEStream(res)) {
        if (event.type === "token") {
          writerRaw += event.content;
          appendContent("writer", event.content);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      setPostText(writerRaw);
      markComplete("writer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Writer stage failed");
      setStage("error");
      return;
    }

    // ── Stage 3: Scorer ──────────────────────────────────────────────────────
    setStage("scorer");
    let scorerRaw = "";
    let parsedScore: ScoreOutput | null = null;

    try {
      const strategyParsed = JSON.parse(
        stripJsonFences(strategistRaw),
      ) as StrategyOutput;
      const res = await fetch("/api/studio/scorer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_text: writerRaw,
          strategy: strategyParsed,
          format,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string; message?: string };
        throw new Error(
          err.message ?? err.error ?? `Scorer error (${res.status})`,
        );
      }

      for await (const event of parseSSEStream(res)) {
        if (event.type === "token") {
          scorerRaw += event.content;
          appendContent("scorer", event.content);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      parsedScore = JSON.parse(stripJsonFences(scorerRaw)) as ScoreOutput;
      setScore(parsedScore);
      markComplete("scorer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scorer stage failed");
      setStage("error");
      return;
    }

    // ── Stage 4: Formatter ───────────────────────────────────────────────────
    setStage("formatter");
    let formatterRaw = "";

    try {
      const res = await fetch("/api/studio/formatter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_text: writerRaw,
          format,
          score: parsedScore,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string; message?: string };
        throw new Error(
          err.message ?? err.error ?? `Formatter error (${res.status})`,
        );
      }

      for await (const event of parseSSEStream(res)) {
        if (event.type === "token") {
          formatterRaw += event.content;
          appendContent("formatter", event.content);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      markComplete("formatter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Formatter stage failed");
      setStage("error");
      return;
    }

    // ── Stage 5: Visual (only for visual/carousel formats) ───────────────────
    if (format !== "simple") {
      setStage("visual");
      try {
        const res = await fetch("/api/studio/visual", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_text: writerRaw, format }),
        });

        if (!res.ok) {
          const err = (await res.json()) as {
            error?: string;
            message?: string;
          };
          throw new Error(
            err.message ?? err.error ?? `Visual error (${res.status})`,
          );
        }

        for await (const event of parseSSEStream(res)) {
          if (event.type === "stage_complete" && event.stage === "visual") {
            const meta = event.metadata as {
              image_url?: string;
              prompt_used?: string;
            };
            setImageUrl(meta?.image_url ?? null);
            setVisualPrompt(meta?.prompt_used ?? null);
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }

        markComplete("visual");
      } catch (err) {
        // Visual is non-fatal — log error but continue to complete
        setVisualError(
          err instanceof Error ? err.message : "Visual generation failed",
        );
        markComplete("visual");
      }
    }

    // ── Complete + Auto-save ─────────────────────────────────────────────────
    setStage("complete");

    try {
      const strategyParsed = JSON.parse(
        stripJsonFences(strategistRaw),
      ) as StrategyOutput;
      let formattedParsed: Record<string, unknown> = {};
      try {
        formattedParsed = JSON.parse(stripJsonFences(formatterRaw)) as Record<
          string,
          unknown
        >;
      } catch {
        // Formatter output not valid JSON — store raw
      }

      const saveRes = await fetch("/api/data/create/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: trimmedTopic,
          format,
          post_text: writerRaw,
          score: parsedScore?.total ?? 0,
          score_breakdown: JSON.stringify(parsedScore?.breakdown ?? []),
          score_suggestions: JSON.stringify(parsedScore?.suggestions ?? []),
          formatted_output: JSON.stringify(formattedParsed),
          strategy_output: JSON.stringify(strategyParsed),
          status: "draft",
          is_favorite: false,
        }),
      });

      if (saveRes.ok) {
        const saved = (await saveRes.json()) as { id?: string };
        if (saved.id) setSavedId(saved.id);
      }
    } catch {
      // Auto-save is non-fatal — user can still copy the post
    }
  }, [topic, format, appendContent, markComplete]);

  const handleCopy = async () => {
    const text = stageContent.writer ?? postText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStage("idle");
    setStageContent({});
    setCompletedStages(new Set());
    setStrategy(null);
    setPostText("");
    setScore(null);
    setSavedId(null);
    setError(null);
    setImageUrl(null);
    setVisualPrompt(null);
    setVisualError(null);
    setResultTab("preview");
    setShowMore(false);
  };

  const isRunning = [
    "strategist",
    "writer",
    "scorer",
    "formatter",
    "visual",
  ].includes(stage);
  const isComplete = stage === "complete";
  const hasPost = !!(stageContent.writer ?? postText);

  // Derive final post text — formatter output when available, fall back to writer
  const formatterContent = stageContent.formatter ?? "";
  let finalPostText = stageContent.writer ?? postText;
  if (formatterContent) {
    try {
      const d = JSON.parse(stripJsonFences(formatterContent)) as {
        post_text?: string;
        post?: string;
      };
      finalPostText = d.post_text ?? d.post ?? finalPostText;
    } catch {
      // formatter still streaming or not JSON
    }
  }

  // LinkedIn preview fold
  const FOLD_CHARS = { mobile: 210, desktop: 280 };
  const foldAt = FOLD_CHARS[previewMode];
  const isTruncated = finalPostText.length > foldAt;
  const displayContent =
    isTruncated && !showMore ? finalPostText.slice(0, foldAt) : finalPostText;
  const containerWidth = previewMode === "mobile" ? 375 : 550;


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bru-cream)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "0 0 6px",
              color: "var(--bru-black)",
            }}
          >
            Studio
          </h1>
          <p style={{ margin: 0, color: "var(--bru-grey)", fontSize: 14 }}>
            4-agent AI pipeline: Strategist → Writer → Scorer → Formatter
          </p>
        </div>

        {/* 2-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ── LEFT: Sticky sidebar ─────────────────────────────────────── */}
          <div style={{ position: "sticky", top: 24 }}>
            {/* Post Brief */}
            <Card variant="raised" style={{ marginBottom: 12 }}>
              <div style={{ padding: 20 }}>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    margin: "0 0 16px",
                    color: "var(--bru-black)",
                  }}
                >
                  Post Brief
                </h2>

                {/* Topic */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                      color: "var(--bru-black)",
                    }}
                  >
                    Topic / Prompt
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isRunning}
                    placeholder="What do you want to write about? Be specific — include your angle, context, or key insight."
                    style={{
                      width: "100%",
                      minHeight: 100,
                      padding: "10px 12px",
                      border: "2px solid var(--bru-black)",
                      background: "var(--bru-cream)",
                      fontFamily: "inherit",
                      fontSize: 13,
                      lineHeight: 1.5,
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                      color: "var(--bru-black)",
                    }}
                  />
                </div>

                {/* Format */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 10,
                      color: "var(--bru-black)",
                    }}
                  >
                    Format
                  </label>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {(["simple", "visual", "carousel"] as PostFormat[]).map(
                      (f) => (
                        <label
                          key={f}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            cursor: isRunning ? "default" : "pointer",
                            padding: "8px 10px",
                            border: `2px solid ${format === f ? "var(--bru-purple)" : "#ccc"}`,
                            background:
                              format === f
                                ? "rgba(99,29,237,0.05)"
                                : "var(--bru-cream)",
                            transition: "border-color 0.15s",
                          }}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={f}
                            checked={format === f}
                            onChange={() => !isRunning && setFormat(f)}
                            style={{
                              accentColor: "var(--bru-purple)",
                              marginTop: 2,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                textTransform: "capitalize",
                              }}
                            >
                              {f}
                            </div>
                            <div
                              style={{ fontSize: 11, color: "var(--bru-grey)" }}
                            >
                              {f === "simple" && "Single text post"}
                              {f === "visual" && "Post + visual brief"}
                              {f === "carousel" && "Multi-slide carousel"}
                            </div>
                          </div>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={() => void runPipeline()}
                  disabled={isRunning || topic.trim().length < 10}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    background:
                      isRunning || topic.trim().length < 10
                        ? "#aaa"
                        : "var(--bru-purple)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: 0.5,
                    cursor:
                      isRunning || topic.trim().length < 10
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.15s",
                  }}
                >
                  {isRunning ? (
                    <>
                      <Loader
                        size={15}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Running…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Generate
                    </>
                  )}
                </button>

                {isComplete && (
                  <button
                    onClick={handleReset}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "10px 0",
                      background: "transparent",
                      border: "2px solid var(--bru-black)",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      color: "var(--bru-black)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={13} /> New Post
                  </button>
                )}
              </div>
            </Card>

            {/* Pipeline progress — compact, only when not idle */}
            {stage !== "idle" && (
              <PipelineProgress
                stage={stage}
                completedStages={completedStages}
              />
            )}

            {/* Score summary — only when complete */}
            {isComplete && score && (
              <Card variant="raised" style={{ marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <ScoreCircle score={score.total} />
                    <div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 10px",
                          background: score.pass ? "#00A896" : "#FF6C01",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 11,
                          marginBottom: 6,
                        }}
                      >
                        {score.pass ? (
                          <>
                            <CheckCircle size={11} /> PASS
                          </>
                        ) : (
                          <>
                            <AlertCircle size={11} /> NEEDS WORK
                          </>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "var(--bru-grey)",
                        }}
                      >
                        Threshold: 75/100
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Action buttons — copy + library */}
            {isComplete && hasPost && (
              <Card variant="raised">
                <div style={{ padding: 16 }}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <button
                      onClick={() => void handleCopy()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "12px 0",
                        border: "2px solid var(--bru-black)",
                        background: copied ? "#00A896" : "var(--bru-cream)",
                        color: copied ? "#fff" : "var(--bru-black)",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "background 0.2s",
                        width: "100%",
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy Post"}
                    </button>

                    {savedId && (
                      <a
                        href={`/library/${savedId}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 0",
                          background: "var(--bru-purple)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={14} />
                        View in Library
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Main content area ──────────────────────────────────── */}
          <div>
            {/* Idle state */}
            {stage === "idle" && (
              <Card variant="flat">
                <div
                  style={{
                    padding: 64,
                    textAlign: "center",
                    color: "var(--bru-grey)",
                  }}
                >
                  <Zap
                    size={48}
                    style={{ marginBottom: 16, opacity: 0.25 }}
                  />
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      margin: "0 0 8px",
                      color: "var(--bru-black)",
                    }}
                  >
                    Ready to create
                  </p>
                  <p style={{ fontSize: 14, margin: 0 }}>
                    Enter a topic and click Generate to run the 4-agent pipeline
                  </p>
                </div>
              </Card>
            )}

            {/* Running state — show completed stages + active stage only */}
            {isRunning && (
              <>
                {STAGE_ORDER.map((stageName) => {
                  const isActive = stage === stageName;
                  const isDone = completedStages.has(stageName);
                  if (!isActive && !isDone) return null;
                  return (
                    <StageCard
                      key={stageName}
                      name={stageName}
                      currentStage={stage}
                      content={stageContent[stageName] ?? ""}
                      isComplete={isDone}
                    />
                  );
                })}
                {format !== "simple" &&
                  (stage === "visual" ||
                    completedStages.has("visual") ||
                    visualError !== null) && (
                    <VisualStageCard
                      currentStage={stage}
                      imageUrl={imageUrl}
                      promptUsed={visualPrompt}
                      isComplete={completedStages.has("visual")}
                      error={visualError}
                    />
                  )}
              </>
            )}

            {/* Complete state — tabbed results */}
            {isComplete && (
              <div>
                {/* Tab bar */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "2px solid #e0e0e0",
                    marginBottom: 16,
                  }}
                >
                  {(["preview", "score", "details"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResultTab(tab)}
                      style={{
                        padding: "10px 20px",
                        fontWeight: 700,
                        fontSize: 13,
                        border: "none",
                        borderBottom:
                          resultTab === tab
                            ? "2px solid var(--bru-purple)"
                            : "2px solid transparent",
                        marginBottom: -2,
                        background: "transparent",
                        color:
                          resultTab === tab
                            ? "var(--bru-purple)"
                            : "var(--bru-grey)",
                        cursor: "pointer",
                      }}
                    >
                      {tab === "preview"
                        ? "LinkedIn Preview"
                        : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Preview tab */}
                {resultTab === "preview" && (
                  <Card variant="raised">
                    <div style={{ padding: 20 }}>
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                          LinkedIn Preview
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {/* Mobile / Desktop toggle */}
                          <div
                            style={{
                              display: "flex",
                              border: "1px solid #e0e0e0",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              onClick={() => {
                                setPreviewMode("mobile");
                                setShowMore(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "5px 10px",
                                fontSize: 12,
                                background:
                                  previewMode === "mobile"
                                    ? "var(--bru-purple)"
                                    : "transparent",
                                color:
                                  previewMode === "mobile"
                                    ? "white"
                                    : "var(--bru-grey)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Smartphone size={12} />
                              Mobile
                            </button>
                            <button
                              onClick={() => {
                                setPreviewMode("desktop");
                                setShowMore(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "5px 10px",
                                fontSize: 12,
                                background:
                                  previewMode === "desktop"
                                    ? "var(--bru-purple)"
                                    : "transparent",
                                color:
                                  previewMode === "desktop"
                                    ? "white"
                                    : "var(--bru-grey)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Monitor size={12} />
                              Desktop
                            </button>
                          </div>

                          {/* Copy */}
                          <button
                            onClick={() => void handleCopy()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              border: "2px solid var(--bru-black)",
                              background: copied ? "#00A896" : "transparent",
                              color: copied ? "white" : "var(--bru-black)",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied!" : "Copy"}
                          </button>

                          {/* Library link */}
                          {savedId && (
                            <a
                              href={`/library/${savedId}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                background: "var(--bru-purple)",
                                color: "white",
                                fontWeight: 700,
                                fontSize: 13,
                                textDecoration: "none",
                              }}
                            >
                              <ExternalLink size={14} />
                              View in Library
                            </a>
                          )}
                        </div>
                      </div>

                      {/* LinkedIn card */}
                      <div
                        style={{
                          maxWidth: containerWidth,
                          margin: "0 auto",
                          background: "white",
                          borderRadius: 8,
                          boxShadow:
                            "0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.1)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Post header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 16px",
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: "var(--bru-purple)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          >
                            Y
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#191919",
                              }}
                            >
                              Your Name
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#666666",
                                lineHeight: 1.3,
                              }}
                            >
                              Your headline here
                            </div>
                            <div style={{ fontSize: 12, color: "#666666" }}>
                              Just now
                            </div>
                          </div>
                        </div>

                        {/* Post content */}
                        <div style={{ padding: "0 16px 12px" }}>
                          <pre
                            style={{
                              fontSize: 14,
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                              wordWrap: "break-word",
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              margin: 0,
                              color: "#191919",
                            }}
                          >
                            {displayContent || "(No content)"}
                            {isTruncated && !showMore && "..."}
                          </pre>
                          {isTruncated && !showMore && (
                            <button
                              onClick={() => setShowMore(true)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#666666",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                padding: "4px 0",
                                display: "block",
                              }}
                            >
                              ...see more
                            </button>
                          )}
                          {showMore && isTruncated && (
                            <button
                              onClick={() => setShowMore(false)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#666666",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                padding: "4px 0",
                                display: "block",
                              }}
                            >
                              show less
                            </button>
                          )}
                        </div>

                        {/* Engagement bar */}
                        <div
                          style={{
                            padding: "8px 16px",
                            borderTop: "1px solid #e0e0e0",
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "#666666",
                          }}
                        >
                          <span>0 reactions</span>
                          <span>0 comments</span>
                        </div>

                        {/* Action bar */}
                        <div
                          style={{
                            padding: "4px 16px 8px",
                            borderTop: "1px solid #e0e0e0",
                            display: "flex",
                            justifyContent: "space-around",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#666666",
                          }}
                        >
                          <span>Like</span>
                          <span>Comment</span>
                          <span>Repost</span>
                          <span>Send</span>
                        </div>
                      </div>

                      {/* Fold indicator */}
                      <div
                        style={{
                          marginTop: 12,
                          textAlign: "center",
                          fontSize: 12,
                          color: "var(--bru-grey)",
                        }}
                      >
                        Hook is{" "}
                        <strong
                          style={{
                            color:
                              finalPostText.length <= foldAt
                                ? "var(--bru-success-dark, #2d7a3a)"
                                : "var(--bru-error-dark, #c0392b)",
                          }}
                        >
                          {finalPostText.length <= foldAt ? "above" : "below"}
                        </strong>{" "}
                        the fold on {previewMode}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          textAlign: "center",
                          fontSize: 11,
                          color: "var(--bru-grey)",
                        }}
                      >
                        {finalPostText.length} characters
                      </div>
                    </div>
                  </Card>
                )}

                {/* Score tab */}
                {resultTab === "score" && score && (
                  <Card variant="raised">
                    <div style={{ padding: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          marginBottom: 20,
                        }}
                      >
                        <ScoreCircle score={score.total} />
                        <div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 10px",
                              background: score.pass ? "#00A896" : "#FF6C01",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: 11,
                              marginBottom: 6,
                            }}
                          >
                            {score.pass ? (
                              <>
                                <CheckCircle size={11} /> PASS
                              </>
                            ) : (
                              <>
                                <AlertCircle size={11} /> NEEDS WORK
                              </>
                            )}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--bru-grey)",
                            }}
                          >
                            Threshold: 75/100
                          </p>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                          marginBottom: 20,
                        }}
                      >
                        {score.breakdown.map((item, i) => {
                          const ratio = item.score / item.max;
                          const barColor =
                            ratio >= 0.75
                              ? "#00A896"
                              : ratio >= 0.6
                                ? "#FF6C01"
                                : "#E99898";
                          return (
                            <div key={i}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <span style={{ fontSize: 13, fontWeight: 700 }}>
                                  {item.criterion}
                                </span>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: barColor,
                                  }}
                                >
                                  {item.score}/{item.max}
                                </span>
                              </div>
                              <div
                                style={{
                                  height: 5,
                                  background: "#eee",
                                  borderRadius: 3,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, ratio * 100)}%`,
                                    height: "100%",
                                    background: barColor,
                                    transition: "width 0.6s ease",
                                  }}
                                />
                              </div>
                              {item.feedback && (
                                <p
                                  style={{
                                    margin: "4px 0 0",
                                    fontSize: 12,
                                    color: "var(--bru-grey)",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item.feedback}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Strengths */}
                      {score.strengths.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              color: "#00A896",
                            }}
                          >
                            Strengths
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {score.strengths.map((s, i) => (
                              <p
                                key={i}
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  color: "var(--bru-black)",
                                  paddingLeft: 10,
                                  borderLeft: "2px solid #00A896",
                                }}
                              >
                                {s}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {score.suggestions.length > 0 && (
                        <div>
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              color: "#FF6C01",
                            }}
                          >
                            Suggestions
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {score.suggestions.map((s, i) => (
                              <p
                                key={i}
                                style={{
                                  margin: 0,
                                  fontSize: 13,
                                  color: "var(--bru-black)",
                                  paddingLeft: 10,
                                  borderLeft: "2px solid #FF6C01",
                                }}
                              >
                                {s}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Details tab */}
                {resultTab === "details" && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    {/* Strategy summary */}
                    {strategy && (
                      <Card variant="raised">
                        <div style={{ padding: 16 }}>
                          <h3
                            style={{
                              fontWeight: 800,
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              margin: "0 0 12px",
                            }}
                          >
                            Strategy
                          </h3>
                          {[
                            { label: "Angle", value: strategy.angle },
                            {
                              label: "Pillar",
                              value: strategy.pillar_name ?? strategy.pillar,
                            },
                            { label: "ICP", value: strategy.icp_label },
                            {
                              label: "Hook",
                              value: strategy.hook_type?.replace(/_/g, " "),
                            },
                            {
                              label: "Word Target",
                              value: strategy.word_count_target
                                ? `~${strategy.word_count_target} words`
                                : undefined,
                            },
                          ]
                            .filter((f) => f.value)
                            .map((field) => (
                              <div key={field.label} style={{ marginBottom: 10 }}>
                                <p
                                  style={{
                                    margin: "0 0 2px",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "var(--bru-grey)",
                                  }}
                                >
                                  {field.label}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--bru-black)",
                                  }}
                                >
                                  {field.value}
                                </p>
                              </div>
                            ))}
                        </div>
                      </Card>
                    )}

                    {/* Pipeline stage outputs */}
                    {STAGE_ORDER.map((stageName) => (
                      <StageCard
                        key={stageName}
                        name={stageName}
                        currentStage="complete"
                        content={stageContent[stageName] ?? ""}
                        isComplete={completedStages.has(stageName)}
                      />
                    ))}

                    {format !== "simple" && completedStages.has("visual") && (
                      <VisualStageCard
                        currentStage="complete"
                        imageUrl={imageUrl}
                        promptUsed={visualPrompt}
                        isComplete={true}
                        error={visualError}
                      />
                    )}
                  </div>
                )}

                {/* Auto-saved notice */}
                {savedId && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: "rgba(0,168,150,0.06)",
                      border: "1px solid rgba(0,168,150,0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <CheckCircle size={14} color="#00A896" />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#00A896",
                      }}
                    >
                      Auto-saved to Library
                    </span>
                    <a
                      href={`/library/${savedId}`}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--bru-purple)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        textDecoration: "none",
                      }}
                    >
                      View post <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <Card
                variant="raised"
                style={{ marginTop: 12, borderLeft: "4px solid #E99898" }}
              >
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <AlertCircle
                    size={16}
                    color="#E99898"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        margin: "0 0 4px",
                        color: "#E99898",
                      }}
                    >
                      Pipeline Error
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        margin: 0,
                        color: "var(--bru-black)",
                      }}
                    >
                      {error}
                    </p>
                    {(error.includes("API key") ||
                      error.includes("api key")) && (
                      <a
                        href="/settings"
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--bru-purple)",
                          textDecoration: "none",
                        }}
                      >
                        Go to Settings →
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
