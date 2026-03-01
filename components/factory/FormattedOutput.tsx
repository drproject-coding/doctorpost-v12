"use client";
import React from "react";
import { Copy, Check } from "lucide-react";
import type { FormattedPost } from "@/lib/knowledge/types";

interface FormattedOutputProps {
  post: FormattedPost;
}

export function FormattedOutput({ post }: FormattedOutputProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-HTTPS or permission denied)
    }
  };

  return (
    <div className="bru-card bru-card--raised">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--bru-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Formatted Post
        </h3>
        <button
          className="bru-btn"
          onClick={handleCopy}
          style={{ fontSize: "var(--bru-text-sm)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* LinkedIn-style preview */}
      <div
        style={{
          background: "white",
          border: "1px solid #e0e0e0",
          padding: "var(--bru-space-4)",
          maxWidth: 550,
          margin: "0 auto",
        }}
      >
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
          {post.content}
        </pre>
      </div>

      {/* Metadata */}
      <div
        style={{
          marginTop: "var(--bru-space-4)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--bru-space-2)",
        }}
      >
        <MetaStat label="Characters" value={String(post.characterCount)} />
        <MetaStat
          label="Mobile fold"
          value={post.hookBeforeFold.mobile ? "Above" : "Below"}
        />
        <MetaStat
          label="Desktop fold"
          value={post.hookBeforeFold.desktop ? "Above" : "Below"}
        />
        <MetaStat label="Template" value={post.metadata.template} />
        <MetaStat label="Pillar" value={post.metadata.pillar} />
        <MetaStat label="Score" value={String(post.metadata.score)} />
      </div>

      {/* Pinned comment suggestion */}
      {post.suggestedPinnedComment && (
        <div
          style={{
            marginTop: "var(--bru-space-4)",
            padding: "var(--bru-space-3)",
            background: "var(--bru-cream)",
            border: "var(--bru-border)",
          }}
        >
          <h4
            style={{
              fontSize: "var(--bru-text-sm)",
              fontWeight: 700,
              margin: "0 0 var(--bru-space-1)",
            }}
          >
            Suggested Pinned Comment
          </h4>
          <p style={{ fontSize: "var(--bru-text-sm)", margin: 0 }}>
            {post.suggestedPinnedComment}
          </p>
        </div>
      )}
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "var(--bru-space-2)",
        border: "var(--bru-border)",
        fontSize: "var(--bru-text-xs)",
      }}
    >
      <div style={{ color: "var(--bru-grey)" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
