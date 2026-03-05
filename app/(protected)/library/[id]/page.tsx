"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card } from "@bruddle/react";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Star,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ScoreBreakdownItem {
  criterion: string;
  score: number;
  max: number;
  feedback: string;
  status: string;
}

interface ContentHistoryRow {
  id: string;
  topic: string;
  format: "simple" | "visual" | "carousel";
  post_text: string;
  score: number;
  score_breakdown: ScoreBreakdownItem[];
  score_suggestions: string[];
  formatted_output: {
    type: string;
    post_text?: string;
    visual_brief?: object;
    slides?: object[];
  };
  status: "draft" | "published" | "archived";
  is_favorite: boolean;
  created_at: string;
  strategy_output: {
    angle: string;
    hook_type: string;
    pillar: string;
    icp_label: string;
    word_count_target: number;
    strategic_note: string;
  };
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? "#00A896" : score >= 60 ? "#FF6C01" : "#E99898";
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        border: `6px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 36, fontWeight: 700, color }}>{score}</span>
      <span style={{ fontSize: 12, color: "var(--bru-grey)" }}>/100</span>
    </div>
  );
}

function ScoreLabel({ score }: { score: number }) {
  if (score >= 75) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          background: "#00A896",
          color: "#fff",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        <CheckCircle size={12} /> PASS
      </span>
    );
  }
  if (score >= 60) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          background: "#FF6C01",
          color: "#fff",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        <AlertCircle size={12} /> NEEDS WORK
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        background: "#E99898",
        color: "#fff",
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      <AlertCircle size={12} /> FAIL
    </span>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  const ratio = score / max;
  const color =
    ratio >= 0.75 ? "#00A896" : ratio >= 0.6 ? "#FF6C01" : "#E99898";
  return (
    <div
      style={{
        height: 6,
        background: "#eee",
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function FormatBadge({ format }: { format: string }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        border: "2px solid var(--bru-black)",
        fontWeight: 700,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        background: "var(--bru-cream)",
        color: "var(--bru-black)",
      }}
    >
      {format}
    </span>
  );
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [post, setPost] = useState<ContentHistoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [markingPublished, setMarkingPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: ContentHistoryRow | null = null;

        // Try single-row fetch first
        const res = await fetch(`/api/data/read/posts/${id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          // NCB may return array or object
          data = Array.isArray(json) ? (json[0] ?? null) : json;
        } else {
          // Fallback: filter by id query param
          const res2 = await fetch(`/api/data/read/posts?id=${id}`, {
            credentials: "include",
          });
          if (res2.ok) {
            const json2 = await res2.json();
            data = Array.isArray(json2) ? (json2[0] ?? null) : json2;
          } else {
            throw new Error(`Failed to fetch post (${res2.status})`);
          }
        }

        if (!data) {
          setError("Post not found.");
        } else {
          // Normalise JSON fields that may arrive as strings
          if (typeof data.score_breakdown === "string") {
            try {
              data.score_breakdown = JSON.parse(data.score_breakdown);
            } catch {
              data.score_breakdown = [];
            }
          }
          if (typeof data.score_suggestions === "string") {
            try {
              data.score_suggestions = JSON.parse(data.score_suggestions);
            } catch {
              data.score_suggestions = [];
            }
          }
          if (typeof data.strategy_output === "string") {
            try {
              data.strategy_output = JSON.parse(data.strategy_output);
            } catch {
              data.strategy_output = {} as ContentHistoryRow["strategy_output"];
            }
          }
          setPost(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleCopy = async () => {
    if (!post) return;
    await navigator.clipboard.writeText(post.post_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPublished = async () => {
    if (!post) return;
    setMarkingPublished(true);
    try {
      await fetch(`/api/data/update/posts/${post.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      setPost({ ...post, status: "published" });
    } catch {
      // silently fail — status indicator will not update
    } finally {
      setMarkingPublished(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bru-cream)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontWeight: 600 }}>Loading post…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---------- Error ----------
  if (error || !post) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bru-cream)",
          padding: 24,
        }}
      >
        <button
          onClick={() => router.push("/library")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--bru-purple)",
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} /> Library
        </button>
        <Card variant="raised">
          <div
            style={{
              padding: 48,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertCircle size={32} color="#E99898" />
            <p style={{ fontWeight: 700, fontSize: 18 }}>
              {error ?? "Post not found"}
            </p>
            <Button onClick={() => router.push("/library")}>
              Back to Library
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const scoreBreakdown: ScoreBreakdownItem[] = Array.isArray(
    post.score_breakdown,
  )
    ? post.score_breakdown
    : [];
  const suggestions: string[] = Array.isArray(post.score_suggestions)
    ? post.score_suggestions
    : [];
  const strategy =
    post.strategy_output ?? ({} as ContentHistoryRow["strategy_output"]);

  const strengths = scoreBreakdown.filter(
    (item) => item.status === "pass" || item.score / item.max >= 0.75,
  );
  const weaknesses = scoreBreakdown.filter(
    (item) => item.status !== "pass" && item.score / item.max < 0.75,
  );

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bru-cream)",
        padding: "24px 24px 64px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* ── Header bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <button
              onClick={() => router.push("/library")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                fontSize: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--bru-purple)",
                padding: 0,
                marginBottom: 10,
              }}
            >
              <ArrowLeft size={16} /> Library
            </button>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--bru-black)",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {post.topic}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <FormatBadge format={post.format} />
              {formattedDate && (
                <span style={{ fontSize: 13, color: "var(--bru-grey)" }}>
                  {formattedDate}
                </span>
              )}
              {post.status === "published" && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: "#00A896",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Published
                </span>
              )}
              {post.is_favorite && (
                <Star size={16} color="#FF6C01" fill="#FF6C01" />
              )}
            </div>
          </div>

          {/* Score circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ScoreCircle score={post.score} />
            <ScoreLabel score={post.score} />
          </div>
        </div>

        {/* ── Post text ── */}
        <Card variant="raised" style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>Post Text</span>
              <button
                onClick={() => void handleCopy()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  border: "2px solid var(--bru-black)",
                  background: copied ? "#00A896" : "var(--bru-cream)",
                  color: copied ? "#fff" : "var(--bru-black)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                color: "var(--bru-black)",
                background: "#f9f7f3",
                padding: 16,
                border: "1px solid #ddd",
              }}
            >
              {post.post_text}
            </pre>
          </div>
        </Card>

        {/* ── Score breakdown ── */}
        {scoreBreakdown.length > 0 && (
          <Card variant="raised" style={{ marginBottom: 24 }}>
            <div style={{ padding: 24 }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 20,
                  marginTop: 0,
                }}
              >
                Score Breakdown
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Criterion", "Score", "Progress", "Feedback"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "6px 12px 10px",
                              borderBottom: "2px solid var(--bru-black)",
                              fontWeight: 800,
                              fontSize: 12,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {scoreBreakdown.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.criterion}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            color:
                              item.score / item.max >= 0.75
                                ? "#00A896"
                                : item.score / item.max >= 0.6
                                  ? "#FF6C01"
                                  : "#E99898",
                          }}
                        >
                          {item.score}/{item.max}
                        </td>
                        <td style={{ padding: "10px 12px", minWidth: 100 }}>
                          <ScoreBar score={item.score} max={item.max} />
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontSize: 13,
                            color: "var(--bru-grey)",
                          }}
                        >
                          {item.feedback}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* ── Strengths ── */}
        {strengths.length > 0 && (
          <Card variant="raised" style={{ marginBottom: 24 }}>
            <div style={{ padding: 24 }}>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 16,
                  marginTop: 0,
                  color: "#00A896",
                }}
              >
                Strengths
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {strengths.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(0,168,150,0.08)",
                      border: "1px solid rgba(0,168,150,0.3)",
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <CheckCircle size={14} color="#00A896" />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>
                        {item.criterion}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#00A896",
                          fontWeight: 700,
                          marginLeft: "auto",
                        }}
                      >
                        {item.score}/{item.max}
                      </span>
                    </div>
                    {item.feedback && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--bru-grey)",
                        }}
                      >
                        {item.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Improvement suggestions ── */}
        {post.score < 75 &&
          (suggestions.length > 0 || weaknesses.length > 0) && (
            <Card variant="raised" style={{ marginBottom: 24 }}>
              <div style={{ padding: 24 }}>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    marginBottom: 16,
                    marginTop: 0,
                    color: "#FF6C01",
                  }}
                >
                  Improvement Suggestions
                </h2>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {/* Weak criteria */}
                  {weaknesses.map((item, idx) => (
                    <div
                      key={`w-${idx}`}
                      style={{
                        background: "rgba(255,108,1,0.07)",
                        border: "1px solid rgba(255,108,1,0.25)",
                        padding: "10px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <AlertCircle size={14} color="#FF6C01" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>
                          {item.criterion}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#FF6C01",
                            fontWeight: 700,
                            marginLeft: "auto",
                          }}
                        >
                          {item.score}/{item.max}
                        </span>
                      </div>
                      {item.feedback && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--bru-grey)",
                          }}
                        >
                          {item.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                  {/* Text suggestions */}
                  {suggestions.map((s, idx) => (
                    <div
                      key={`s-${idx}`}
                      style={{
                        background: "rgba(255,108,1,0.07)",
                        border: "1px solid rgba(255,108,1,0.25)",
                        padding: "10px 16px",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertCircle
                        size={14}
                        color="#FF6C01"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--bru-black)",
                        }}
                      >
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

        {/* ── Pipeline inputs ── */}
        <Card variant="raised" style={{ marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: 18,
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              Pipeline Inputs
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { label: "Topic", value: post.topic },
                { label: "Format", value: post.format },
                { label: "Strategy Angle", value: strategy.angle },
                { label: "ICP", value: strategy.icp_label },
                { label: "Hook Type", value: strategy.hook_type },
                { label: "Pillar", value: strategy.pillar },
                {
                  label: "Target Word Count",
                  value: strategy.word_count_target
                    ? String(strategy.word_count_target)
                    : undefined,
                },
              ]
                .filter((f) => f.value)
                .map((field) => (
                  <div key={field.label}>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 11,
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
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--bru-black)",
                      }}
                    >
                      {field.value}
                    </p>
                  </div>
                ))}
            </div>
            {strategy.strategic_note && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "#f9f7f3",
                  border: "1px solid #ddd",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--bru-grey)",
                  }}
                >
                  Strategic Note
                </p>
                <p
                  style={{ margin: 0, fontSize: 13, color: "var(--bru-black)" }}
                >
                  {strategy.strategic_note}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button
            onClick={() => router.push("/factory")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ExternalLink size={16} />
            Open in Studio
          </Button>

          {post.status !== "published" && (
            <Button
              onClick={() => void handleMarkPublished()}
              variant="outline"
              disabled={markingPublished}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {markingPublished ? (
                <>
                  <Loader
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Mark as Published
                </>
              )}
            </Button>
          )}
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
