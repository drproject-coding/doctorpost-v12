"use client";
import React, { useState } from "react";
import { Button, Card } from "@bruddle/react";
import { Copy, Check, Smartphone, Monitor, Save } from "lucide-react";
import type { FormattedPost } from "@/lib/knowledge/types";

type PreviewMode = "mobile" | "desktop";

// LinkedIn truncates at ~210 chars on mobile, ~280 on desktop
const FOLD_CHARS = { mobile: 210, desktop: 280 };

interface FormattedOutputProps {
  post: FormattedPost;
  onSave?: () => void;
  isSaving?: boolean;
}

export function FormattedOutput({ post, onSave, isSaving }: FormattedOutputProps) {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");
  const [showMore, setShowMore] = useState(false);

  // Provide safe defaults if post data is incomplete
  const postContent = post?.content ?? "";
  const postCharCount = post?.characterCount ?? 0;
  const postHookBeforeFold = post?.hookBeforeFold ?? {
    mobile: false,
    desktop: false,
  };
  const postMetadata = post?.metadata ?? { template: "", pillar: "", score: 0 };
  const postPinnedComment = post?.suggestedPinnedComment ?? "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  const foldAt = FOLD_CHARS[previewMode];
  const isTruncated = postContent.length > foldAt;
  const displayContent =
    isTruncated && !showMore ? postContent.slice(0, foldAt) : postContent;

  const containerWidth = previewMode === "mobile" ? 375 : 550;

  return (
    <Card variant="raised">
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
        <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
          {/* Preview mode toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--bru-border-color, #e0e0e0)",
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
                padding: "4px 8px",
                fontSize: "var(--bru-text-xs)",
                background:
                  previewMode === "mobile"
                    ? "var(--bru-purple)"
                    : "transparent",
                color: previewMode === "mobile" ? "white" : "var(--bru-grey)",
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
                padding: "4px 8px",
                fontSize: "var(--bru-text-xs)",
                background:
                  previewMode === "desktop"
                    ? "var(--bru-purple)"
                    : "transparent",
                color: previewMode === "desktop" ? "white" : "var(--bru-grey)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Monitor size={12} />
              Desktop
            </button>
          </div>
          <Button
            onClick={handleCopy}
            style={{ fontSize: "var(--bru-text-sm)" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              style={{ fontSize: "var(--bru-text-sm)" }}
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save to Library"}
            </Button>
          )}
        </div>
      </div>

      {/* LinkedIn-style preview card */}
      <div
        style={{
          maxWidth: containerWidth,
          margin: "0 auto",
          background: "white",
          borderRadius: 8,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Post header (simulated) */}
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
            <div style={{ fontWeight: 600, fontSize: 14, color: "#191919" }}>
              Your Name
            </div>
            <div style={{ fontSize: 12, color: "#666666", lineHeight: 1.3 }}>
              Your headline here
            </div>
            <div style={{ fontSize: 12, color: "#666666" }}>Just now</div>
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

        {/* Engagement bar (simulated) */}
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

        {/* Action bar (simulated) */}
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

      {/* Hook position indicator */}
      <div
        style={{
          marginTop: "var(--bru-space-3)",
          textAlign: "center",
          fontSize: "var(--bru-text-xs)",
          color: "var(--bru-grey)",
        }}
      >
        Hook is{" "}
        <strong
          style={{
            color: postHookBeforeFold[previewMode]
              ? "var(--bru-success-dark, #2d7a3a)"
              : "var(--bru-error-dark, #c0392b)",
          }}
        >
          {postHookBeforeFold[previewMode] ? "above" : "below"}
        </strong>{" "}
        the fold on {previewMode}
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
        <MetaStat label="Characters" value={String(postCharCount)} />
        <MetaStat
          label="Mobile fold"
          value={postHookBeforeFold.mobile ? "Above" : "Below"}
        />
        <MetaStat
          label="Desktop fold"
          value={postHookBeforeFold.desktop ? "Above" : "Below"}
        />
        <MetaStat label="Template" value={postMetadata.template} />
        <MetaStat label="Pillar" value={postMetadata.pillar} />
        <MetaStat label="Score" value={String(postMetadata.score)} />
      </div>

      {/* Pinned comment suggestion */}
      {postPinnedComment && (
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
            {postPinnedComment}
          </p>
        </div>
      )}
    </Card>
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
