"use client";
import React, { useState, useCallback } from "react";
import { Save, X, History } from "lucide-react";

interface DocumentEditorProps {
  documentId: string;
  name: string;
  category: string;
  content: string;
  version: number;
  onSave: (content: string, reason: string) => Promise<void>;
  onClose: () => void;
  onShowHistory: () => void;
}

export function DocumentEditor({
  documentId,
  name,
  category,
  content: initialContent,
  version,
  onSave,
  onClose,
  onShowHistory,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasChanges = content !== initialContent;

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(content, reason || "Manual edit");
      setFeedback("Saved successfully");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [content, reason, hasChanges, onSave]);

  return (
    <div className="bru-card bru-card--raised" style={{ height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--bru-space-4)",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "var(--bru-text-h5)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {name}
          </h3>
          <span
            style={{
              fontSize: "var(--bru-text-sm)",
              color: "var(--bru-grey)",
            }}
          >
            {category} &middot; v{version}
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--bru-space-2)" }}>
          <button
            className="bru-btn bru-btn--ghost"
            onClick={onShowHistory}
            title="Version history"
          >
            <History size={16} />
          </button>
          <button className="bru-btn bru-btn--ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        className="bru-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          minHeight: 400,
          fontFamily: "monospace",
          fontSize: "var(--bru-text-sm)",
          resize: "vertical",
        }}
      />

      {/* Save bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bru-space-3)",
          marginTop: "var(--bru-space-4)",
        }}
      >
        <input
          className="bru-input"
          placeholder="Change reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="bru-btn bru-btn--primary"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            marginTop: "var(--bru-space-3)",
            padding: "var(--bru-space-3)",
            border: "var(--bru-border)",
            fontSize: "var(--bru-text-md)",
            fontWeight: 500,
            background: feedback.startsWith("Error")
              ? "rgba(233, 152, 152, 0.2)"
              : "rgba(152, 233, 171, 0.2)",
            color: feedback.startsWith("Error")
              ? "var(--bru-error-dark)"
              : "var(--bru-success-dark)",
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
