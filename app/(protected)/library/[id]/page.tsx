"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Copy, Check, CheckCircle, Loader } from "lucide-react";

interface Post {
  id: string;
  uuid?: string | null;
  title: string;
  content: string;
  scheduled_at?: string | null;
  pillar?: string | null;
  status?: string | null;
  user_id: string;
  format?: string | null;
  image_url?: string | null;
  score?: number | null;
  score_breakdown?: string | null;
  strategy_output?: string | null;
  formatted_output?: string | null;
}

interface ViewProps {
  post: Post;
  copied: boolean;
  onCopy: () => void;
}

interface CarouselSlide {
  number: number;
  title: string;
  body: string;
}

interface CarouselData {
  slides: CarouselSlide[];
  post_text: string;
}

function CopyButton({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      onClick={onCopy}
      className="bru-btn bru-btn--outline bru-btn--sm"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SimpleView({ post, copied, onCopy }: ViewProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Post
        </span>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <div
        style={{
          background: "#F9F9F9",
          border: "1px solid rgba(0,0,0,0.1)",
          padding: "16px 20px",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        {post.content}
      </div>
    </div>
  );
}

function VisualView({ post, copied, onCopy }: ViewProps) {
  let postText = post.content;
  if (post.formatted_output) {
    try {
      const parsed = JSON.parse(post.formatted_output) as {
        post_text?: string;
      };
      if (parsed.post_text) postText = parsed.post_text;
    } catch {
      /* use content fallback */
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {post.image_url && (
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt="Generated visual"
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              display: "block",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Caption
        </span>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <div
        style={{
          background: "#F9F9F9",
          border: "1px solid rgba(0,0,0,0.1)",
          padding: "16px 20px",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        {postText}
      </div>
    </div>
  );
}

function CarouselView({ post, copied, onCopy }: ViewProps) {
  let slides: CarouselSlide[] = [];
  let postText = post.content;

  if (post.formatted_output) {
    try {
      const parsed = JSON.parse(post.formatted_output) as CarouselData;
      if (Array.isArray(parsed.slides)) slides = parsed.slides;
      if (parsed.post_text) postText = parsed.post_text;
    } catch {
      /* use content fallback */
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {slides.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              display: "block",
              marginBottom: 12,
            }}
          >
            Slides ({slides.length})
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {slides.map((slide) => (
              <div
                key={slide.number}
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderLeft: "3px solid #631DED",
                  padding: "12px 16px",
                  background: "#F9F9F9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#631DED",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      flexShrink: 0,
                    }}
                  >
                    {slide.number}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {slide.title}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#444",
                  }}
                >
                  {slide.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Post Text
        </span>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <div
        style={{
          background: "#F9F9F9",
          border: "1px solid rgba(0,0,0,0.1)",
          padding: "16px 20px",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          fontSize: 15,
        }}
      >
        {postText}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [post, setPost] = useState<Post | null>(null);
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
        // NCB /read/posts/{id} returns 500 — fetch list and filter by id
        const res = await fetch(`/api/data/read/posts`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch post (${res.status})`);
        const json = (await res.json()) as unknown;
        let rows: Post[];
        if (Array.isArray(json)) {
          rows = json as Post[];
        } else if (json && typeof json === "object") {
          const obj = json as Record<string, unknown>;
          rows = (
            Array.isArray(obj.data)
              ? obj.data
              : Array.isArray(obj.rows)
                ? obj.rows
                : []
          ) as Post[];
        } else {
          rows = [];
        }
        const data =
          rows.find(
            (p) => (p.uuid && p.uuid === id) || String(p.id) === String(id),
          ) ?? null;
        if (!data) setError("Post not found.");
        else setPost(data);
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
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPublished = async () => {
    if (!post) return;
    setMarkingPublished(true);
    try {
      await fetch(`/api/data/update/posts/${post.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      setPost({ ...post, status: "published" });
    } catch {
      /* non-fatal */
    } finally {
      setMarkingPublished(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ padding: 48, display: "flex", alignItems: "center", gap: 12 }}
      >
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ padding: 24 }}>
        <button
          onClick={() => router.push("/library")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            color: "var(--bru-purple)",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} /> Library
        </button>
        <p style={{ color: "#E99898", fontWeight: 700 }}>
          {error ?? "Post not found"}
        </p>
      </div>
    );
  }

  const source: "Studio" | "Factory" | "Create" =
    (post.strategy_output ?? post.format)
      ? "Studio"
      : post.status === "scheduled"
        ? "Factory"
        : "Create";

  const sourceStyle = {
    Studio: { bg: "#631DED1A", color: "#631DED" },
    Factory: { bg: "#00A8961A", color: "#00A896" },
    Create: { bg: "#FF6C011A", color: "#FF6C01" },
  }[source];

  const date = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div style={{ padding: "24px 24px 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <button
          onClick={() => router.push("/library")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            color: "var(--bru-purple)",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Library
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 8px",
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </h1>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Source tag */}
              <span
                style={{
                  padding: "2px 10px",
                  background: sourceStyle.bg,
                  color: sourceStyle.color,
                  fontWeight: 800,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {source}
              </span>
              {/* Format tag */}
              {post.format && (
                <span
                  style={{
                    padding: "2px 10px",
                    background:
                      post.format === "carousel"
                        ? "#631DED1A"
                        : post.format === "visual"
                          ? "#D4A8001A"
                          : "#1212120D",
                    color:
                      post.format === "carousel"
                        ? "#631DED"
                        : post.format === "visual"
                          ? "#D4A800"
                          : "#666",
                    fontWeight: 800,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {post.format}
                </span>
              )}
              {post.pillar && (
                <span
                  style={{
                    padding: "2px 10px",
                    border: "2px solid var(--bru-black)",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {post.pillar}
                </span>
              )}
              {date && (
                <span style={{ fontSize: 13, color: "var(--bru-grey)" }}>
                  {date}
                </span>
              )}
              {post.score != null && (
                <span
                  style={{
                    padding: "2px 10px",
                    background: post.score >= 75 ? "#00A896" : "#FF6C01",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  {post.score}/100
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
            </div>
          </div>
        </div>

        {/* Format-aware content rendering */}
        {post.format === "carousel" ? (
          <CarouselView
            post={post}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        ) : post.format === "visual" ? (
          <VisualView
            post={post}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        ) : (
          <SimpleView
            post={post}
            copied={copied}
            onCopy={() => void handleCopy()}
          />
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {post.status !== "published" && (
            <button
              onClick={() => void handleMarkPublished()}
              disabled={markingPublished}
              className="bru-btn bru-btn--outline"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {markingPublished ? (
                <Loader
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <CheckCircle size={14} />
              )}
              {markingPublished ? "Saving…" : "Mark as Published"}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
