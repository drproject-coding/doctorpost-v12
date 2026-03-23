"use client";
import React, { useState } from "react";
import { Button, Card, Icon } from "@doctorproject/react";
import type { FormattedPost } from "@/lib/knowledge/types";

type PreviewMode = "mobile" | "desktop";

// LinkedIn truncates at ~210 chars on mobile, ~280 on desktop
const FOLD_CHARS = { mobile: 210, desktop: 280 };

interface FormattedOutputProps {
  post: FormattedPost;
  onSave?: () => void;
  isSaving?: boolean;
}

export function FormattedOutput({
  post,
  onSave,
  isSaving,
}: FormattedOutputProps) {
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
          marginBottom: "var(--drp-space-4)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--drp-text-h5)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Formatted Post
        </h3>
        <div style={{ display: "flex", gap: "var(--drp-space-2)" }}>
          {/* Preview mode toggle */}
          <div
            style={{
              display: "flex",
              border: "var(--drp-border-thin)",
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
                fontSize: "var(--drp-text-xs)",
                background:
                  previewMode === "mobile"
                    ? "var(--drp-purple)"
                    : "transparent",
                color: previewMode === "mobile" ? "white" : "var(--drp-grey)",
                border: "none",
                cursor: "pointer",
              }}
            >
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
                fontSize: "var(--drp-text-xs)",
                background:
                  previewMode === "desktop"
                    ? "var(--drp-purple)"
                    : "transparent",
                color: previewMode === "desktop" ? "white" : "var(--drp-grey)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Desktop
            </button>
          </div>
          <Button
            onClick={handleCopy}
            style={{ fontSize: "var(--drp-text-sm)" }}
          >
            {copied ? (
              <Icon name="check" size="sm" />
            ) : (
              <Icon name="download" size="sm" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              style={{ fontSize: "var(--drp-text-sm)" }}
            >
              <Icon name="check" size="sm" />
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
              background: "var(--drp-purple)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "var(--drp-text-h6)",
              flexShrink: 0,
            }}
          >
            Y
          </div>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "var(--drp-text-md)",
                color: "var(--drp-black)",
              }}
            >
              Your Name
            </div>
            <div
              style={{
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-text-muted)",
                lineHeight: 1.3,
              }}
            >
              Your headline here
            </div>
            <div
              style={{
                fontSize: "var(--drp-text-sm)",
                color: "var(--drp-text-muted)",
              }}
            >
              Just now
            </div>
          </div>
        </div>

        {/* Post content */}
        <div style={{ padding: "0 16px 12px" }}>
          <pre
            style={{
              fontSize: "var(--drp-text-md)",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: 0,
              color: "var(--drp-black)",
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
                color: "var(--drp-text-muted)",
                cursor: "pointer",
                fontSize: "var(--drp-text-md)",
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
                color: "var(--drp-text-muted)",
                cursor: "pointer",
                fontSize: "var(--drp-text-md)",
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
            borderTop: "var(--drp-border-thin)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "var(--drp-text-sm)",
            color: "var(--drp-text-muted)",
          }}
        >
          <span>0 reactions</span>
          <span>0 comments</span>
        </div>

        {/* Action bar (simulated) */}
        <div
          style={{
            padding: "4px 16px 8px",
            borderTop: "var(--drp-border-thin)",
            display: "flex",
            justifyContent: "space-around",
            fontSize: "var(--drp-text-sm)",
            fontWeight: 600,
            color: "var(--drp-text-muted)",
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
          marginTop: "var(--drp-space-3)",
          textAlign: "center",
          fontSize: "var(--drp-text-xs)",
          color: "var(--drp-grey)",
        }}
      >
        Hook is{" "}
        <strong
          style={{
            color: postHookBeforeFold[previewMode]
              ? "var(--drp-success-dark, #2d7a3a)"
              : "var(--drp-error-dark, #c0392b)",
          }}
        >
          {postHookBeforeFold[previewMode] ? "above" : "below"}
        </strong>{" "}
        the fold on {previewMode}
      </div>

      {/* Metadata */}
      <div
        style={{
          marginTop: "var(--drp-space-4)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--drp-space-2)",
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
            marginTop: "var(--drp-space-4)",
            padding: "var(--drp-space-3)",
            background: "var(--drp-cream)",
            border: "var(--drp-border)",
          }}
        >
          <h4
            style={{
              fontSize: "var(--drp-text-sm)",
              fontWeight: 700,
              margin: "0 0 var(--drp-space-1)",
            }}
          >
            Suggested Pinned Comment
          </h4>
          <p style={{ fontSize: "var(--drp-text-sm)", margin: 0 }}>
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
        padding: "var(--drp-space-2)",
        border: "var(--drp-border)",
        fontSize: "var(--drp-text-xs)",
      }}
    >
      <div style={{ color: "var(--drp-grey)" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
