"use client";

import React, { useState, useCallback, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Download,
  FileImage,
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
  onStepClick,
  activeStep,
}: {
  stage: PipelineStage;
  completedStages: Set<string>;
  onStepClick?: (step: StageName) => void;
  activeStep?: string;
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
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: "var(--bru-black)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {isComplete ? "Complete" : `Step ${stepNum} / 4`}
            </span>
            {activeMeta && !isComplete && (
              <>
                <span style={{ color: "#ccc", fontSize: 12, flexShrink: 0 }}>·</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--bru-purple)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
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
                    minWidth: 0,
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
              <div key={s} style={{ flex: 1, cursor: onStepClick && (isDone || isActive || stage === "complete") ? "pointer" : "default" }}
                onClick={() => { if (onStepClick && (isDone || isActive || stage === "complete")) onStepClick(s); }}
              >
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
                    fontWeight: isDone || isActive || activeStep === s ? 700 : 400,
                    color: isDone
                      ? "#00A896"
                      : isActive
                        ? "var(--bru-purple)"
                        : activeStep === s
                          ? "var(--bru-purple)"
                          : "#b0b0b0",
                    marginTop: 5,
                    textAlign: "center",
                    letterSpacing: 0.3,
                    transition: "color 0.3s",
                    textDecoration: stage === "complete" && onStepClick ? "underline" : "none",
                    textDecorationColor: "var(--bru-purple)",
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
  onCopy,
  copied: copiedProp,
}: {
  name: StageName;
  currentStage: PipelineStage;
  content: string;
  isComplete: boolean;
  onCopy?: () => void;
  copied?: boolean;
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
          {isComplete && onCopy && (
            <button
              onClick={onCopy}
              title={copiedProp ? "Copied!" : "Copy post"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: copiedProp ? "#00A896" : "var(--bru-grey)" }}
            >
              {copiedProp ? <Check size={14} /> : <Copy size={14} />}
            </button>
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
  const [resultTab, setResultTab] = useState<"preview" | "score">("preview");
  const [activeStep, setActiveStep] = useState<StageName>("formatter");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "mobile",
  );
  const [showMore, setShowMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

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
    setActiveStep("formatter");

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

      const postUuid = crypto.randomUUID();
      const saveRes = await fetch("/api/data/create/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTopic,
          content: writerRaw,
          status: "draft",
          uuid: postUuid,
          format,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          ...(score ? { score: score.total, score_breakdown: JSON.stringify(score.breakdown), score_suggestions: JSON.stringify(score.suggestions) } : {}),
          strategy_output: JSON.stringify(strategyParsed),
          formatted_output: formatterRaw,
        }),
      });

      if (saveRes.ok) {
        setSavedId(postUuid);
      }
    } catch {
      // Auto-save is non-fatal — user can still copy the post
    }
  }, [topic, format, appendContent, markComplete]);

  const handleManualSave = async () => {
    const text = stageContent.writer ?? postText;
    if (!text) return;
    setIsSaving(true);
    try {
      const formatterContent = stageContent.formatter ?? "";
      let formattedParsed: Record<string, unknown> = {};
      try {
        formattedParsed = JSON.parse(
          stripJsonFences(formatterContent),
        ) as Record<string, unknown>;
      } catch {
        // not JSON
      }
      const postUuid = crypto.randomUUID();
      const saveRes = await fetch("/api/data/create/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic.trim(),
          content: text,
          status: "draft",
          uuid: postUuid,
          format,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          ...(score ? { score: score.total, score_breakdown: JSON.stringify(score.breakdown), score_suggestions: JSON.stringify(score.suggestions) } : {}),
          ...(strategy ? { strategy_output: JSON.stringify(strategy) } : {}),
          formatted_output: formatterContent,
        }),
      });
      if (saveRes.ok) {
        setSavedId(postUuid);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSlideImage = async () => {
    if (!slideRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slideRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `carousel-slide-${currentSlide + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAllPdf = async () => {
    if (carouselSlides.length === 0) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [600, 600],
      });

      for (let i = 0; i < carouselSlides.length; i++) {
        setCurrentSlide(i);
        // wait for DOM update
        await new Promise((r) => setTimeout(r, 120));
        if (!slideRef.current) continue;
        const canvas = await html2canvas(slideRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, 600, 600);
      }

      pdf.save(`carousel-${topic.trim().slice(0, 30) || "post"}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

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
    setActiveStep("formatter");
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

  // Parse carousel slides from formatter output
  interface CarouselSlide {
    number?: number;
    title?: string;
    body?: string;
  }
  let carouselSlides: CarouselSlide[] = [];
  if (format === "carousel" && formatterContent) {
    try {
      const d = JSON.parse(stripJsonFences(formatterContent)) as {
        slides?: CarouselSlide[];
      };
      carouselSlides = d.slides ?? [];
    } catch {
      // not ready yet
    }
  }
  const totalSlides = carouselSlides.length;

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
                onStepClick={isComplete ? setActiveStep : undefined}
                activeStep={activeStep}
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
                {/* Tab bar — Preview | Score */}
                <div
                  style={{
                    display: "flex",
                    borderBottom: "2px solid #e0e0e0",
                    marginBottom: 16,
                  }}
                >
                  {(["preview", "score"] as const).map((tab) => (
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
                      {tab === "preview" ? "Post" : "Score"}
                    </button>
                  ))}
                </div>

                {/* Preview tab — carousel viewport */}
                {resultTab === "preview" &&
                  format === "carousel" &&
                  totalSlides > 0 && (
                    <Card variant="raised">
                      <div style={{ padding: 20 }}>
                        {/* Carousel header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20,
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <h3
                            style={{ fontSize: 15, fontWeight: 700, margin: 0 }}
                          >
                            Carousel Preview{" "}
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 400,
                                color: "var(--bru-grey)",
                              }}
                            >
                              {currentSlide + 1} / {totalSlides}
                            </span>
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            {savedId ? (
                              <a
                                href={`/library/${savedId}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "6px 14px",
                                  background: "#00A896",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  textDecoration: "none",
                                }}
                              >
                                <CheckCircle size={14} />
                                Saved
                              </a>
                            ) : (
                              <button
                                onClick={() => void handleManualSave()}
                                disabled={isSaving}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "6px 14px",
                                  background: isSaving
                                    ? "#aaa"
                                    : "var(--bru-purple)",
                                  color: "white",
                                  border: "none",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  cursor: isSaving ? "not-allowed" : "pointer",
                                }}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader
                                      size={13}
                                      style={{
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    Saving…
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink size={13} />
                                    Save to Library
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => void handleDownloadSlideImage()}
                              disabled={isExporting}
                              title="Download current slide as PNG"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                border: "2px solid var(--bru-black)",
                                background: "transparent",
                                color: "var(--bru-black)",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: isExporting ? "not-allowed" : "pointer",
                              }}
                            >
                              <FileImage size={13} />
                              PNG
                            </button>
                            <button
                              onClick={() => void handleDownloadAllPdf()}
                              disabled={isExporting}
                              title="Download all slides as PDF"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                background: isExporting
                                  ? "#aaa"
                                  : "var(--bru-black)",
                                color: "white",
                                border: "none",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: isExporting ? "not-allowed" : "pointer",
                              }}
                            >
                              {isExporting ? (
                                <>
                                  <Loader
                                    size={13}
                                    style={{
                                      animation: "spin 1s linear infinite",
                                    }}
                                  />
                                  Exporting…
                                </>
                              ) : (
                                <>
                                  <Download size={13} />
                                  PDF
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Slide viewport */}
                        <div
                          ref={slideRef}
                          style={{
                            width: 520,
                            height: 520,
                            margin: "0 auto",
                            background:
                              "linear-gradient(135deg, #631DED 0%, #9B59F5 100%)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: 48,
                            boxSizing: "border-box",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* Slide number badge */}
                          <div
                            style={{
                              position: "absolute",
                              top: 20,
                              right: 20,
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 800,
                              color: "white",
                            }}
                          >
                            {currentSlide + 1}
                          </div>

                          {/* Content */}
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}
                          >
                            {carouselSlides[currentSlide]?.title && (
                              <h2
                                style={{
                                  margin: "0 0 20px",
                                  fontSize:
                                    (carouselSlides[currentSlide].title
                                      ?.length ?? 0) > 40
                                      ? 26
                                      : 32,
                                  fontWeight: 800,
                                  color: "white",
                                  lineHeight: 1.2,
                                  letterSpacing: -0.5,
                                }}
                              >
                                {carouselSlides[currentSlide].title}
                              </h2>
                            )}
                            {carouselSlides[currentSlide]?.body && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 16,
                                  color: "rgba(255,255,255,0.85)",
                                  lineHeight: 1.6,
                                }}
                              >
                                {carouselSlides[currentSlide].body}
                              </p>
                            )}
                          </div>

                          {/* Bottom bar */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingTop: 20,
                              borderTop: "1px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.6)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                              }}
                            >
                              {topic.trim().slice(0, 28) || "LinkedIn Carousel"}
                            </span>
                            <div style={{ display: "flex", gap: 4 }}>
                              {carouselSlides.map((_, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: i === currentSlide ? 20 : 6,
                                    height: 6,
                                    borderRadius: 3,
                                    background:
                                      i === currentSlide
                                        ? "white"
                                        : "rgba(255,255,255,0.3)",
                                    transition: "width 0.3s",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Navigation */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 16,
                            marginTop: 16,
                          }}
                        >
                          <button
                            onClick={() =>
                              setCurrentSlide((s) => Math.max(0, s - 1))
                            }
                            disabled={currentSlide === 0}
                            style={{
                              width: 40,
                              height: 40,
                              border: "2px solid var(--bru-black)",
                              background: "var(--bru-cream)",
                              cursor:
                                currentSlide === 0 ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: currentSlide === 0 ? 0.35 : 1,
                            }}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--bru-grey)",
                              minWidth: 60,
                              textAlign: "center",
                            }}
                          >
                            {currentSlide + 1} / {totalSlides}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentSlide((s) =>
                                Math.min(totalSlides - 1, s + 1),
                              )
                            }
                            disabled={currentSlide === totalSlides - 1}
                            style={{
                              width: 40,
                              height: 40,
                              border: "2px solid var(--bru-black)",
                              background: "var(--bru-cream)",
                              cursor:
                                currentSlide === totalSlides - 1
                                  ? "not-allowed"
                                  : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity:
                                currentSlide === totalSlides - 1 ? 0.35 : 1,
                            }}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>

                        {/* Thumbnail strip */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 16,
                            overflowX: "auto",
                            paddingBottom: 4,
                          }}
                        >
                          {carouselSlides.map((slide, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentSlide(i)}
                              style={{
                                flexShrink: 0,
                                width: 72,
                                height: 72,
                                background:
                                  "linear-gradient(135deg, #631DED 0%, #9B59F5 100%)",
                                border:
                                  i === currentSlide
                                    ? "3px solid var(--bru-black)"
                                    : "3px solid transparent",
                                cursor: "pointer",
                                padding: 8,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                overflow: "hidden",
                                position: "relative",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  left: 5,
                                  fontSize: 9,
                                  fontWeight: 800,
                                  color: "rgba(255,255,255,0.7)",
                                }}
                              >
                                {i + 1}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "white",
                                  lineHeight: 1.2,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical" as const,
                                }}
                              >
                                {slide.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                {/* Stage navigator — when not carousel */}
                {resultTab === "preview" && !(format === "carousel" && totalSlides > 0) && (
                  <div style={{ marginBottom: 12 }}>
                    <StageCard
                      name={activeStep}
                      currentStage="complete"
                      content={stageContent[activeStep] ?? ""}
                      isComplete={completedStages.has(activeStep)}
                      onCopy={activeStep === "formatter" ? () => void handleCopy() : undefined}
                      copied={activeStep === "formatter" ? copied : undefined}
                    />
                  </div>
                )}

                {/* Strategy block — shown in preview tab */}
                {resultTab === "preview" && strategy && (
                  <Card variant="raised" style={{ marginBottom: 12 }}>
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px", color: "var(--bru-black)" }}>
                        Strategy
                      </h3>
                      {[
                        { label: "Angle", value: strategy.angle, color: "#631DED" },
                        { label: "Pillar", value: strategy.pillar_name ?? strategy.pillar, color: "#00A896" },
                        { label: "ICP", value: strategy.icp_label, color: "#FF6C01" },
                        { label: "Hook", value: strategy.hook_type?.replace(/_/g, " "), color: "#D4A800" },
                        { label: "Word Target", value: strategy.word_count_target ? `~${strategy.word_count_target} words` : undefined, color: "var(--bru-black)" },
                      ]
                        .filter((f) => f.value)
                        .map((field) => (
                          <div key={field.label} style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "baseline" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: field.color, minWidth: 60, flexShrink: 0 }}>
                              {field.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--bru-black)" }}>
                              {field.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}

                {/* Preview tab — LinkedIn post */}
                {resultTab === "preview" &&
                  !(format === "carousel" && totalSlides > 0) && (
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
                          <h3
                            style={{ fontSize: 15, fontWeight: 700, margin: 0 }}
                          >
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
                              {copied ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copied ? "Copied!" : "Copy"}
                            </button>

                            {/* Save / Library */}
                            {savedId ? (
                              <a
                                href={`/library/${savedId}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "6px 14px",
                                  background: "#00A896",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  textDecoration: "none",
                                }}
                              >
                                <CheckCircle size={14} />
                                Saved
                              </a>
                            ) : (
                              <button
                                onClick={() => void handleManualSave()}
                                disabled={isSaving}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "6px 14px",
                                  background: isSaving
                                    ? "#aaa"
                                    : "var(--bru-purple)",
                                  color: "white",
                                  border: "none",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  cursor: isSaving ? "not-allowed" : "pointer",
                                }}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader
                                      size={13}
                                      style={{
                                        animation: "spin 1s linear infinite",
                                      }}
                                    />
                                    Saving…
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink size={13} />
                                    Save to Library
                                  </>
                                )}
                              </button>
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

                {/* Saved notice */}
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
                      Saved to Library
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
