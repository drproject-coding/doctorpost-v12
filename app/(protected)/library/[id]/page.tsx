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
        const data = rows.find((p) => (p.uuid && p.uuid === id) || String(p.id) === String(id)) ?? null;
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

        {/* Post content */}
        <div
          style={{
            border: "var(--bru-border-thin)",
            background: "var(--bru-white)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13 }}>Post</span>
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
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              color: "var(--bru-black)",
              padding: 20,
            }}
          >
            {post.content}
          </pre>
        </div>

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
