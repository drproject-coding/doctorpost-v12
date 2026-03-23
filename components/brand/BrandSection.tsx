"use client";
import React, { useState } from "react";
import { Button, Card, Icon, Loader } from "@doctorproject/react";

interface BrandSectionProps {
  title: string;
  tag: string;
  color: string;
  onSave: () => Promise<void>;
  saving: boolean;
  onAiGenerate?: () => Promise<void>;
  children: (editing: boolean) => React.ReactNode;
}

export function BrandSection({
  title,
  tag,
  color,
  onSave,
  saving,
  onAiGenerate,
  children,
}: BrandSectionProps) {
  const [editing, setEditing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSave = async () => {
    await onSave();
    setEditing(false);
  };

  const handleAiGenerate = async () => {
    if (!onAiGenerate) return;
    setAiGenerating(true);
    try {
      await onAiGenerate();
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <Card variant="raised">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--drp-space-4)",
          borderBottom: editing ? "2px solid var(--drp-border)" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-3)",
          }}
        >
          <span
            style={{
              fontSize: "var(--drp-text-xs)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "2px 8px",
              background: color,
              color: "#fff",
            }}
          >
            {tag}
          </span>
          <h3
            style={{
              fontSize: "var(--drp-text-md)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>

        <div
          style={{
            display: "flex",
            gap: "var(--drp-space-2)",
            alignItems: "center",
          }}
        >
          {onAiGenerate && !editing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleAiGenerate()}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <>
                  <Loader size="sm" /> Generating…
                </>
              ) : (
                "AI Generate"
              )}
            </Button>
          )}
          {editing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <Icon name="close" size="sm" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader size="sm" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Icon name="edit" size="sm" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div style={{ padding: "var(--drp-space-4)" }}>{children(editing)}</div>
    </Card>
  );
}
