"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Loader, Alert, Tag } from "@doctorproject/react";

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
    <Button
      onClick={onCopy}
      variant="outline"
      size="sm"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {copied ? "✓ Copied!" : "⧉ Copy"}
    </Button>
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
          background: "var(--drp-cream)",
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
          background: "var(--drp-cream)",
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
                  borderLeft: "3px solid var(--drp-purple)",
                  padding: "12px 16px",
                  background: "var(--drp-cream)",
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
                      color: "var(--drp-purple)",
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
                    color: "var(--drp-text-secondary)",
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
          background: "var(--drp-cream)",
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
        <Loader label="Loading…" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ padding: 24 }}>
        <Button
          onClick={() => router.push("/library")}
          variant="ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 700,
            color: "var(--drp-purple)",
            marginBottom: 16,
          }}
        >
          ‹ Library
        </Button>
        <Alert variant="error">{error ?? "Post not found"}</Alert>
      </div>
    );
  }

  const source: "Studio" | "Factory" | "Create" =
    (post.strategy_output ?? post.format)
      ? "Studio"
      : post.status === "scheduled"
        ? "Factory"
        : "Create";

  const SOURCE_TAG_COLOR: Record<string, "purple" | "mint" | "yellow"> = {
    Studio: "purple",
    Factory: "mint",
    Create: "yellow",
  };

  const FORMAT_TAG_COLOR: Record<string, "purple" | "yellow" | "grey"> = {
    carousel: "purple",
    visual: "yellow",
    simple: "grey",
  };

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
        <Button
          onClick={() => router.push("/library")}
          variant="ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 700,
            color: "var(--drp-purple)",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          ‹ Library
        </Button>

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
              <Tag color={SOURCE_TAG_COLOR[source] ?? "grey"} filled>
                {source}
              </Tag>
              {/* Format tag */}
              {post.format && (
                <Tag color={FORMAT_TAG_COLOR[post.format] ?? "grey"} filled>
                  {post.format}
                </Tag>
              )}
              {post.pillar && <Tag color="grey">{post.pillar}</Tag>}
              {date && (
                <span style={{ fontSize: 13, color: "var(--drp-text-muted)" }}>
                  {date}
                </span>
              )}
              {post.score != null && (
                <Tag color={post.score >= 75 ? "mint" : "yellow"} filled>
                  {post.score}/100
                </Tag>
              )}
              {post.status === "published" && (
                <Tag color="mint" filled>
                  Published
                </Tag>
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
            <Button
              onClick={() => void handleMarkPublished()}
              disabled={markingPublished}
              variant="outline"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {markingPublished ? <Loader size="sm" /> : null}
              {markingPublished ? "Saving…" : "✓ Mark as Published"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
