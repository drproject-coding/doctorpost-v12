"use client";

import { useState, useCallback } from "react";
import { Button, Card } from "@bruddle/react";
import {
  Zap,
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { parseSSEStream } from "@/lib/sse";

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
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
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
            {meta.description}
          </span>
          {isActive && (
            <Loader
              size={16}
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
          )}
          {isComplete && (
            <CheckCircle size={16} color="#00A896" style={{ flexShrink: 0 }} />
          )}
        </div>

        {content && (
          <pre
            style={{
              fontFamily: "inherit",
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              color: "var(--bru-black)",
              maxHeight: name === "writer" ? 280 : 160,
              overflow: "auto",
              background: "#f9f7f3",
              padding: 12,
              border: "1px solid #e5e5e5",
            }}
          >
            {content}
          </pre>
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

      const parsedStrategy = JSON.parse(strategistRaw) as StrategyOutput;
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
      const strategyParsed = JSON.parse(strategistRaw) as StrategyOutput;
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
      const strategyParsed = JSON.parse(strategistRaw) as StrategyOutput;
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

      parsedScore = JSON.parse(scorerRaw) as ScoreOutput;
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

    // ── Complete + Auto-save ─────────────────────────────────────────────────
    setStage("complete");

    try {
      const strategyParsed = JSON.parse(strategistRaw) as StrategyOutput;
      let formattedParsed: Record<string, unknown> = {};
      try {
        formattedParsed = JSON.parse(formatterRaw) as Record<string, unknown>;
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
  };

  const isRunning = ["strategist", "writer", "scorer", "formatter"].includes(
    stage,
  );
  const isComplete = stage === "complete";
  const hasPost = !!(stageContent.writer ?? postText);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bru-cream)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
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

        {/* 3-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 280px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ── LEFT: Inputs ────────────────────────────────────────────────── */}
          <div>
            <Card variant="raised">
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
                      minHeight: 120,
                      padding: "10px 12px",
                      border: "2px solid var(--bru-black)",
                      background: "var(--bru-cream)",
                      fontFamily: "inherit",
                      fontSize: 14,
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
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
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
                            padding: "10px 12px",
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
                                fontSize: 13,
                                textTransform: "capitalize",
                              }}
                            >
                              {f}
                            </div>
                            <div
                              style={{ fontSize: 11, color: "var(--bru-grey)" }}
                            >
                              {f === "simple" &&
                                "Single text post, max 3000 chars"}
                              {f === "visual" && "Post + visual design brief"}
                              {f === "carousel" &&
                                "Multi-slide LinkedIn carousel"}
                            </div>
                          </div>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* Generate */}
                <button
                  onClick={() => void runPipeline()}
                  disabled={isRunning || topic.trim().length < 10}
                  style={{
                    width: "100%",
                    padding: "13px 0",
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
          </div>

          {/* ── CENTER: Pipeline stages ──────────────────────────────────────── */}
          <div>
            {stage === "idle" ? (
              <Card variant="flat">
                <div
                  style={{
                    padding: 64,
                    textAlign: "center",
                    color: "var(--bru-grey)",
                  }}
                >
                  <Zap size={48} style={{ marginBottom: 16, opacity: 0.25 }} />
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
            ) : (
              <>
                {STAGE_ORDER.map((stageName) => (
                  <StageCard
                    key={stageName}
                    name={stageName}
                    currentStage={stage}
                    content={stageContent[stageName] ?? ""}
                    isComplete={completedStages.has(stageName)}
                  />
                ))}

                {error && (
                  <Card
                    variant="raised"
                    style={{ borderLeft: "4px solid #E99898" }}
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
                          <Link
                            href="/settings"
                            style={{
                              display: "inline-block",
                              marginTop: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--bru-purple)",
                            }}
                          >
                            Go to Settings →
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {isComplete && savedId && (
                  <Card
                    variant="flat"
                    style={{ borderLeft: "4px solid #00A896" }}
                  >
                    <div
                      style={{
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <CheckCircle size={15} color="#00A896" />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#00A896",
                        }}
                      >
                        Saved to Library
                      </span>
                      <Link
                        href={`/library/${savedId}`}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--bru-purple)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        View post <ExternalLink size={12} />
                      </Link>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Score + Actions ───────────────────────────────────────── */}
          <div>
            {/* Score card */}
            {score && (
              <Card variant="raised" style={{ marginBottom: 12 }}>
                <div style={{ padding: 20 }}>
                  <h3
                    style={{
                      fontWeight: 800,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      margin: "0 0 16px",
                    }}
                  >
                    Score
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 16,
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

                  {/* Breakdown bars */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
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
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 700 }}>
                              {item.criterion}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: barColor,
                              }}
                            >
                              {item.score}/{item.max}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 4,
                              background: "#eee",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, ratio * 100)}%`,
                                background: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Suggestions */}
                  {score.suggestions.length > 0 && (
                    <div style={{ marginTop: 14 }}>
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
                              fontSize: 12,
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

            {/* Actions */}
            {hasPost && (
              <Card variant="raised" style={{ marginBottom: 12 }}>
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
                    Actions
                  </h3>
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
                        padding: "10px 0",
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
                      <Link
                        href={`/library/${savedId}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "10px 0",
                          background: "var(--bru-purple)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={14} />
                        View in Library
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )}

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
