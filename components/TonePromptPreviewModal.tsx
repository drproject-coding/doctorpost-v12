"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Loader } from "@doctorproject/react";
import { resolvePromptTemplate } from "@/lib/knowledge/resolvePromptTemplate";

interface TonePromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  toneId: string;
  toneName: string;
}

export function TonePromptPreviewModal({
  isOpen,
  onClose,
  toneId,
  toneName,
}: TonePromptPreviewModalProps) {
  const [template, setTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !toneId) return;
    setLoading(true);
    resolvePromptTemplate(toneId)
      .then((t) => setTemplate(t))
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  }, [isOpen, toneId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card
        variant="raised"
        style={{
          width: "90%",
          maxWidth: 700,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--drp-space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⊙</span>
            <h3
              style={{
                fontSize: "var(--drp-text-h5)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {toneName} — System Prompt
            </h3>
          </div>
          <Button variant="ghost" iconLeft="✕" onClick={onClose}>
            {""}
          </Button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--drp-space-8)",
                color: "var(--drp-grey)",
              }}
            >
              <Loader />
            </div>
          ) : template ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "monospace",
                fontSize: "var(--drp-text-sm)",
                lineHeight: 1.6,
                padding: "var(--drp-space-4)",
                background: "var(--drp-cream)",
                border: "var(--drp-border)",
                margin: 0,
              }}
            >
              {template}
            </pre>
          ) : (
            <p
              style={{
                textAlign: "center",
                padding: "var(--drp-space-6)",
                color: "var(--drp-grey)",
              }}
            >
              No system prompt template found for this tone. Visit Knowledge
              &gt; Templates to seed tone templates.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "var(--drp-space-4)",
            fontSize: "var(--drp-text-xs)",
            color: "var(--drp-grey)",
          }}
        >
          Variables like {"{{brand.name}}"} are replaced with your brand profile
          at generation time.
        </div>
      </Card>
    </div>
  );
}
