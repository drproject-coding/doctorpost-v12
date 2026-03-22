"use client";

import React, { useState } from "react";
import { Button, Card, Icon, Loader } from "@doctorproject/react";
import type { FormattedPost } from "@/lib/knowledge/types";

interface TonePromptPreviewModalProps {
  isOpen: boolean;
  post?: FormattedPost;
  toneId?: string;
  toneName?: string;
  onClose: () => void;
  onConfirm?: (tone: string, style: string) => void;
}

const TONE_OPTIONS = [
  "Professional",
  "Casual",
  "Inspirational",
  "Educational",
  "Humorous",
];

const STYLE_OPTIONS = [
  "Technical",
  "Narrative",
  "Data-driven",
  "Question-based",
  "Story-based",
];

export function TonePromptPreviewModal({
  isOpen,
  post,
  onClose,
  onConfirm,
}: TonePromptPreviewModalProps) {
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTone && selectedStyle) {
      onConfirm?.(selectedTone, selectedStyle);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <Card
        variant="raised"
        style={{
          maxWidth: 600,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
            Adjust Tone & Style
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Icon name="eye" size="sm" />
          </button>
        </div>

        {/* Tone Selection */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <h4
            style={{
              fontSize: "var(--drp-text-sm)",
              fontWeight: 700,
              margin: 0,
              marginBottom: "var(--drp-space-2)",
            }}
          >
            Tone
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "var(--drp-space-2)",
            }}
          >
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                style={{
                  padding: "var(--drp-space-2)",
                  border:
                    selectedTone === tone
                      ? "2px solid var(--drp-purple)"
                      : "var(--drp-border)",
                  background:
                    selectedTone === tone
                      ? "rgba(99, 29, 237, 0.1)"
                      : "transparent",
                  cursor: "pointer",
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: selectedTone === tone ? 700 : 400,
                }}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div style={{ marginBottom: "var(--drp-space-4)" }}>
          <h4
            style={{
              fontSize: "var(--drp-text-sm)",
              fontWeight: 700,
              margin: 0,
              marginBottom: "var(--drp-space-2)",
            }}
          >
            Style
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "var(--drp-space-2)",
            }}
          >
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                style={{
                  padding: "var(--drp-space-2)",
                  border:
                    selectedStyle === style
                      ? "2px solid var(--drp-purple)"
                      : "var(--drp-border)",
                  background:
                    selectedStyle === style
                      ? "rgba(99, 29, 237, 0.1)"
                      : "transparent",
                  cursor: "pointer",
                  fontSize: "var(--drp-text-sm)",
                  fontWeight: selectedStyle === style ? 700 : 400,
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--drp-purple)",
            fontSize: "var(--drp-text-sm)",
            textDecoration: "underline",
            marginBottom: "var(--drp-space-3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-1)",
          }}
        >
          <Icon name="eye" size="sm" />
          {showPreview ? "Hide preview" : "Show preview"}
        </button>

        {showPreview && post && (
          <Card
            variant="flat"
            style={{
              marginBottom: "var(--drp-space-4)",
              background: "var(--drp-surface)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "var(--drp-text-sm)",
                whiteSpace: "pre-wrap",
              }}
            >
              {post.content}
            </p>
            <p
              style={{
                marginTop: "var(--drp-space-2)",
                fontSize: "var(--drp-text-xs)",
                color: "var(--drp-grey)",
              }}
            >
              Tone: <strong>{selectedTone}</strong> | Style:{" "}
              <strong>{selectedStyle}</strong>
            </p>
          </Card>
        )}

        {/* Loading state */}
        {!post && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "var(--drp-space-2)",
              marginBottom: "var(--drp-space-4)",
            }}
          >
            <Loader size="sm" />
            <span style={{ fontSize: "var(--drp-text-sm)" }}>Loading...</span>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedTone || !selectedStyle}
          >
            Apply Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
