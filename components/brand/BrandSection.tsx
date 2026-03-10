"use client";
import React, { useState } from "react";
import { Loader, Sparkles, Pencil, X, Check } from "lucide-react";

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
          gap: "12px",
          padding: "12px 16px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!editing && onAiGenerate && (
            <button
              type="button"
              className="drp-btn drp-btn--sm drp-btn--ghost drp-btn--purple"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              aria-label="AI Generate"
            >
              {aiLoading ? (
                <Loader size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              {aiLoading ? "Generating..." : "Generate"}
            </button>
          )}

          {!editing && (
            <button
              type="button"
              className="drp-btn drp-btn--sm drp-btn--outline"
              onClick={handleEdit}
              aria-label="Edit section"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}

          {editing && (
            <>
              <button
                type="button"
                className="drp-btn drp-btn--sm drp-btn--ghost"
                onClick={handleCancel}
                disabled={saving}
                aria-label="Cancel editing"
              >
                <X size={13} />
                Cancel
              </button>
              <button
                type="button"
                className="drp-btn drp-btn--sm drp-btn--primary"
                onClick={handleSave}
                disabled={saving}
                aria-label="Save section"
              >
                {saving ? (
                  <Loader size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "16px" }}>{children(editing)}</div>
    </div>
  );
};

export default BrandSection;
