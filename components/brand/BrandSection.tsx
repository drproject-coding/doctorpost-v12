"use client";
import React, { useState } from "react";
import { Button, Loader } from "@doctorproject/react";

interface BrandSectionProps {
  title: string;
  tag: string;
  color: string;
  children: (editing: boolean) => React.ReactNode;
  onSave: (data: unknown) => Promise<void>;
  onAiGenerate?: () => Promise<void>;
  saving?: boolean;
}

const BrandSection: React.FC<BrandSectionProps> = ({
  title,
  tag,
  color,
  children,
  onSave,
  onAiGenerate,
  saving = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    await onSave({});
    setEditing(false);
  };

  const handleAiGenerate = async () => {
    if (!onAiGenerate) return;
    setAiLoading(true);
    try {
      await onAiGenerate();
      setEditing(true);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        background: "var(--drp-white)",
        border: "var(--drp-border-thin)",
        borderLeftColor: color,
        borderLeftWidth: "3px",
        borderLeftStyle: "solid",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--drp-space-3)",
          padding: "var(--drp-space-3) var(--drp-space-4)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Tag */}
        <span
          style={{
            backgroundColor: `${color}1A`,
            color: color,
            padding: "2px 8px",
            fontSize: "var(--drp-text-xs)",
            fontWeight: "var(--drp-weight-heavy)",
            letterSpacing: "var(--drp-tracking-caps)",
            textTransform: "uppercase" as const,
            fontFamily: "var(--drp-font-primary)",
            flexShrink: 0,
          }}
        >
          {tag}
        </span>

        {/* Title */}
        <span
          style={{
            fontFamily: "var(--drp-font-primary)",
            fontWeight: "var(--drp-weight-bold)",
            fontSize: "var(--drp-text-lg)",
            color: "var(--drp-black)",
            flex: 1,
          }}
        >
          {title}
        </span>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--drp-space-2)",
          }}
        >
          {!editing && onAiGenerate && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={aiLoading ? undefined : "✦"}
              onClick={handleAiGenerate}
              disabled={aiLoading}
              aria-label="AI Generate"
            >
              {aiLoading ? <Loader size="sm" /> : null}
              {aiLoading ? "Generating..." : "Generate"}
            </Button>
          )}

          {!editing && (
            <Button
              variant="secondary"
              size="sm"
              iconLeft="✎"
              onClick={handleEdit}
              aria-label="Edit section"
            >
              Edit
            </Button>
          )}

          {editing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                iconLeft="✕"
                onClick={handleCancel}
                disabled={saving}
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                aria-label="Save section"
              >
                {saving ? <Loader size="sm" /> : null}
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "var(--drp-space-4)" }}>{children(editing)}</div>
    </div>
  );
};

export default BrandSection;
